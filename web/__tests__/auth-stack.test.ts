import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = join(__dirname, "..");

function readWebFile(path: string) {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("dashboard auth stack", () => {
  it("uses Supabase SSR auth in proxy and never redirects to Clerk routes", () => {
    const proxy = readWebFile("proxy.ts");

    expect(proxy).toContain('@supabase/ssr');
    expect(proxy).toContain('new URL("/login"');
    expect(proxy).not.toContain("@clerk/nextjs");
    expect(proxy).not.toContain('new URL("/sign-in"');
    expect(proxy).not.toContain("/__clerk");
  });

  it("does not wrap the app or dashboard nav in Clerk components", () => {
    const layout = readWebFile("app/layout.tsx");
    const nav = readWebFile("app/(dashboard)/DashboardNav.tsx");

    expect(layout).not.toContain("ClerkProvider");
    expect(nav).not.toContain("@clerk/nextjs");
    expect(nav).toContain("userEmail");
    expect(nav).toContain("/auth/signout");
  });

  it("keeps magic-link login to provisioned Supabase users only", () => {
    // The magic-link logic lives in the shared useAuthForm hook (consumed by
    // both LoginForm and LoginModal). The guard that blocks self-signup via the
    // login form — so only Stripe-provisioned users can sign in — must stay here.
    const authForm = readWebFile("lib/useAuthForm.ts");
    expect(authForm).toContain("shouldCreateUser: false");

    // And the login form must actually consume that hook (inherit the guard).
    const loginForm = readWebFile("app/login/LoginForm.tsx");
    expect(loginForm).toContain("useAuthForm");
  });

  it("runs local dashboard dev on the Supabase allow-listed port", () => {
    const packageJson = JSON.parse(readWebFile("package.json")) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.dev).toContain("--port 3010");
  });

  it("does not ship Clerk pages or dependencies", () => {
    const packageJson = JSON.parse(readWebFile("package.json")) as {
      dependencies?: Record<string, string>;
    };

    expect(packageJson.dependencies).not.toHaveProperty("@clerk/nextjs");
    expect(existsSync(join(repoRoot, "app/sign-in/[[...sign-in]]/page.tsx"))).toBe(false);
    expect(existsSync(join(repoRoot, "app/sign-up/[[...sign-up]]/page.tsx"))).toBe(false);
  });
});
