import "server-only";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";

// IMPORTANT: This module uses the SERVICE ROLE key — server-side ONLY.
// The "server-only" import above ensures bundlers hard-error if this file is
// ever imported from a client component or included in the client bundle.
// NEVER prefix SUPABASE_SERVICE_ROLE_KEY with NEXT_PUBLIC_.

const SIGNED_URL_TTL_SECONDS = 60; // short-lived; client never gets the object key
const BUCKET = "scan-proof";

/**
 * Mint a short-TTL signed URL for a private scan-proof storage object.
 * @param storagePath - Bucket-relative path, e.g. "<clientId>/<runId>/before@1440.png"
 * @returns Signed URL string, or null if minting fails (broken path / env missing).
 */
export async function getScanProofSignedUrl(
  storagePath: string
): Promise<string | null> {
  try {
    const supabase = createServiceRoleSupabase();
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
    if (error || !data?.signedUrl) {
      console.error("[signed-urls] Failed to create signed URL:", error?.message);
      return null;
    }
    return data.signedUrl;
  } catch (err) {
    // Env missing at runtime — degrade gracefully; the ScanProofThumb component
    // renders a "proof expired, refresh" placeholder for null URLs.
    console.error("[signed-urls] Error:", err);
    return null;
  }
}
