import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = join(__dirname, "..", "..");

function readRepoFile(path: string) {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("dashboard membership model", () => {
  it("ships a membership migration for admin and scan-runner seats", () => {
    const migrationPath = join(
      repoRoot,
      "supabase/migrations/0013_client_memberships.sql"
    );

    expect(existsSync(migrationPath)).toBe(true);

    const migration = readFileSync(migrationPath, "utf8");
    expect(migration).toContain("create table if not exists client_memberships");
    expect(migration).toContain("role in ('admin','member')");
    expect(migration).toContain("scan_tier");
    expect(migration).toContain("can_run_scans");
    expect(migration).toContain("can_review");
  });

  it("resolves dashboard seat metadata on the server and passes it into the nav", () => {
    const layout = readRepoFile("web/app/(dashboard)/layout.tsx");
    const nav = readRepoFile("web/app/(dashboard)/DashboardNav.tsx");
    const dashboardPage = readRepoFile("web/app/(dashboard)/dashboard/page.tsx");

    expect(layout).toContain("createServerSupabase");
    expect(layout).toContain("getDashboardSeat");
    expect(layout).toContain("<DashboardNav");
    expect(nav).toContain("seatLabel");
    expect(dashboardPage).toContain("canRunScans");
  });

  it("documents the real admin and tier-3 dashboard accounts", () => {
    const plan = readRepoFile("PLAN.md");

    expect(plan).toContain("atpatzat333@gmail.com");
    expect(plan).toContain("admin");
    expect(plan).toContain("approval UI");
    expect(plan).toContain("atpatzat@gmail.com");
    expect(plan).toContain("tier 3");
  });
});
