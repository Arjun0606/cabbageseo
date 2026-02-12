"use client";

/**
 * Marketing Shell — client wrapper with Header + Footer.
 * Extracted from layout.tsx so the layout can be a server component (for metadata).
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
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimateIn } from "@/components/motion/animate-in";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-group";

// ============================================
// HEADER
// ============================================

const navLinks = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/what-is-geo", label: "What is GEO?" },
  { href: "/blog", label: "Blog" },
];

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-black/70 backdrop-blur-xl border-b border-white/[0.06] shadow-lg shadow-black/20"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      {/* Gradient line at bottom */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent transition-opacity duration-500 ${
          scrolled ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <img
              src="/apple-touch-icon.png"
              alt="CabbageSEO"
              className="h-8 w-8 rounded-lg transition-all duration-300 group-hover:shadow-lg group-hover:shadow-emerald-500/20"
            />
            <span className="font-bold text-white text-lg">CabbageSEO</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link-underline px-3 py-2 text-sm rounded-lg transition-colors ${
                  pathname === link.href
                    ? "text-white"
                    : "text-zinc-400 hover:text-white"
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
              <Button className="relative bg-emerald-500 hover:bg-emerald-400 text-black font-medium group overflow-hidden">
                <span className="relative z-10 flex items-center">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-zinc-400 hover:text-white transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
              className="md:hidden overflow-hidden"
            >
              <div className="py-4 border-t border-white/[0.06]">
                <nav className="flex flex-col gap-1">
                  {navLinks.map(link => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-white/[0.03] rounded-lg transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <hr className="border-white/[0.06] my-2" />
                  <Link
                    href="/login"
                    className="px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-white/[0.03] rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg font-medium transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started →
                  </Link>
                </nav>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
      { href: "/", label: "Free AI Scan" },
      { href: "/changelog", label: "Changelog" },
    ],
    learn: [
      { href: "/what-is-geo", label: "What is GEO?" },
      { href: "/about", label: "About CabbageSEO" },
      { href: "/blog", label: "Blog" },
      { href: "/docs", label: "Documentation" },
    ],
    community: [
      { href: "/feedback", label: "Feedback" },
      { href: "/vs/manual-tracking", label: "CabbageSEO vs Manual" },
    ],
    legal: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
      { href: "mailto:arjun@cabbageseo.com", label: "Contact Us" },
    ],
  };

  return (
    <footer className="relative bg-zinc-950 border-t border-white/[0.06]">
      {/* Gradient line at top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 py-16">
        <StaggerGroup stagger={0.08} className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <StaggerItem className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <img
                src="/apple-touch-icon.png"
                alt="CabbageSEO"
                className="h-10 w-10 rounded-lg transition-shadow duration-300 group-hover:shadow-lg group-hover:shadow-emerald-500/20"
              />
              <span className="font-bold text-white text-xl">CabbageSEO</span>
            </Link>
            <p className="text-zinc-500 text-sm mb-4">
              AI Visibility Intelligence.<br />
              Know where you stand. Fix what&apos;s missing.
            </p>
            <div className="flex gap-3">
              <a
                href="https://x.com/Arjun06061"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.12] transition-all"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="mailto:arjun@cabbageseo.com"
                className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.12] transition-all"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </StaggerItem>

          {/* Product */}
          <StaggerItem>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2.5">
              {footerLinks.product.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-zinc-500 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </StaggerItem>

          {/* Learn */}
          <StaggerItem>
            <h3 className="text-white font-semibold mb-4">Learn</h3>
            <ul className="space-y-2.5">
              {footerLinks.learn.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-zinc-500 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </StaggerItem>

          {/* Community */}
          <StaggerItem>
            <h3 className="text-white font-semibold mb-4">Community</h3>
            <ul className="space-y-2.5">
              {footerLinks.community.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-zinc-500 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </StaggerItem>

          {/* Legal */}
          <StaggerItem>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2.5">
              {footerLinks.legal.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-zinc-500 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </StaggerItem>
        </StaggerGroup>

        {/* Bottom Bar */}
        <AnimateIn delay={0.3}>
          <div className="pt-8 border-t border-white/[0.06]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-zinc-600 text-sm">
                &copy; {currentYear} CabbageSEO. All rights reserved.
              </p>
              <div className="flex items-center gap-6">
                <Link href="/privacy" className="text-zinc-600 hover:text-zinc-400 text-sm transition-colors">Privacy</Link>
                <Link href="/terms" className="text-zinc-600 hover:text-zinc-400 text-sm transition-colors">Terms</Link>
                <span className="text-zinc-700 text-sm flex items-center gap-1">
                  Made with <img src="/apple-touch-icon.png" alt="" className="w-4 h-4 inline rounded" /> for founders
                </span>
              </div>
            </div>
          </div>
        </AnimateIn>
      </div>
    </footer>
  );
}

// ============================================
// SHELL
// ============================================

export function MarketingShell({ children }: { children: React.ReactNode }) {
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
