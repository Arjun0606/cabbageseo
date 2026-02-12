/**
 * Inngest API Route
 *
 * Serves the Inngest functions for background job processing.
 * AI Visibility Intelligence jobs run automatically:
 * - Daily checks at 10 AM UTC (all paid plans)
 * - Evening checks at 10 PM UTC (Dominate only — 2x/day)
 * - Weekly reports on Mondays
 * - Visibility drop alerts (event-driven)
 */

import { serve } from "inngest/next";
import { inngest } from "@/lib/jobs/inngest-client";
import { citationFunctions } from "@/lib/jobs/citation-jobs";
import { teaserDripFunctions } from "@/lib/jobs/teaser-drip";
import { benchmarkFunctions } from "@/lib/jobs/benchmark-aggregation";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    ...citationFunctions,
    ...teaserDripFunctions,
    ...benchmarkFunctions,
  ],
});
