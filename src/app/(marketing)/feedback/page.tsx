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
import { Badge } from "@/components/ui/badge";
import { AnimateIn } from "@/components/motion/animate-in";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-group";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientOrbs } from "@/components/backgrounds/gradient-orbs";

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
        <div className="max-w-5xl mx-auto text-center">
          <AnimateIn direction="up" delay={0} once>
            <Badge className="mb-4 bg-red-500/10 text-red-400 border-red-500/30">
              Direct Line to the Founder
            </Badge>
          </AnimateIn>

          <AnimateIn direction="up" delay={0.1} once>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Be Brutal. <span className="text-emerald-400">I Can Take It.</span>
            </h1>
          </AnimateIn>

          <AnimateIn direction="up" delay={0.15} once>
            <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
              If something doesn&apos;t work, if a feature is broken, if you have ideas for improvements—I want to hear it.
              No sugarcoating needed. Your honest feedback makes CabbageSEO better for everyone.
            </p>
          </AnimateIn>

          <AnimateIn direction="up" delay={0.2} once>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://x.com/Arjun06061"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" className="bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.06] w-full sm:w-auto">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  DM me on X (Twitter)
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </a>

              <a href="mailto:arjun@cabbageseo.com">
                <Button size="lg" className="bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.06] w-full sm:w-auto">
                  <Mail className="w-5 h-5 mr-2" />
                  Email: arjun@cabbageseo.com
                </Button>
              </a>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* FEEDBACK TYPES */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <AnimateIn direction="up" delay={0} once>
            <h2 className="text-2xl font-bold text-white text-center mb-12">
              What Can You Report?
            </h2>
          </AnimateIn>

          <StaggerGroup className="grid md:grid-cols-2 gap-6" stagger={0.08}>
            {feedbackTypes.map((type, i) => (
              <StaggerItem key={i}>
                <GlassCard hover padding="md">
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
                            : "border-white/[0.06] text-zinc-400"
                        }`}>
                          {type.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-zinc-400">{type.description}</p>
                    </div>
                  </div>
                </GlassCard>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* MY COMMITMENTS */}
      <section className="py-16 px-4 bg-zinc-900/30">
        <div className="max-w-5xl mx-auto">
          <AnimateIn direction="up" delay={0} once>
            <h2 className="text-2xl font-bold text-white text-center mb-12">
              My Commitments to You
            </h2>
          </AnimateIn>

          <StaggerGroup className="grid md:grid-cols-3 gap-6" stagger={0.1}>
            {commitments.map((item, i) => (
              <StaggerItem key={i}>
                <GlassCard hover={false} padding="md" className="text-center h-full">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-zinc-400">{item.description}</p>
                </GlassCard>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* WHAT MAKES GREAT FEEDBACK */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <AnimateIn direction="up" delay={0} once>
            <GlassCard hover={false} padding="lg" glow="emerald">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">How to Give Great Feedback</h3>
              </div>
              <p className="text-sm text-zinc-400 mb-4">
                The more specific, the faster I can fix it
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-emerald-400 font-mono text-sm">1.</span>
                  <p className="text-zinc-300 text-sm">
                    <strong className="text-white">What were you trying to do?</strong><br />
                    <span className="text-zinc-400">&quot;I was trying to run a citation check for my site...&quot;</span>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-emerald-400 font-mono text-sm">2.</span>
                  <p className="text-zinc-300 text-sm">
                    <strong className="text-white">What happened instead?</strong><br />
                    <span className="text-zinc-400">&quot;The page just spun forever and then showed...&quot;</span>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-emerald-400 font-mono text-sm">3.</span>
                  <p className="text-zinc-300 text-sm">
                    <strong className="text-white">Any error messages?</strong><br />
                    <span className="text-zinc-400">&quot;It said &apos;Failed to generate&apos; or just a blank screen&quot;</span>
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
            </GlassCard>
          </AnimateIn>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden py-16 px-4">
        <GradientOrbs variant="emerald" />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <AnimateIn direction="up" delay={0} once>
            <h2 className="text-2xl font-bold text-white mb-4">
              Ready to Share Your Thoughts?
            </h2>
            <p className="text-zinc-400 mb-8">
              Don&apos;t hold back. The best products are built with honest user feedback.
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

              <Link href="/">
                <Button size="lg" className="bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.06] w-full sm:w-auto">
                  Back to Home
                </Button>
              </Link>
            </div>
          </AnimateIn>
        </div>
      </section>
    </div>
  );
}
