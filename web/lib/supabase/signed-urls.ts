import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// IMPORTANT: This module uses the SERVICE ROLE key — server-side ONLY.
// The "server-only" import above ensures bundlers hard-error if this file is
// ever imported from a client component or included in the client bundle.
// NEVER prefix SUPABASE_SERVICE_ROLE_KEY with NEXT_PUBLIC_.

const SIGNED_URL_TTL_SECONDS = 60; // short-lived; client never gets the object key
const BUCKET = "scan-proof";

function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "[Supabase signed-urls] NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY " +
        "are required for signed URL minting. Add SUPABASE_SERVICE_ROLE_KEY to web/.env.local."
    );
  }
  // Service-role client — bypasses RLS for URL minting only.
  // The *access* check is enforced by the storage.objects RLS policy.
  return createServerClient(url, serviceKey, {
    cookies: {
      getAll: async () => {
        const store = await cookies();
        return store.getAll();
      },
      setAll: () => {
        // No-op: service role client doesn't manage auth cookies.
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Mint a short-TTL signed URL for a private scan-proof storage object.
 * @param storagePath - Bucket-relative path, e.g. "<clientId>/<runId>/before@1440.png"
 * @returns Signed URL string, or null if minting fails (broken path / env missing).
 */
export async function getScanProofSignedUrl(
  storagePath: string
): Promise<string | null> {
  try {
    const supabase = createServiceRoleClient();
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
