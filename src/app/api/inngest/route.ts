/**
 * Inngest API Route
 *
 * Serves the Inngest functions for background job processing.
 * AI Visibility Intelligence jobs run automatically:
 * - Daily checks at 10 AM UTC
 * - Hourly checks for Command/Dominate users
 * - Weekly reports on Mondays
 * - Monthly checkpoint reports on the 1st
 * - Visibility drop alerts (event-driven)
 */

import { serve } from "inngest/next";
import { inngest } from "@/lib/jobs/inngest-client";
import { citationFunctions } from "@/lib/jobs/citation-jobs";
import { monthlyCheckpointFunctions } from "@/lib/jobs/monthly-checkpoint";
import { teaserDripFunctions } from "@/lib/jobs/teaser-drip";
import { benchmarkFunctions } from "@/lib/jobs/benchmark-aggregation";
// Export handlers for Inngest
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    ...citationFunctions,
    ...monthlyCheckpointFunctions,
    ...teaserDripFunctions,
    ...benchmarkFunctions,
  ],
});
