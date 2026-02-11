/**
 * Dynamic OG Score Card — V2
 *
 * Generates a 1200x630 PNG image for social sharing.
 * Designed to be scroll-stopping on Twitter/LinkedIn feeds.
 *
 * GET /api/og/score?domain=X&score=Y&invisible=bool&brands=N&names=a,b,c
 */

import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain") || "example.com";
  const score = Math.min(100, Math.max(0, parseInt(searchParams.get("score") || "0", 10)));
  const invisible = searchParams.get("invisible") === "true";
  const competitors = parseInt(searchParams.get("brands") || searchParams.get("competitors") || "0", 10);
  const names = (searchParams.get("names") || "").split(",").filter(Boolean).slice(0, 3);

  const isLow = invisible || score === 0;
  const scoreColor = isLow ? "#ef4444" : score < 40 ? "#f59e0b" : "#10b981";
  const glowColor = isLow ? "rgba(239, 68, 68, 0.15)" : score < 40 ? "rgba(245, 158, 11, 0.12)" : "rgba(16, 185, 129, 0.12)";

  const verdict = invisible
    ? "INVISIBLE TO AI"
    : score < 30
      ? "LOW VISIBILITY"
      : score < 60
        ? "MODERATE VISIBILITY"
        : "STRONG VISIBILITY";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#09090b",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Large radial glow behind score */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            left: "50%",
            width: "800px",
            height: "800px",
            transform: "translateX(-50%)",
            background: `radial-gradient(circle, ${glowColor} 0%, transparent 60%)`,
            display: "flex",
          }}
        />

        {/* Dot grid overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.03,
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
            display: "flex",
          }}
        />

        {/* Top bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "32px 48px",
          }}
        >
          {/* Branding */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 800,
                color: "#000",
              }}
            >
              C
            </div>
            <span style={{ color: "#71717a", fontSize: 18, fontWeight: 600 }}>
              CabbageSEO
            </span>
          </div>

          {/* CTA badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 16px",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              borderRadius: 20,
              border: "1px solid rgba(16, 185, 129, 0.3)",
            }}
          >
            <span style={{ color: "#10b981", fontSize: 14, fontWeight: 600 }}>
              Check yours free → cabbageseo.com
            </span>
          </div>
        </div>

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flex: 1,
            padding: "0 48px",
            gap: 48,
          }}
        >
          {/* Left: Score + Verdict */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              flex: 1,
            }}
          >
            {/* Domain */}
            <div style={{ display: "flex", flexDirection: "column", marginBottom: 8 }}>
              <span style={{ color: "#52525b", fontSize: 14, fontWeight: 500, textTransform: "uppercase" as const, letterSpacing: 2 }}>
                AI Visibility Report
              </span>
              <span style={{ color: "#ffffff", fontSize: 28, fontWeight: 700, marginTop: 4 }}>
                {domain}
              </span>
            </div>

            {/* Score */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
              <span
                style={{
                  fontSize: 120,
                  fontWeight: 900,
                  color: scoreColor,
                  lineHeight: 1,
                  letterSpacing: -4,
                }}
              >
                {score}
              </span>
              <span style={{ color: "#52525b", fontSize: 24, fontWeight: 500 }}>
                / 100
              </span>
            </div>

            {/* Verdict pill */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 20px",
                backgroundColor: isLow ? "rgba(239, 68, 68, 0.1)" : score < 40 ? "rgba(245, 158, 11, 0.1)" : "rgba(16, 185, 129, 0.1)",
                borderRadius: 24,
                border: `1px solid ${isLow ? "rgba(239, 68, 68, 0.3)" : score < 40 ? "rgba(245, 158, 11, 0.3)" : "rgba(16, 185, 129, 0.3)"}`,
                alignSelf: "flex-start",
              }}
            >
              <span style={{ color: scoreColor, fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>
                {verdict}
              </span>
            </div>
          </div>

          {/* Right: Brands panel */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              width: 380,
            }}
          >
            {(names.length > 0 || competitors > 0) && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  backgroundColor: "rgba(161, 161, 170, 0.05)",
                  border: "1px solid rgba(161, 161, 170, 0.15)",
                  borderRadius: 16,
                  padding: 24,
                }}
              >
                <span style={{ color: "#71717a", fontSize: 13, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 16 }}>
                  Also cited by AI
                </span>

                {names.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {names.map((name, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 16px",
                          backgroundColor: "rgba(161, 161, 170, 0.06)",
                          borderRadius: 10,
                          border: "1px solid rgba(161, 161, 170, 0.1)",
                        }}
                      >
                        <span style={{ color: "#ffffff", fontSize: 16, fontWeight: 600 }}>
                          {name}
                        </span>
                        <span style={{ color: "#a1a1aa", fontSize: 12, fontWeight: 500 }}>
                          CITED
                        </span>
                      </div>
                    ))}
                    {competitors > names.length && (
                      <span style={{ color: "#71717a", fontSize: 13, textAlign: "center" as const, marginTop: 4 }}>
                        +{competitors - names.length} more brand{competitors - names.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <span style={{ color: "#a1a1aa", fontSize: 36, fontWeight: 800 }}>
                      {competitors}
                    </span>
                    <span style={{ color: "#71717a", fontSize: 14 }}>
                      brand{competitors !== 1 ? "s" : ""} also cited
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* No brands — show invisible message */}
            {names.length === 0 && competitors === 0 && invisible && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  backgroundColor: "rgba(239, 68, 68, 0.05)",
                  border: "1px solid rgba(239, 68, 68, 0.15)",
                  borderRadius: 16,
                  padding: 32,
                  textAlign: "center" as const,
                }}
              >
                <span style={{ color: "#ef4444", fontSize: 48, fontWeight: 900, lineHeight: 1, marginBottom: 8 }}>
                  0
                </span>
                <span style={{ color: "#a1a1aa", fontSize: 16 }}>
                  times mentioned by AI
                </span>
                <span style={{ color: "#71717a", fontSize: 13, marginTop: 12 }}>
                  ChatGPT &amp; Perplexity don&apos;t
                </span>
                <span style={{ color: "#71717a", fontSize: 13 }}>
                  recommend {domain}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "20px 48px",
          }}
        >
          <span style={{ color: "#3f3f46", fontSize: 13 }}>
            cabbageseo.com — Free AI Visibility Report
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
