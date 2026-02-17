/**
 * /clawbot — Redirects to /openclaw for backwards compatibility
 */

import { redirect } from "next/navigation";

export default function ClawBotRedirect() {
  redirect("/openclaw");
}
