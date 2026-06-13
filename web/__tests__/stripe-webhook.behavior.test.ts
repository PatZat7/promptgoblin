import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Stripe from "stripe";

// ---------------------------------------------------------------------------
// BEHAVIORAL webhook tests — these actually EXECUTE the POST handler.
//
// Unlike stripe-webhook.test.ts / checkout-flow.test.ts (which grep the source
// for guard strings), this suite drives the real route with genuinely
// Stripe-signed payloads and a stateful in-memory Supabase fake, then asserts
// observable behavior: signature rejection, idempotency, provisioning side
// effects, subscription-status transitions, and cross-tenant refusal.
//
// No live Stripe or Supabase needed. Signatures are real (HMAC via the Stripe
// SDK's generateTestHeaderString); only the DB and Resend network are faked.
// ---------------------------------------------------------------------------

const WEBHOOK_SECRET = "whsec_testsecretdonotuse";
const WEBHOOK_SECRET_TEST = "whsec_secondaryendpointsecret";

// vi.hoisted so the (hoisted) vi.mock factory can read the per-test fake.
const h = vi.hoisted(() => ({ db: null as unknown as FakeSupabase }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/service-role", () => ({
  createServiceRoleSupabase: () => h.db,
}));

// Import AFTER mocks are registered. The route reads env at call time (inside
// POST), so a static import here is safe — env is set in beforeAll below.
import { POST } from "@/app/api/webhooks/stripe/route";

// --- in-memory Supabase fake -------------------------------------------------

type Row = Record<string, unknown>;

class FakeSupabase {
  events = new Map<string, Row>();
  clientUpdates: Array<{ filters: [string, unknown][]; payload: Row }> = [];
  rpcCalls: Array<{ fn: string; args: Record<string, unknown> }> = [];

  // Tunable per test.
  provisionResult: { data?: unknown; error?: { message: string } | null } = {
    data: "client_abc123",
    error: null,
  };

  auth = {
    admin: {
      createUser: vi.fn(async () => ({
        data: { user: { id: "user_1" } },
        error: null,
      })),
      generateLink: vi.fn(async () => ({
        data: { user: { id: "user_1" }, properties: { hashed_token: "hash_xyz" } },
        error: null,
      })),
      updateUserById: vi.fn(async () => ({ data: {}, error: null })),
    },
  };

  from(table: string) {
    return new FakeQuery(this, table);
  }

  async rpc(fn: string, args: Record<string, unknown>) {
    this.rpcCalls.push({ fn, args });
    if (fn === "provision_stripe_checkout_client") return this.provisionResult;
    return { data: null, error: null };
  }
}

class FakeQuery {
  private op: "select" | "update" | null = null;
  private payload: Row = {};
  private filters: [string, unknown][] = [];

  constructor(private db: FakeSupabase, private table: string) {}

  insert(payload: Row) {
    if (this.table === "stripe_events") {
      const id = payload.id as string;
      if (this.db.events.has(id)) {
        return Promise.resolve({ error: { code: "23505", message: "duplicate key" } });
      }
      this.db.events.set(id, { ...payload });
      return Promise.resolve({ error: null });
    }
    return Promise.resolve({ error: null });
  }

  select(_cols?: string) {
    this.op = "select";
    return this;
  }

  update(payload: Row) {
    this.op = "update";
    this.payload = payload;
    return this;
  }

  eq(col: string, val: unknown) {
    this.filters.push([col, val]);
    if (this.op === "update") return this.runUpdate();
    return this; // select chain continues into maybeSingle()
  }

  maybeSingle() {
    const id = this.filters.find((f) => f[0] === "id")?.[1] as string | undefined;
    const row = (id && this.db.events.get(id)) || null;
    return Promise.resolve({ data: row, error: null });
  }

  private runUpdate() {
    if (this.table === "stripe_events") {
      const id = this.filters.find((f) => f[0] === "id")?.[1] as string | undefined;
      const row = id ? this.db.events.get(id) : undefined;
      if (row) Object.assign(row, this.payload);
      return Promise.resolve({ error: null });
    }
    if (this.table === "clients") {
      this.db.clientUpdates.push({ filters: this.filters, payload: this.payload });
      return Promise.resolve({ error: null });
    }
    return Promise.resolve({ error: null });
  }
}

// --- helpers -----------------------------------------------------------------

const signer = new Stripe("sk_test_dummy");

function signedRequest(event: Record<string, unknown>, opts: { tamper?: boolean; secret?: string } = {}) {
  const payload = JSON.stringify(event);
  const header = signer.webhooks.generateTestHeaderString({
    payload,
    secret: opts.secret ?? WEBHOOK_SECRET,
  });
  const body = opts.tamper ? payload.replace(/"paid"/, '"unpaid"') : payload;
  return new Request("https://promptgoblin.io/api/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": header, "content-type": "application/json" },
    body,
  });
}

function checkoutEvent(overrides: Record<string, unknown> = {}, id = "evt_checkout_1") {
  return {
    id,
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_1",
        object: "checkout.session",
        payment_status: "paid",
        customer: "cus_1",
        subscription: "sub_1",
        customer_details: { email: "buyer@acme.com" },
        custom_fields: [],
        metadata: { domain: "acme.com", plan: "scout" },
        ...overrides,
      },
    },
  };
}

function invoiceEvent(type: string, subscription = "sub_1", id = "evt_inv_1") {
  return {
    id,
    type,
    data: { object: { id: "in_1", object: "invoice", subscription } },
  };
}

function subscriptionEvent(type: string, status: string, id = "evt_sub_1") {
  return {
    id,
    type,
    data: { object: { id: "sub_1", object: "subscription", status } },
  };
}

// --- setup -------------------------------------------------------------------

beforeAll(() => {
  process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
  process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
  process.env.STRIPE_WEBHOOK_SECRET_TEST = WEBHOOK_SECRET_TEST;
  process.env.NEXT_PUBLIC_SITE_URL = "https://promptgoblin.io";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "svc-role-key";
  process.env.RESEND_API_KEY = "re_test";
});

beforeEach(() => {
  h.db = new FakeSupabase();
  // Default: Resend succeeds.
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, status: 200, text: async () => "" })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// --- signature verification --------------------------------------------------

describe("signature verification", () => {
  it("rejects a missing stripe-signature header with 400", async () => {
    const res = await POST(
      new Request("https://promptgoblin.io/api/webhooks/stripe", {
        method: "POST",
        body: JSON.stringify(checkoutEvent()),
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/signature/i);
    expect(h.db.rpcCalls).toHaveLength(0);
  });

  it("rejects a payload signed with the wrong secret", async () => {
    const res = await POST(signedRequest(checkoutEvent(), { secret: "whsec_wrong" }));
    expect(res.status).toBe(400);
    expect(h.db.rpcCalls).toHaveLength(0);
  });

  it("rejects a tampered body whose signature no longer matches", async () => {
    const res = await POST(signedRequest(checkoutEvent(), { tamper: true }));
    expect(res.status).toBe(400);
    expect(h.db.rpcCalls).toHaveLength(0);
  });

  it("accepts a correctly signed payload", async () => {
    const res = await POST(signedRequest(checkoutEvent()));
    expect(res.status).toBe(200);
  });

  it("accepts a payload signed with the secondary (test-mode endpoint) secret", async () => {
    const res = await POST(signedRequest(checkoutEvent(), { secret: WEBHOOK_SECRET_TEST }));
    expect(res.status).toBe(200);
    expect(h.db.rpcCalls.filter((c) => c.fn === "provision_stripe_checkout_client")).toHaveLength(1);
  });
});

// --- checkout provisioning ---------------------------------------------------

describe("checkout.session.completed provisioning", () => {
  it("provisions exactly once and sends the welcome email on a paid checkout", async () => {
    const res = await POST(signedRequest(checkoutEvent()));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.clientId).toBe("client_abc123");
    expect(h.db.rpcCalls.filter((c) => c.fn === "provision_stripe_checkout_client")).toHaveLength(1);
    expect(h.db.auth.admin.createUser).toHaveBeenCalledOnce();
    // Welcome email attempted via Resend.
    expect((globalThis.fetch as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({ method: "POST" }),
    );
    // Ledger row landed in 'processed'.
    expect(h.db.events.get("evt_checkout_1")?.status).toBe("processed");
  });

  it("ignores an unpaid checkout with no provisioning side effects", async () => {
    const res = await POST(signedRequest(checkoutEvent({ payment_status: "unpaid" })));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ignored).toBe(true);
    expect(h.db.rpcCalls).toHaveLength(0);
    expect(h.db.events.get("evt_checkout_1")?.status).toBe("ignored");
  });

  it("treats a Resend failure as best-effort: account still provisioned, event still processed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 500, text: async () => "resend down" })),
    );
    const res = await POST(signedRequest(checkoutEvent()));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.warning).toMatch(/resend/i);
    expect(h.db.rpcCalls.filter((c) => c.fn === "provision_stripe_checkout_client")).toHaveLength(1);
    // Recorded the email failure on the client row, but did NOT fail the event.
    expect(h.db.clientUpdates.some((u) => u.payload.welcome_email_status === "failed")).toBe(true);
    expect(h.db.events.get("evt_checkout_1")?.status).toBe("processed");
  });

  it("permanently fails (200, ledger 'failed') a domain owned by another tenant", async () => {
    h.db.provisionResult = {
      data: null,
      error: { message: "DOMAIN_OWNED_BY_OTHER_USER: acme.com" },
    };
    const res = await POST(signedRequest(checkoutEvent()));
    const json = await res.json();

    // 200 so Stripe does NOT retry a permanent failure...
    expect(res.status).toBe(200);
    expect(json.error).toMatch(/manual review/i);
    // ...but the ledger records it as failed for human follow-up.
    expect(h.db.events.get("evt_checkout_1")?.status).toBe("failed");
  });

  it("rejects a checkout missing a customer email (permanent, 200, ledger 'failed')", async () => {
    const res = await POST(
      signedRequest(checkoutEvent({ customer_details: {}, customer_email: null })),
    );
    expect(res.status).toBe(200);
    expect(h.db.rpcCalls).toHaveLength(0);
    expect(h.db.events.get("evt_checkout_1")?.status).toBe("failed");
  });
});

// --- idempotency -------------------------------------------------------------

describe("idempotency", () => {
  it("processes a duplicate event id only once", async () => {
    const first = await POST(signedRequest(checkoutEvent()));
    expect(first.status).toBe(200);

    const second = await POST(signedRequest(checkoutEvent()));
    const json = await second.json();
    expect(second.status).toBe(200);
    expect(json.duplicate).toBe(true);

    // Provisioning ran for the first delivery only.
    expect(h.db.rpcCalls.filter((c) => c.fn === "provision_stripe_checkout_client")).toHaveLength(1);
  });

  it("returns 409 (Stripe should retry) while another delivery is actively processing", async () => {
    // Simulate an in-flight claim: a recent 'processing' row already exists.
    h.db.events.set("evt_checkout_1", {
      id: "evt_checkout_1",
      status: "processing",
      retry_count: 0,
      last_attempt_at: new Date().toISOString(),
    });
    const res = await POST(signedRequest(checkoutEvent()));
    expect(res.status).toBe(409);
    expect(h.db.rpcCalls).toHaveLength(0);
  });
});

// --- subscription lifecycle --------------------------------------------------

describe("subscription lifecycle status updates", () => {
  it("marks the client active on invoice.paid", async () => {
    await POST(signedRequest(invoiceEvent("invoice.paid"), {}));
    expect(h.db.clientUpdates.at(-1)?.payload.subscription_status).toBe("active");
  });

  it("marks the client past_due on invoice.payment_failed", async () => {
    await POST(signedRequest(invoiceEvent("invoice.payment_failed"), {}));
    expect(h.db.clientUpdates.at(-1)?.payload.subscription_status).toBe("past_due");
  });

  it("mirrors a customer.subscription.updated status", async () => {
    await POST(signedRequest(subscriptionEvent("customer.subscription.updated", "past_due"), {}));
    expect(h.db.clientUpdates.at(-1)?.payload.subscription_status).toBe("past_due");
  });

  it("marks the client canceled on customer.subscription.deleted", async () => {
    await POST(signedRequest(subscriptionEvent("customer.subscription.deleted", "canceled"), {}));
    expect(h.db.clientUpdates.at(-1)?.payload.subscription_status).toBe("canceled");
  });
});

// --- unhandled events --------------------------------------------------------

describe("unhandled event types", () => {
  it("acknowledges an unhandled event as ignored without side effects", async () => {
    const res = await POST(
      signedRequest({ id: "evt_ping", type: "ping", data: { object: {} } }),
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.ignored).toBe(true);
    expect(h.db.rpcCalls).toHaveLength(0);
  });
});
