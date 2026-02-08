import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Visibility Leaderboard – Top 100 Most Visible Brands in AI Search",
  description:
    "See which brands ChatGPT, Perplexity & Google AI recommend the most. Live leaderboard of the top 100 most visible companies in AI search results.",
  keywords: [
    "AI visibility leaderboard",
    "ChatGPT recommended brands",
    "AI search leaderboard",
    "most recommended by AI",
    "AI citation ranking",
  ],
  openGraph: {
    title: "Top 100 Most Visible Brands in AI Search",
    description:
      "Which brands does AI recommend? Explore the live leaderboard of AI visibility leaders.",
  },
};

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
