"use client";

/**
 * Marketing Layout
 *
 * Header + Footer for all marketing pages.
 * Scroll-aware header, animated dropdown, animated footer.
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
  ChevronDown,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimateIn } from "@/components/motion/animate-in";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-group";

// ============================================
// HEADER
// ============================================

const navLinks = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
  { href: "/blog", label: "Blog" },
  { href: "/changelog", label: "Changelog" },
];

const solutionLinks = [
  { href: "/for/saas", label: "For SaaS Founders", desc: "Track and win AI recommendations for your product" },
  { href: "/for/agencies", label: "For Agencies", desc: "Multi-client AI visibility intelligence at scale" },
  { href: "/leaderboard", label: "Leaderboard", desc: "Top 30 most visible brands in AI search" },
];

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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

      <div className="max-w-6xl mx-auto px-6">
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
            {navLinks.slice(0, 2).map(link => (
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

            {/* Solutions Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setSolutionsOpen(!solutionsOpen)}
                className={`nav-link-underline flex items-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                  pathname.startsWith("/for/") || pathname === "/leaderboard"
                    ? "text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Solutions
                <motion.span
                  animate={{ rotate: solutionsOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </motion.span>
              </button>
              <AnimatePresence>
                {solutionsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
                    className="absolute top-full left-0 mt-2 w-72 bg-zinc-900/90 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl shadow-black/40 overflow-hidden"
                  >
                    {solutionLinks.map(link => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="block px-4 py-3 hover:bg-white/[0.05] transition-colors"
                        onClick={() => setSolutionsOpen(false)}
                      >
                        <span className="text-sm font-medium text-white">{link.label}</span>
                        <span className="block text-xs text-zinc-500 mt-0.5">{link.desc}</span>
                      </Link>
                    ))}
                    <div className="border-t border-white/[0.06]">
                      <Link
                        href="/vs/manual-tracking"
                        className="block px-4 py-3 hover:bg-white/[0.05] transition-colors"
                        onClick={() => setSolutionsOpen(false)}
                      >
                        <span className="text-sm font-medium text-white">Why CabbageSEO?</span>
                        <span className="block text-xs text-zinc-500 mt-0.5">See how we compare to manual tracking</span>
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {navLinks.slice(2).map(link => (
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
                  <div className="px-4 py-2 text-xs font-semibold text-zinc-600 uppercase tracking-wider mt-2">
                    Solutions
                  </div>
                  {solutionLinks.map(link => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-white/[0.03] rounded-lg pl-6 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <Link
                    href="/vs/manual-tracking"
                    className="px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-white/[0.03] rounded-lg pl-6 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Why CabbageSEO?
                  </Link>
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
      { href: "/changelog", label: "Changelog" },
      { href: "/teaser", label: "Free AI Scan" },
    ],
    solutions: [
      { href: "/for/saas", label: "For SaaS" },
      { href: "/for/agencies", label: "For Agencies" },
      { href: "/leaderboard", label: "Leaderboard" },
      { href: "/vs/manual-tracking", label: "Why CabbageSEO?" },
    ],
    resources: [
      { href: "/docs", label: "Documentation" },
      { href: "/blog", label: "Blog" },
      { href: "/feedback", label: "Feedback" },
      { href: "/login", label: "Log In" },
    ],
    company: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
      { href: "mailto:arjun@cabbageseo.com", label: "Contact Us" },
    ],
  };

  return (
    <footer className="relative bg-zinc-950 border-t border-white/[0.06]">
      {/* Gradient line at top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

      <div className="max-w-6xl mx-auto px-6 py-16">
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
              See who AI recommends — and win.
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

          {/* Solutions */}
          <StaggerItem>
            <h3 className="text-white font-semibold mb-4">Solutions</h3>
            <ul className="space-y-2.5">
              {footerLinks.solutions.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-zinc-500 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </StaggerItem>

          {/* Resources */}
          <StaggerItem>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2.5">
              {footerLinks.resources.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-zinc-500 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </StaggerItem>

          {/* Company */}
          <StaggerItem>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2.5">
              {footerLinks.company.map(link => (
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
