"use client";

/**
 * Root-level error boundary. Catches errors in the root layout itself.
 * Must include its own <html> and <body> tags since the layout may have crashed.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: "#09090b", margin: 0 }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          <div style={{ maxWidth: "400px", textAlign: "center" }}>
            <h1 style={{ color: "#fff", fontSize: "24px", marginBottom: "8px" }}>
              Something went wrong
            </h1>
            <p style={{ color: "#a1a1aa", fontSize: "14px", marginBottom: "24px" }}>
              An unexpected error occurred. Please try again.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={reset}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#10b981",
                  color: "#000",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Try again
              </button>
              <a
                href="/"
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#27272a",
                  color: "#fff",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontSize: "14px",
                }}
              >
                Go home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
