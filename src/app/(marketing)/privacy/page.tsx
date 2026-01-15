import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Button variant="ghost" className="mb-8 text-zinc-400 hover:text-zinc-100" asChild>
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>
        </Button>
        
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="space-y-6 text-zinc-400">
          <p className="text-zinc-300">
            Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
          
          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">1. Information We Collect</h2>
            <p>
              When you use CabbageSEO, we collect information you provide directly, including:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Account information (email, name)</li>
              <li>Website URLs you submit for analysis</li>
              <li>Content you generate through our platform</li>
              <li>Usage data and preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Provide and improve our AI visibility intelligence services</li>
              <li>Track AI platform mentions and recommendations for your websites</li>
              <li>Send you service updates, alerts, and weekly reports</li>
              <li>Protect against fraud and abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">3. Data Sharing</h2>
            <p>
              We share data only with third-party services necessary to provide our product 
              (e.g., AI platform APIs for monitoring recommendations). 
              We do not sell your personal data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">4. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your data, 
              including encryption in transit and at rest.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">5. Your Rights</h2>
            <p>
              You can request access to, correction of, or deletion of your personal data 
              at any time by contacting us at arjun@cabbageseo.com.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">6. Contact</h2>
            <p>
              Questions about this policy? Email us at arjun@cabbageseo.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

