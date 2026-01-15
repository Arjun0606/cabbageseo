/**
 * Inngest API Route
 * 
 * Serves the Inngest functions for background job processing.
 * AI Visibility Intelligence jobs run automatically:
 * - Daily checks at 10 AM UTC
 * - Hourly checks for Pro users
 * - Weekly reports on Mondays
 */

import { serve } from "inngest/next";
import { inngest } from "@/lib/jobs/inngest-client";
import { citationFunctions } from "@/lib/jobs/citation-jobs";

// Export handlers for Inngest
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: citationFunctions,
});
