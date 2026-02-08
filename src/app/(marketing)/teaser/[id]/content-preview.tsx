"use client";

import Link from "next/link";
import { ArrowRight, Lock, FileText, Sparkles, HelpCircle } from "lucide-react";

interface ContentPreviewProps {
  domain: string;
  preview: {
    title: string;
    metaDescription: string;
    firstParagraph: string;
    blurredBody: string;
    faqItems: Array<{ question: string; answer: string }>;
    wordCount: number;
    competitorUsed: string;
  };
}

export default function ContentPreview({ domain, preview }: ContentPreviewProps) {
  return (
    <div className="bg-zinc-900 border border-emerald-500/20 rounded-2xl overflow-hidden mb-8">
      {/* Header banner */}
      <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-emerald-400" />
        <span className="text-sm font-medium text-emerald-400">
          We already started building this for you
        </span>
      </div>

      <div className="p-6">
        {/* Page title preview */}
        <div className="mb-6">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <FileText className="w-3 h-3" />
            AI-Optimized Comparison Page
          </p>
          <h3 className="text-xl font-bold text-white mb-1">
            {preview.title}
          </h3>
          <p className="text-sm text-zinc-400 italic">
            {preview.metaDescription}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
            <span>{preview.wordCount} words</span>
            <span>|</span>
            <span>FAQ schema included</span>
            <span>|</span>
            <span>AI-ready structure</span>
          </div>
        </div>

        {/* Visible first paragraph */}
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 mb-4">
          <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
            {preview.firstParagraph}
          </div>
        </div>

        {/* Blurred body content */}
        <div className="relative mb-6">
          <div
            className="bg-zinc-800/30 border border-zinc-800 rounded-xl p-4 select-none blur-[6px] pointer-events-none"
            aria-hidden="true"
          >
            <div className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">
              {preview.blurredBody}
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-zinc-900/90 border border-zinc-700 rounded-xl px-6 py-4 text-center shadow-xl">
              <Lock className="w-5 h-5 text-zinc-400 mx-auto mb-2" />
              <p className="text-white font-medium text-sm mb-1">
                Full page ready to publish
              </p>
              <p className="text-zinc-400 text-xs">
                Sign up to get the complete {preview.wordCount}-word page
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Preview — first one visible, rest blurred */}
        {preview.faqItems.length > 0 && (
          <div className="mb-6">
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <HelpCircle className="w-3 h-3" />
              FAQ Schema (AI-Citable)
            </p>
            <div className="space-y-2">
              {preview.faqItems.map((faq, i) => (
                <div
                  key={i}
                  className={`rounded-lg p-3 ${
                    i === 0
                      ? "bg-zinc-800/50 border border-zinc-700"
                      : "bg-zinc-800/30 border border-zinc-800"
                  }`}
                >
                  <p className={`text-sm font-medium mb-1 ${i === 0 ? "text-white" : "text-zinc-300"}`}>
                    Q: {faq.question}
                  </p>
                  <p
                    className={`text-xs leading-relaxed ${
                      i === 0
                        ? "text-zinc-400"
                        : "text-zinc-600 select-none blur-[6px]"
                    }`}
                  >
                    {faq.answer}
                  </p>
                  {i > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Lock className="w-3 h-3 text-zinc-600" />
                      <span className="text-zinc-600 text-xs">Unlock with signup</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <Link
          href={`/signup?domain=${encodeURIComponent(domain)}`}
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-colors"
        >
          Get this page + your full action plan
          <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="text-xs text-zinc-500 text-center mt-2">
          Free 7-day trial — We generate the content, you just publish it
        </p>
      </div>
    </div>
  );
}
