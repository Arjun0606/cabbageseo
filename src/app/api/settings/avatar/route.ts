/**
 * Avatar Upload API
 * 
 * Handles profile photo uploads using Supabase Storage
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  if (!supabase) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: "Invalid file type. Allowed: JPG, PNG, GIF, WebP" 
      }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: "File too large. Maximum size is 2MB" 
      }, { status: 400 });
    }

    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${user.id}/${Date.now()}.${ext}`;

    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      
      // If bucket doesn't exist, try to create it
      if (uploadError.message.includes("bucket") || uploadError.message.includes("not found")) {
        return NextResponse.json({ 
          error: "Storage not configured. Please set up Supabase Storage." 
        }, { status: 503 });
      }
      
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(uploadData.path);

    const avatarUrl = urlData.publicUrl;

    // Update user profile with new avatar URL
    await supabase
      .from("users")
      .update({ 
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString() 
      } as never)
      .eq("id", user.id);

    // Also update auth user metadata
    await supabase.auth.updateUser({
      data: { avatar_url: avatarUrl }
    });

    return NextResponse.json({ 
      success: true, 
      avatarUrl 
    });

  } catch (error) {
    console.error("[Avatar API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload avatar" },
      { status: 500 }
    );
  }
}

// DELETE - Remove avatar
export async function DELETE() {
  const supabase = await createClient();
  
  if (!supabase) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get current avatar URL
    const { data: userData } = await supabase
      .from("users")
      .select("avatar_url")
      .eq("id", user.id)
      .single();

    const profile = userData as { avatar_url?: string } | null;
    
    if (profile?.avatar_url) {
      // Extract path from URL and delete from storage
      const url = new URL(profile.avatar_url);
      const path = url.pathname.split("/avatars/")[1];
      
      if (path) {
        await supabase.storage.from("avatars").remove([path]);
      }
    }

    // Clear avatar from profile
    await supabase
      .from("users")
      .update({ 
        avatar_url: null,
        updated_at: new Date().toISOString() 
      } as never)
      .eq("id", user.id);

    // Clear from auth user metadata
    await supabase.auth.updateUser({
      data: { avatar_url: null }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[Avatar API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete avatar" },
      { status: 500 }
    );
  }
}

