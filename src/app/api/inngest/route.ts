/**
 * Inngest API Route
 * 
 * Serves the Inngest functions for background job processing
 */

import { serve } from "inngest/next";
import { inngest } from "@/lib/jobs/inngest-client";
import { functions } from "@/lib/jobs/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});

