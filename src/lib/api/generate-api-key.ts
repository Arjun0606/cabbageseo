/**
 * API key generation utility.
 *
 * Generates cryptographically secure API keys with the `cbs_` prefix
 * (CabbageSEO). Keys are 68 characters total.
 */

import { randomBytes } from "crypto";

export function generateApiKey(): string {
  const bytes = randomBytes(32);
  return `cbs_${bytes.toString("hex")}`;
}
