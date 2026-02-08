/**
 * Embeddable Score Badge
 *
 * Returns a shields.io-style SVG badge showing AI visibility score.
 * Embeddable in READMEs, email signatures, websites, and Twitter bios.
 *
 * GET /api/badge/score?domain=X
 */

import { NextRequest } from "next/server";
import { db, teaserReports } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain")?.toLowerCase().trim();

  if (!domain) {
    return new Response(buildBadgeSvg("AI Visibility", "no domain", "#9f9f9f"), {
      headers: svgHeaders(60),
    });
  }

  try {
    const [report] = await db
      .select({
        visibilityScore: teaserReports.visibilityScore,
        isInvisible: teaserReports.isInvisible,
      })
      .from(teaserReports)
      .where(eq(teaserReports.domain, domain))
      .orderBy(desc(teaserReports.createdAt))
      .limit(1);

    if (!report) {
      return new Response(buildBadgeSvg("AI Visibility", "not scanned", "#9f9f9f"), {
        headers: svgHeaders(300),
      });
    }

    const score = report.visibilityScore;
    const color =
      report.isInvisible || score === 0
        ? "#e05d44"
        : score < 40
          ? "#dfb317"
          : "#4c1";

    return new Response(
      buildBadgeSvg("AI Visibility", `${score}/100`, color),
      { headers: svgHeaders(3600) },
    );
  } catch {
    return new Response(buildBadgeSvg("AI Visibility", "error", "#9f9f9f"), {
      headers: svgHeaders(60),
    });
  }
}

function svgHeaders(maxAge: number): HeadersInit {
  return {
    "Content-Type": "image/svg+xml",
    "Cache-Control": `public, max-age=${maxAge}, s-maxage=${maxAge}`,
  };
}

function buildBadgeSvg(label: string, value: string, valueColor: string): string {
  const labelWidth = label.length * 6.5 + 12;
  const valueWidth = value.length * 6.5 + 12;
  const totalWidth = labelWidth + valueWidth;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${label}: ${value}">
  <title>${label}: ${value}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${valueColor}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text aria-hidden="true" x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelWidth / 2}" y="14" fill="#fff">${label}</text>
    <text aria-hidden="true" x="${labelWidth + valueWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${value}</text>
    <text x="${labelWidth + valueWidth / 2}" y="14" fill="#fff">${value}</text>
  </g>
</svg>`;
}
