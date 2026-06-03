/**
 * Thin analytics shim. PostHog is loaded later (batch 4); until then every call
 * safely no-ops. Web3Forms is the static-site form backend (public access key).
 * No PII is constructed here beyond what the user typed into a form.
 */

const WEB3FORMS_KEY = "ee75925c-9368-4791-9f1c-522ead6fe7f1";

type LeadData = Record<string, unknown> & {
  domain?: string;
  email?: string;
  competitor?: string;
  target?: string;
  scan_id?: string;
};

const posthog = (): { capture?: (e: string, p?: object) => void; identify?: (id: string, p?: object) => void; group?: (t: string, k: string, p?: object) => void; setPersonProperties?: (p: object) => void } | undefined =>
  typeof window === "undefined" ? undefined : (window as { posthog?: never }).posthog;

export const leadDomain = (data: LeadData): string =>
  String(data?.domain ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];

export const captureEvent = (event: string, props: object = {}) => {
  try {
    posthog()?.capture?.(event, props);
  } catch {
    /* analytics is best-effort */
  }
};

export const identifyLead = (data: LeadData) => {
  const email = String(data?.email ?? "").trim().toLowerCase();
  const domain = leadDomain(data);
  const ph = posthog();
  if (!ph || !email) return;
  const props = { email, domain, company_domain: domain, requested_surface: data.target || data.competitor || "" };
  try {
    ph.identify?.(email, props);
    if (domain) ph.group?.("company", domain, { domain });
    ph.setPersonProperties?.(props);
  } catch {
    /* best-effort */
  }
};

/** Post a lead to Web3Forms. Returns whether it was accepted. */
export const submitWeb3Form = async (subject: string, data: Record<string, unknown>): Promise<boolean> => {
  try {
    const r = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ access_key: WEB3FORMS_KEY, subject, from_name: "promptgoblin.io", ...data }),
    });
    return r.ok;
  } catch {
    return false;
  }
};

/** Fire-and-forget lead capture: PostHog identity/event + Web3Forms email. */
export const captureLead = (event: string, data: LeadData): Promise<boolean> => {
  const domain = leadDomain(data);
  identifyLead(data);
  captureEvent(event, {
    domain,
    scan_id: data?.scan_id,
    has_email: Boolean(data?.email),
    target: data?.target,
    competitor: data?.competitor,
  });
  return fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      access_key: WEB3FORMS_KEY,
      subject: `${event} ✦ ${data.domain || ""}`,
      from_name: "promptgoblin.io",
      ...data,
    }),
  })
    .then((r) => r.ok)
    .catch(() => false);
};
