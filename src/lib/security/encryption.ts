/**
 * Encryption utilities for sensitive data storage
 * 
 * Uses AES-256-GCM for authenticated encryption
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

/**
 * Get encryption key from environment
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!key) {
    throw new Error("No encryption key configured");
  }
  return crypto.createHash("sha256").update(key).digest();
}

/**
 * Encrypt sensitive data for storage
 * Returns format: iv:authTag:encryptedData (all hex encoded)
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt data from storage
 * Expects format: iv:authTag:encryptedData (all hex encoded)
 */
export function decrypt(encryptedData: string): string {
  const key = getEncryptionKey();
  const parts = encryptedData.split(":");
  
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted data format");
  }
  
  const [ivHex, authTagHex, encrypted] = parts;
  
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}

/**
 * Encrypt an object (JSON serializes, then encrypts)
 */
export function encryptObject(obj: unknown): string {
  return encrypt(JSON.stringify(obj));
}

/**
 * Decrypt an object (decrypts, then JSON parses)
 */
export function decryptObject<T = unknown>(encryptedData: string): T {
  return JSON.parse(decrypt(encryptedData));
}

/**
 * Check if a string appears to be encrypted data
 * (has the iv:authTag:data format)
 */
export function isEncrypted(data: string): boolean {
  if (!data || typeof data !== "string") return false;
  const parts = data.split(":");
  return parts.length === 3 && parts.every(p => /^[0-9a-f]+$/i.test(p));
}

/**
 * Safely encrypt credentials - handles already encrypted data
 */
export function encryptCredentials(credentials: Record<string, unknown>): string {
  // Check if credentials is already a string (possibly encrypted)
  if (typeof credentials === "string") {
    if (isEncrypted(credentials)) {
      return credentials; // Already encrypted
    }
    return encrypt(credentials);
  }
  return encryptObject(credentials);
}

/**
 * Safely decrypt credentials - handles plain JSON objects
 */
export function decryptCredentials<T = Record<string, unknown>>(data: unknown): T {
  if (!data) return {} as T;
  
  // If it's already an object, return as-is (not encrypted)
  if (typeof data === "object") {
    return data as T;
  }
  
  // If it's a string, try to decrypt
  if (typeof data === "string") {
    if (isEncrypted(data)) {
      return decryptObject<T>(data);
    }
    // Try parsing as JSON (legacy unencrypted data)
    try {
      return JSON.parse(data) as T;
    } catch {
      return {} as T;
    }
  }
  
  return {} as T;
}

