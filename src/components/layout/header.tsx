"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Search,
  Bell,
  Moon,
  Sun,
  Command,
  Sparkles,
  ChevronDown,
  LogOut,
  User,
  CreditCard,
  HelpCircle,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

// ============================================
// PAGE TITLES
// ============================================

const pageTitles: Record<string, { title: string; description: string }> = {
  "/dashboard": {
    title: "Dashboard",
    description: "Your SEO mission control",
  },
  "/sites": {
    title: "Sites",
    description: "Manage your websites",
  },
  "/autopilot": {
    title: "Autopilot",
    description: "AI-powered SEO automation",
  },
  "/keywords": {
    title: "Keywords",
    description: "Research and track keywords",
  },
  "/content": {
    title: "Content",
    description: "AI-generated content library",
  },
  "/links": {
    title: "Internal Links",
    description: "Optimize your site structure",
  },
  "/audit": {
    title: "Technical Audit",
    description: "Site health and performance",
  },
  "/analytics": {
    title: "Analytics",
    description: "Track your SEO performance",
  },
  "/geo": {
    title: "GEO Score",
    description: "Optimize for AI search platforms",
  },
  "/settings": {
    title: "Settings",
    description: "Manage your account",
  },
  "/quick-actions": {
    title: "Quick Actions",
    description: "One-click SEO improvements",
  },
  "/ideas": {
    title: "Content Ideas",
    description: "AI-powered content suggestions",
  },
  "/competitors": {
    title: "Competitor Analysis",
    description: "Track your competition",
  },
  "/learn": {
    title: "Learning Center",
    description: "Master SEO with guides",
  },
};

// ============================================
// TYPES
// ============================================

interface UserData {
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

interface NotificationData {
  id: string;
  title: string;
  description: string | null;
  type: "info" | "success" | "warning" | "error";
  category: string;
  read: boolean;
  actionUrl: string | null;
  createdAt: string;
}

// ============================================
// HEADER COMPONENT
// ============================================

interface HeaderProps {
  className?: string;
  onCommandPaletteOpen?: () => void;
}

export function Header({ className, onCommandPaletteOpen }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Fetch user data on mount
  useEffect(() => {
    async function fetchUser() {
      const supabase = createClient();
      if (!supabase) return;

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        // Try to get profile from users table
        const { data: profile } = await supabase
          .from("users")
          .select("name, avatar_url")
          .eq("id", authUser.id)
          .single();

        setUser({
          email: authUser.email || "",
          name: (profile as { name?: string } | null)?.name || authUser.user_metadata?.name || null,
          avatarUrl: (profile as { avatar_url?: string } | null)?.avatar_url || authUser.user_metadata?.avatar_url || null,
        });
      }
    }
    fetchUser();
  }, []);

  // Fetch notifications
  useEffect(() => {
    async function fetchNotifications() {
      setLoadingNotifications(true);
      try {
        const res = await fetch("/api/notifications?limit=10");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setLoadingNotifications(false);
      }
    }
    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Get page info based on current path
  const getPageInfo = () => {
    // Check exact match first
    if (pageTitles[pathname]) {
      return pageTitles[pathname];
    }
    // Check for partial matches (e.g., /content/123)
    for (const [path, info] of Object.entries(pageTitles)) {
      if (pathname.startsWith(path) && path !== "/") {
        return info;
      }
    }
    return { title: "CabbageSEO", description: "AI-powered SEO platform" };
  };

  const pageInfo = getPageInfo();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  const handleLogout = async () => {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push("/");
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleNotificationClick = async (notification: NotificationData) => {
    // Mark as read
    if (!notification.read) {
      try {
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationIds: [notification.id] }),
        });
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
    }

    // Navigate if action URL exists
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  // Get user initials for avatar
  const getInitials = () => {
    if (user?.name) {
      return user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "CS";
  };

  // Format relative time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const typeColors = {
    success: "bg-green-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500",
    error: "bg-red-500",
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-card/80 px-6 backdrop-blur-lg",
        className
      )}
    >
      {/* Left: Page Title */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{pageInfo.title}</h1>
          <p className="text-sm text-muted-foreground">{pageInfo.description}</p>
        </div>
      </div>

      {/* Center: Command Palette Trigger */}
      <div className="flex-1 max-w-xl mx-8">
        <Button
          variant="outline"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={onCommandPaletteOpen}
        >
          <Search className="mr-2 h-4 w-4" />
          <span className="flex-1 text-left">Search or run a command...</span>
          <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <Command className="h-3 w-3" />K
          </kbd>
        </Button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Quick AI Action */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-primary"
          onClick={onCommandPaletteOpen}
        >
          <Sparkles className="h-5 w-5" />
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notifications
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-auto py-1 px-2 text-xs"
                  onClick={handleMarkAllRead}
                >
                  <Check className="w-3 h-3 mr-1" />
                  Mark all read
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {loadingNotifications ? (
                <div className="py-8 text-center">
                  <Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No notifications</p>
                  <p className="text-xs">We&apos;ll notify you about important updates</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors",
                      !notification.read && "bg-primary/5"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className={cn(
                      "mt-1.5 h-2 w-2 rounded-full shrink-0",
                      typeColors[notification.type]
                    )} />
                    <div className="flex-1 space-y-1">
                      <p className={cn(
                        "text-sm leading-tight",
                        !notification.read && "font-medium"
                      )}>
                        {notification.title}
                      </p>
                      {notification.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground/60">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {notifications.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="justify-center text-primary cursor-pointer"
                  onClick={() => router.push("/settings/notifications")}
                >
                  View all notifications
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Dark Mode Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground"
          onClick={toggleDarkMode}
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 pl-2 pr-1">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user?.avatarUrl || ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.name || "CabbageSEO User"}</p>
                <p className="text-xs text-muted-foreground">{user?.email || ""}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings/billing">
                <CreditCard className="mr-2 h-4 w-4" />
                Billing
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/learn">
                <HelpCircle className="mr-2 h-4 w-4" />
                Help & Support
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
