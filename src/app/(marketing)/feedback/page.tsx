"use client";

import Link from "next/link";
import {
  MessageSquare,
  Bug,
  Lightbulb,
  Heart,
  ExternalLink,
  Mail,
  ArrowRight,
  Zap,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ============================================
// FEEDBACK PAGE - Be Brutal, We Can Take It!
// ============================================

export default function FeedbackPage() {
  const feedbackTypes = [
    {
      icon: Bug,
      title: "Something's Broken",
      description: "Found a bug or something not working? Tell me exactly what happened.",
      color: "red",
      priority: "High Priority",
    },
    {
      icon: AlertTriangle,
      title: "Feature Not Working",
      description: "A promised feature isn't delivering? I want to know immediately.",
      color: "orange",
      priority: "High Priority",
    },
    {
      icon: Lightbulb,
      title: "Feature Request",
      description: "Have an idea that would make CabbageSEO better? I'm all ears.",
      color: "yellow",
      priority: "Normal",
    },
    {
      icon: Heart,
      title: "General Feedback",
      description: "Love it? Hate it? Somewhere in between? Let me know.",
      color: "emerald",
      priority: "Normal",
    },
  ];

  const commitments = [
    {
      icon: CheckCircle2,
      title: "I Read Every Message",
      description: "No support tickets that disappear into the void. I personally read and respond to every piece of feedback.",
    },
    {
      icon: Zap,
      title: "Fast Response Time",
      description: "Critical bugs get fixed within 24 hours. Feature requests are reviewed weekly.",
    },
    {
      icon: Heart,
      title: "Your Success = My Success",
      description: "I built CabbageSEO to help you get cited by AI. If it's not working, I need to fix it.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
      {/* HERO */}
      <section className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-red-500/10 text-red-400 border-red-500/30">
            🎯 Direct Line to the Founder
          </Badge>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Be Brutal. <span className="text-emerald-400">I Can Take It.</span>
          </h1>
          
          <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
            If something doesn't work, if a feature is broken, if you have ideas for improvements—I want to hear it. 
            No sugarcoating needed. Your honest feedback makes CabbageSEO better for everyone.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://x.com/Arjun06061"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" className="bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 w-full sm:w-auto">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                DM me on X (Twitter)
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </a>
            
            <a href="mailto:arjun@cabbageseo.com">
              <Button size="lg" className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600 w-full sm:w-auto">
                <Mail className="w-5 h-5 mr-2" />
                Email: arjun@cabbageseo.com
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* FEEDBACK TYPES */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-12">
            What Can You Report?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {feedbackTypes.map((type, i) => (
              <Card key={i} className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      type.color === "red" ? "bg-red-500/20" :
                      type.color === "orange" ? "bg-orange-500/20" :
                      type.color === "yellow" ? "bg-yellow-500/20" :
                      "bg-emerald-500/20"
                    }`}>
                      <type.icon className={`w-6 h-6 ${
                        type.color === "red" ? "text-red-400" :
                        type.color === "orange" ? "text-orange-400" :
                        type.color === "yellow" ? "text-yellow-400" :
                        "text-emerald-400"
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white">{type.title}</h3>
                        <Badge variant="outline" className={`text-xs ${
                          type.priority === "High Priority" 
                            ? "border-red-500/30 text-red-400" 
                            : "border-zinc-700 text-zinc-400"
                        }`}>
                          {type.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-zinc-400">{type.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* MY COMMITMENTS */}
      <section className="py-16 px-4 bg-zinc-900/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-12">
            My Commitments to You
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {commitments.map((item, i) => (
              <Card key={i} className="bg-zinc-900/50 border-zinc-800 text-center">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-zinc-400">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT MAKES GREAT FEEDBACK */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <Card className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                How to Give Great Feedback
              </CardTitle>
              <CardDescription className="text-zinc-400">
                The more specific, the faster I can fix it
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-emerald-400 font-mono text-sm">1.</span>
                  <p className="text-zinc-300 text-sm">
                    <strong className="text-white">What were you trying to do?</strong><br />
                    <span className="text-zinc-400">"I was trying to run a citation check for my site..."</span>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-emerald-400 font-mono text-sm">2.</span>
                  <p className="text-zinc-300 text-sm">
                    <strong className="text-white">What happened instead?</strong><br />
                    <span className="text-zinc-400">"The page just spun forever and then showed..."</span>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-emerald-400 font-mono text-sm">3.</span>
                  <p className="text-zinc-300 text-sm">
                    <strong className="text-white">Any error messages?</strong><br />
                    <span className="text-zinc-400">"It said 'Failed to generate' or just a blank screen"</span>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-emerald-400 font-mono text-sm">4.</span>
                  <p className="text-zinc-300 text-sm">
                    <strong className="text-white">Screenshots help!</strong><br />
                    <span className="text-zinc-400">A picture is worth 1000 bug reports</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to Share Your Thoughts?
          </h2>
          <p className="text-zinc-400 mb-8">
            Don't hold back. The best products are built with honest user feedback.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://x.com/Arjun06061"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                DM @Arjun06061
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </a>
            
            <Link href="/dashboard">
              <Button size="lg" className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600 w-full sm:w-auto">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

