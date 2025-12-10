/**
 * Google OAuth 2.0 Client for CabbageSEO
 * 
 * Security features:
 * - CSRF state token verification
 * - Secure token storage
 * - Automatic token refresh
 * - Scope validation
 */

import { createServiceClient } from "@/lib/supabase/server";
import crypto from "crypto";

// OAuth Configuration
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";

// Required scopes for GSC and GA4
export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/webmasters.readonly",      // GSC read
  "https://www.googleapis.com/auth/analytics.readonly",       // GA4 read
  "https://www.googleapis.com/auth/userinfo.email",           // User email
  "openid",
];

interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
  id_token?: string;
}

interface GoogleUserInfo {
  email: string;
  email_verified: boolean;
  sub: string;
}

export class GoogleOAuthClient {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID || "";
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
    this.redirectUri = process.env.GOOGLE_REDIRECT_URI || 
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/google/callback`;
    
    if (!this.clientId || !this.clientSecret) {
      console.warn("Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
    }
  }

  /**
   * Check if Google OAuth is configured
   */
  isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  /**
   * Generate a secure CSRF state token
   */
  generateStateToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Generate the authorization URL
   */
  getAuthorizationUrl(state: string, additionalScopes?: string[]): string {
    const scopes = [...GOOGLE_SCOPES, ...(additionalScopes || [])];
    
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: "code",
      scope: scopes.join(" "),
      state,
      access_type: "offline",           // Get refresh token
      prompt: "consent",                 // Always show consent to get refresh token
      include_granted_scopes: "true",
    });

    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Google token exchange failed:", error);
      throw new Error(`Failed to exchange code for tokens: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Refresh an access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Google token refresh failed:", error);
      throw new Error(`Failed to refresh token: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Revoke tokens (for disconnecting)
   */
  async revokeToken(token: string): Promise<void> {
    await fetch(`${GOOGLE_REVOKE_URL}?token=${token}`, {
      method: "POST",
    });
  }

  /**
   * Get user info from Google
   */
  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get user info");
    }

    return response.json();
  }

  /**
   * Store tokens securely in database
   */
  async storeTokens(
    _userId: string,
    organizationId: string,
    tokens: GoogleTokens,
    googleEmail: string
  ): Promise<void> {
    const supabase = createServiceClient();
    
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
    
    // Encrypt sensitive data before storage
    const encryptedRefreshToken = tokens.refresh_token 
      ? this.encryptToken(tokens.refresh_token) 
      : null;

    // Direct insert with type assertion (integrations table will be created)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("integrations").upsert({
      organization_id: organizationId,
      type: "google",
      credentials: {
        access_token: tokens.access_token,
        refresh_token_encrypted: encryptedRefreshToken,
        expires_at: expiresAt,
        google_email: googleEmail,
        scopes: tokens.scope.split(" "),
      },
      status: "connected",
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "organization_id,type",
    });

    if (error) {
      console.error("Failed to store Google tokens:", error);
      throw new Error("Failed to store tokens");
    }
  }

  /**
   * Get stored tokens and refresh if needed
   */
  async getValidAccessToken(organizationId: string): Promise<string | null> {
    const supabase = createServiceClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: integration, error } = await (supabase as any)
      .from("integrations")
      .select("credentials")
      .eq("organization_id", organizationId)
      .eq("type", "google")
      .single();

    if (error || !integration?.credentials) {
      return null;
    }

    const { access_token, refresh_token_encrypted, expires_at } = integration.credentials as {
      access_token: string;
      refresh_token_encrypted: string | null;
      expires_at: string;
    };

    // Check if token is still valid (with 5 min buffer)
    const expiresAtDate = new Date(expires_at);
    const now = new Date();
    const buffer = 5 * 60 * 1000; // 5 minutes

    if (expiresAtDate.getTime() - now.getTime() > buffer) {
      return access_token;
    }

    // Token expired, refresh it
    if (!refresh_token_encrypted) {
      console.error("No refresh token available");
      return null;
    }

    const refreshToken = this.decryptToken(refresh_token_encrypted);
    const newTokens = await this.refreshAccessToken(refreshToken);

    // Update stored tokens
    const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("integrations").update({
      credentials: {
        ...integration.credentials,
        access_token: newTokens.access_token,
        expires_at: newExpiresAt,
      },
      updated_at: new Date().toISOString(),
    }).eq("organization_id", organizationId).eq("type", "google");

    return newTokens.access_token;
  }

  /**
   * Encrypt token for secure storage
   */
  private encryptToken(token: string): string {
    const key = process.env.ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      "aes-256-gcm",
      crypto.createHash("sha256").update(key).digest(),
      iv
    );
    
    let encrypted = cipher.update(token, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
  }

  /**
   * Decrypt token from storage
   */
  private decryptToken(encryptedData: string): string {
    const key = process.env.ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const [ivHex, authTagHex, encrypted] = encryptedData.split(":");
    
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      crypto.createHash("sha256").update(key).digest(),
      iv
    );
    
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  }
}

// Singleton export
export const googleOAuth = new GoogleOAuthClient();

