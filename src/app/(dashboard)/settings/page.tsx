"use client";

import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Building2,
  CreditCard,
  BarChart3,
  Shield,
  Bell,
  Plug,
  ExternalLink,
  Check,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

// Mock data - in production this comes from database
const mockUsage = {
  articles: { used: 32, limit: 40, percentage: 80 },
  keywords: { used: 3847, limit: 5000, percentage: 77 },
  serpCalls: { used: 1234, limit: 2000, percentage: 62 },
  crawlPages: { used: 1890, limit: 2500, percentage: 76 },
  onDemand: {
    enabled: true,
    spent: 12.45,
    limit: 300,
    percentage: 4,
  },
};

const mockOrg = {
  name: "My Company",
  plan: "Pro",
  email: "team@mycompany.com",
  billingEmail: "billing@mycompany.com",
};

export default function SettingsPage() {
  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Settings"
        description="Manage your account and preferences"
      />

      <div className="p-6">
        <Tabs defaultValue="usage" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="usage" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Usage</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Billing</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Plug className="h-4 w-4" />
              <span className="hidden sm:inline">Integrations</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>

          {/* Usage Tab */}
          <TabsContent value="usage" className="space-y-6">
            {/* Current Period Usage */}
            <Card>
              <CardHeader>
                <CardTitle>Current Period Usage</CardTitle>
                <CardDescription>
                  Your usage resets on the 1st of each month
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Articles */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Article Generation</Label>
                    <span className="text-sm text-slate-500">
                      {mockUsage.articles.used} / {mockUsage.articles.limit}
                    </span>
                  </div>
                  <Progress value={mockUsage.articles.percentage} />
                  {mockUsage.articles.percentage >= 80 && (
                    <p className="text-xs text-yellow-600">
                      You've used {mockUsage.articles.percentage}% of your article limit
                    </p>
                  )}
                </div>

                {/* Keywords */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Keyword Analysis</Label>
                    <span className="text-sm text-slate-500">
                      {mockUsage.keywords.used.toLocaleString()} / {mockUsage.keywords.limit.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={mockUsage.keywords.percentage} />
                </div>

                {/* SERP Calls */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">SERP API Calls</Label>
                    <span className="text-sm text-slate-500">
                      {mockUsage.serpCalls.used.toLocaleString()} / {mockUsage.serpCalls.limit.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={mockUsage.serpCalls.percentage} />
                </div>

                {/* Crawl Pages */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Page Crawls</Label>
                    <span className="text-sm text-slate-500">
                      {mockUsage.crawlPages.used.toLocaleString()} / {mockUsage.crawlPages.limit.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={mockUsage.crawlPages.percentage} />
                </div>
              </CardContent>
            </Card>

            {/* On-Demand Usage (Cursor-style) */}
            <Card>
              <CardHeader>
                <CardTitle>On-Demand Usage</CardTitle>
                <CardDescription>
                  Configure how usage beyond your plan limits is handled
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enable On-Demand */}
                <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label className="font-medium">On-Demand Usage</Label>
                      <Badge variant="secondary">Recommended</Badge>
                    </div>
                    <p className="text-sm text-slate-500">
                      Allow users on your team to go beyond included usage limits. 
                      On-demand usage is billed in arrears.
                    </p>
                  </div>
                  <Switch checked={mockUsage.onDemand.enabled} />
                </div>

                {/* Spending Limit */}
                {mockUsage.onDemand.enabled && (
                  <div className="space-y-4 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="font-medium">On-Demand Spend Limit</Label>
                        <p className="text-sm text-slate-500">
                          Set monthly spend limits for on-demand usage.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">per month</span>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                          <Input 
                            type="number" 
                            defaultValue={mockUsage.onDemand.limit}
                            className="w-24 pl-7"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Current On-Demand Spending */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Current on-demand spend</span>
                        <span className="font-medium">
                          ${mockUsage.onDemand.spent.toFixed(2)} / ${mockUsage.onDemand.limit}
                        </span>
                      </div>
                      <Progress 
                        value={mockUsage.onDemand.percentage} 
                        className="h-2"
                        indicatorClassName="bg-blue-500"
                      />
                    </div>

                    <Button variant="outline" size="sm">
                      Save Limits
                    </Button>
                  </div>
                )}

                {/* Pricing Info */}
                <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
                  <h4 className="mb-3 text-sm font-medium">On-Demand Pricing</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Article generation</span>
                      <span>$0.19 / article</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Keyword analysis</span>
                      <span>$0.15 / 1,000 keywords</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">SERP API calls</span>
                      <span>$0.006 / call</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Page crawls</span>
                      <span>$0.01 / page</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            {/* Current Plan */}
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>
                  Manage your subscription and billing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-cabbage-200 bg-cabbage-50 p-4 dark:border-cabbage-800 dark:bg-cabbage-950">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{mockOrg.plan} Plan</h3>
                      <Badge>Active</Badge>
                    </div>
                    <p className="text-sm text-slate-500">$59/month • Renews Jan 1, 2025</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline">Change Plan</Button>
                    <Button variant="ghost" className="text-red-600">Cancel</Button>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm text-slate-500">Billing Email</Label>
                    <p className="font-medium">{mockOrg.billingEmail}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-500">Payment Method</Label>
                    <p className="font-medium">•••• •••• •••• 4242</p>
                  </div>
                </div>

                <Button variant="outline" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Manage Billing in Dodo
                </Button>
              </CardContent>
            </Card>

            {/* Invoices */}
            <Card>
              <CardHeader>
                <CardTitle>Invoices</CardTitle>
                <CardDescription>
                  Download your past invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { date: "Dec 1, 2024", amount: "$71.45", status: "Paid" },
                    { date: "Nov 1, 2024", amount: "$59.00", status: "Paid" },
                    { date: "Oct 1, 2024", amount: "$59.00", status: "Paid" },
                  ].map((invoice, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">{invoice.date}</span>
                        <span className="text-sm text-slate-500">{invoice.amount}</span>
                        <Badge variant="success">{invoice.status}</Badge>
                      </div>
                      <Button variant="ghost" size="sm">Download</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Organization</CardTitle>
                <CardDescription>
                  Manage your organization settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Organization Name</Label>
                    <Input defaultValue={mockOrg.name} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input defaultValue={mockOrg.email} />
                  </div>
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  Manage who has access to your organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: "John Doe", email: "john@company.com", role: "Owner" },
                    { name: "Jane Smith", email: "jane@company.com", role: "Admin" },
                  ].map((member, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cabbage-100 font-medium text-cabbage-700 dark:bg-cabbage-900 dark:text-cabbage-100">
                          {member.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-slate-500">{member.email}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{member.role}</Badge>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="mt-4">Invite Member</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Connected Integrations</CardTitle>
                <CardDescription>
                  Manage your external service connections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Google Search Console", status: "connected", icon: "🔍" },
                    { name: "Google Analytics", status: "disconnected", icon: "📊" },
                    { name: "DataForSEO", status: "connected", icon: "📈" },
                    { name: "Ahrefs", status: "disconnected", icon: "🔗" },
                    { name: "WordPress", status: "per-site", icon: "📝" },
                    { name: "Webflow", status: "disconnected", icon: "🎨" },
                  ].map((integration, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-slate-200 p-4 dark:border-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{integration.icon}</span>
                        <div>
                          <p className="font-medium">{integration.name}</p>
                          <p className="text-sm text-slate-500">
                            {integration.status === "connected" && "Connected"}
                            {integration.status === "disconnected" && "Not connected"}
                            {integration.status === "per-site" && "Configured per site"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {integration.status === "connected" && (
                          <Check className="h-5 w-5 text-green-500" />
                        )}
                        <Button 
                          variant={integration.status === "connected" ? "outline" : "default"}
                          size="sm"
                        >
                          {integration.status === "connected" ? "Manage" : "Connect"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>
                  Manage API keys for programmatic access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Production API Key</p>
                      <p className="text-sm text-slate-500">Created Dec 1, 2024</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-slate-100 px-2 py-1 text-sm dark:bg-slate-800">
                        sk_live_••••••••••••••••
                      </code>
                      <Button variant="ghost" size="sm">Reveal</Button>
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="mt-4">Create New Key</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-slate-500">Add an extra layer of security</p>
                  </div>
                  <Button variant="outline">Enable</Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Session Timeout</p>
                    <p className="text-sm text-slate-500">Auto-logout after inactivity</p>
                  </div>
                  <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
                    <option>30 minutes</option>
                    <option>1 hour</option>
                    <option>4 hours</option>
                    <option>Never</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

