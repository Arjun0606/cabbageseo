import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AnimateIn } from "@/components/motion/animate-in";

export const metadata: Metadata = {
  title: "Terms of Service | CabbageSEO",
  description: "Terms of service for CabbageSEO AI Visibility Intelligence platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <Button variant="ghost" className="mb-8 text-zinc-400 hover:text-zinc-100" asChild>
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>
        </Button>

        <AnimateIn direction="up" delay={0} once>
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        </AnimateIn>

        <div className="space-y-6 text-zinc-400">
          <AnimateIn direction="up" delay={0} once>
            <p className="text-zinc-300">
              Last updated: February 8, 2026
            </p>
          </AnimateIn>

          <AnimateIn direction="up" delay={0.05} once>
            <section>
              <h2 className="text-xl font-semibold text-zinc-100 mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing or using CabbageSEO, you agree to be bound by these Terms of Service.
                If you do not agree, please do not use our services.
              </p>
            </section>
          </AnimateIn>

          <AnimateIn direction="up" delay={0.1} once>
            <section>
              <h2 className="text-xl font-semibold text-zinc-100 mb-3">2. Description of Service</h2>
              <p>
                CabbageSEO provides AI visibility intelligence tools that track how AI platforms
                (ChatGPT, Perplexity, Google AI) recommend products in your market.
                We help you understand your current AI visibility and how to improve it.
              </p>
            </section>
          </AnimateIn>

          <AnimateIn direction="up" delay={0.15} once>
            <section>
              <h2 className="text-xl font-semibold text-zinc-100 mb-3">3. Your Responsibilities</h2>
              <p>You agree to:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Provide accurate account information</li>
                <li>Only analyze websites you own or have permission to analyze</li>
                <li>Not use our service for spam, deceptive practices, or illegal activities</li>
                <li>Not attempt to reverse-engineer or exploit our systems</li>
              </ul>
            </section>
          </AnimateIn>

          <AnimateIn direction="up" delay={0.2} once>
            <section>
              <h2 className="text-xl font-semibold text-zinc-100 mb-3">4. Content Ownership</h2>
              <p>
                You retain ownership of all content you create using CabbageSEO.
                You grant us a license to store and process this content as needed to provide our services.
              </p>
            </section>
          </AnimateIn>

          <AnimateIn direction="up" delay={0.25} once>
            <section>
              <h2 className="text-xl font-semibold text-zinc-100 mb-3">5. AI Data and Recommendations</h2>
              <p>
                Data from AI platforms is provided as-is based on their responses at the time of checking.
                AI recommendations change frequently and we cannot guarantee future visibility or rankings.
                All suggestions are for informational purposes.
              </p>
            </section>
          </AnimateIn>

          <AnimateIn direction="up" delay={0.3} once>
            <section>
              <h2 className="text-xl font-semibold text-zinc-100 mb-3">6. Billing</h2>
              <p>
                Paid plans are billed according to your selected plan.
                Refunds are available within 14 days of purchase if you&apos;re not satisfied.
              </p>
            </section>
          </AnimateIn>

          <AnimateIn direction="up" delay={0.35} once>
            <section>
              <h2 className="text-xl font-semibold text-zinc-100 mb-3">7. Limitation of Liability</h2>
              <p>
                CabbageSEO is provided &quot;as is&quot; without warranties of any kind.
                We are not liable for any damages arising from the use of our services,
                including loss of data, revenue, or business opportunities.
              </p>
            </section>
          </AnimateIn>

          <AnimateIn direction="up" delay={0.4} once>
            <section>
              <h2 className="text-xl font-semibold text-zinc-100 mb-3">8. Changes to Terms</h2>
              <p>
                We may update these terms at any time. Continued use of CabbageSEO after
                changes constitutes acceptance of the new terms.
              </p>
            </section>
          </AnimateIn>

          <AnimateIn direction="up" delay={0.45} once>
            <section>
              <h2 className="text-xl font-semibold text-zinc-100 mb-3">9. Contact</h2>
              <p>
                Questions about these terms? Email us at arjun@cabbageseo.com or reach out on <a href="https://x.com/Arjun06061" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">X Twitter</a>.
              </p>
            </section>
          </AnimateIn>
        </div>
      </div>
    </div>
  );
}
