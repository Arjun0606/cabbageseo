"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Mail, Building, Globe, Camera, Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Skeleton } from "@/components/ui/skeleton";

// ============================================
// TYPES
// ============================================

interface AccountData {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    website: string;
    timezone: string;
  } | null;
}

// ============================================
// LOADING SKELETON
// ============================================

function SettingsLoading() {
  return (
    <div className="space-y-6 max-w-2xl">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function AccountSettingsPage() {
  const queryClient = useQueryClient();
  const [hasChanges, setHasChanges] = useState(false);

  // Local form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    website: "",
    timezone: "UTC",
  });

  // Fetch account data
  const { data, isLoading, error, refetch } = useQuery<AccountData>({
    queryKey: ["account-settings"],
    queryFn: async () => {
      const response = await fetch("/api/settings/account");
      if (!response.ok) throw new Error("Failed to fetch account");
      const json = await response.json();
      return json.data;
    },
  });

  // Initialize form when data loads
  useEffect(() => {
    if (data) {
      setFormData({
        name: data.name || "",
        email: data.email || "",
        company: data.organization?.name || "",
        website: data.organization?.website || "",
        timezone: data.organization?.timezone || "UTC",
      });
    }
  }, [data]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (updates: Record<string, string>) => {
      const response = await fetch("/api/settings/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: updates.name,
          organizationName: updates.company,
          website: updates.website,
          timezone: updates.timezone,
        }),
      });
      if (!response.ok) throw new Error("Failed to save");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-settings"] });
      setHasChanges(false);
    },
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return <SettingsLoading />;
  }

  if (error) {
    return (
      <Card className="p-6 max-w-2xl">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <div>
            <p className="font-medium">Failed to load account settings</p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Please try again"}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-auto">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

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
            <AvatarImage src={data?.avatarUrl || ""} />
            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
              {formData.name.charAt(0).toUpperCase() || "U"}
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
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="pr-20"
                />
                {data?.emailVerified && (
                  <Badge className="absolute right-2 top-1/2 -translate-y-1/2" variant="secondary">
                    Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company">Company / Organization</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleChange("company", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://"
                value={formData.website}
                onChange={(e) => handleChange("website", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>
            Customize your experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={formData.timezone}
              onValueChange={(value) => handleChange("timezone", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                <SelectItem value="Europe/London">London (GMT)</SelectItem>
                <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Role</span>
            <Badge variant="secondary">{data?.role || "member"}</Badge>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Plan</span>
            <Badge variant="outline" className="capitalize">{data?.organization?.plan || "starter"}</Badge>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Member since</span>
            <span>{data?.createdAt ? new Date(data.createdAt).toLocaleDateString() : "-"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        {hasChanges && (
          <Button
            variant="ghost"
            onClick={() => {
              if (data) {
                setFormData({
                  name: data.name || "",
                  email: data.email || "",
                  company: data.organization?.name || "",
                  website: data.organization?.website || "",
                  timezone: data.organization?.timezone || "UTC",
                });
                setHasChanges(false);
              }
            }}
          >
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : saveMutation.isSuccess ? (
            <Check className="w-4 h-4 mr-2" />
          ) : null}
          {saveMutation.isSuccess ? "Saved!" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
