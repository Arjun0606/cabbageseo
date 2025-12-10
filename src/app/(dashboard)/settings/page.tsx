"use client";

import { useState } from "react";
import { User, Mail, Building, Globe, Camera, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function AccountSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({
    name: "Arjun",
    email: "arjun@example.com",
    company: "CabbageSEO",
    website: "https://example.com",
    timezone: "America/New_York",
    bio: "",
  });

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile Photo */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Photo</CardTitle>
          <CardDescription>
            Your photo will be visible to team members
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <Avatar className="w-20 h-20">
            <AvatarImage src="" />
            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
              {profile.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <Button variant="outline" size="sm">
              <Camera className="w-4 h-4 mr-2" />
              Change Photo
            </Button>
            <p className="text-xs text-muted-foreground">
              JPG, PNG or GIF. Max 2MB.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Update your personal details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
                <Badge className="absolute right-2 top-1/2 -translate-y-1/2" variant="secondary">
                  Verified
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={profile.company}
                onChange={(e) => setProfile({ ...profile, company: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={profile.website}
                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={profile.timezone}
              onValueChange={(value) => setProfile({ ...profile, timezone: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                <SelectItem value="Europe/London">London (GMT)</SelectItem>
                <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us a bit about yourself..."
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Brand Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Settings</CardTitle>
          <CardDescription>
            Customize AI-generated content to match your brand
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Writing Style</Label>
            <Select defaultValue="professional">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="audience">Target Audience</Label>
            <Input
              id="audience"
              placeholder="e.g., Small business owners, marketing managers"
              defaultValue="Small business owners looking to improve their SEO"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="topics">Main Topics</Label>
            <Textarea
              id="topics"
              placeholder="Enter topics separated by commas"
              defaultValue="SEO, content marketing, digital marketing, small business growth"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="text-red-500">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions for your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} className="min-w-32">
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Saved!
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  );
}
