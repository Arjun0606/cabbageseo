"use client";

/**
 * Marketing Layout
 *
 * Header + Footer for all marketing pages.
 * Updated nav with Features, Solutions dropdown, Changelog.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  ArrowRight,
  Twitter,
  Mail,
  ChevronDown
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

// ============================================
// HEADER
// ============================================

const navLinks = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
  { href: "/changelog", label: "Changelog" },
];

const solutionLinks = [
  { href: "/for/saas", label: "For SaaS Founders", desc: "Track and win AI recommendations for your product" },
  { href: "/for/agencies", label: "For Agencies", desc: "Multi-client AI visibility intelligence at scale" },
];

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSolutionsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-zinc-800">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/apple-touch-icon.png"
              alt="CabbageSEO"
              className="h-8 w-8 rounded-lg"
            />
            <span className="font-bold text-white text-lg">CabbageSEO</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.slice(0, 2).map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  pathname === link.href
                    ? "text-white bg-zinc-800/50"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/30"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Solutions Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setSolutionsOpen(!solutionsOpen)}
                className={`flex items-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                  pathname.startsWith("/for/")
                    ? "text-white bg-zinc-800/50"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/30"
                }`}
              >
                Solutions
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${solutionsOpen ? "rotate-180" : ""}`} />
              </button>
              {solutionsOpen && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
                  {solutionLinks.map(link => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block px-4 py-3 hover:bg-zinc-800 transition-colors"
                      onClick={() => setSolutionsOpen(false)}
                    >
                      <span className="text-sm font-medium text-white">{link.label}</span>
                      <span className="block text-xs text-zinc-400 mt-0.5">{link.desc}</span>
                    </Link>
                  ))}
                  <div className="border-t border-zinc-800">
                    <Link
                      href="/vs/manual-tracking"
                      className="block px-4 py-3 hover:bg-zinc-800 transition-colors"
                      onClick={() => setSolutionsOpen(false)}
                    >
                      <span className="text-sm font-medium text-white">Why CabbageSEO?</span>
                      <span className="block text-xs text-zinc-400 mt-0.5">See how we compare to manual tracking</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {navLinks.slice(2).map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  pathname === link.href
                    ? "text-white bg-zinc-800/50"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/30"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-zinc-400 hover:text-white">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-emerald-500 hover:bg-emerald-400 text-black font-medium">
                Get Started
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-zinc-400"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-zinc-800">
            <nav className="flex flex-col gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="px-4 py-2 text-xs font-semibold text-zinc-600 uppercase tracking-wider mt-2">
                Solutions
              </div>
              {solutionLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg pl-6"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/vs/manual-tracking"
                className="px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg pl-6"
                onClick={() => setMobileMenuOpen(false)}
              >
                Why CabbageSEO?
              </Link>
              <hr className="border-zinc-800 my-2" />
              <Link
                href="/login"
                className="px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started →
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

// ============================================
// FOOTER
// ============================================

function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { href: "/features", label: "Features" },
      { href: "/pricing", label: "Pricing" },
      { href: "/changelog", label: "Changelog" },
    ],
    solutions: [
      { href: "/for/saas", label: "For SaaS" },
      { href: "/for/agencies", label: "For Agencies" },
      { href: "/vs/manual-tracking", label: "Why CabbageSEO?" },
    ],
    resources: [
      { href: "/docs", label: "Documentation" },
      { href: "/feedback", label: "Feedback" },
      { href: "/login", label: "Log In" },
      { href: "/signup", label: "Sign Up" },
    ],
    company: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
      { href: "mailto:arjun@cabbageseo.com", label: "Contact Us" },
    ],
  };

  return (
    <footer className="bg-zinc-950 border-t border-zinc-800">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <img
                src="/apple-touch-icon.png"
                alt="CabbageSEO"
                className="h-10 w-10 rounded-lg"
              />
              <span className="font-bold text-white text-xl">CabbageSEO</span>
            </Link>
            <p className="text-zinc-500 text-sm mb-4">
              AI Visibility Intelligence.<br />
              See who AI recommends — and win.
            </p>
            <div className="flex gap-3">
              <a
                href="https://x.com/Arjun06061"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="mailto:arjun@cabbageseo.com"
                className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              {footerLinks.product.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-zinc-500 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h3 className="text-white font-semibold mb-4">Solutions</h3>
            <ul className="space-y-2">
              {footerLinks.solutions.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-zinc-500 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-zinc-500 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-zinc-500 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-zinc-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-zinc-600 text-sm">
              © {currentYear} CabbageSEO. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-zinc-600 hover:text-zinc-400 text-sm">Privacy</Link>
              <Link href="/terms" className="text-zinc-600 hover:text-zinc-400 text-sm">Terms</Link>
              <span className="text-zinc-700 text-sm flex items-center gap-1">
                Made with <img src="/apple-touch-icon.png" alt="" className="w-4 h-4 inline rounded" /> for founders
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ============================================
// LAYOUT
// ============================================

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header />
      <main className="flex-1 pt-16">
        {children}
      </main>
      <Footer />
    </div>
  );
}
