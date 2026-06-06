-- seed.sql
-- ILLUSTRATIVE FIXTURES ONLY — local dev and Docker testing only.
-- NEVER apply to a real/hosted Supabase project.
-- Every metric-bearing row has is_sample = true and mode = 'mock'.
-- No row here reads as a real client result.

-- Two illustrative tenants (seeded into auth.users so FK constraint is satisfied).
-- On a real Supabase project these would be real auth users; seed.sql is never run there.
insert into auth.users (id) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
on conflict (id) do nothing;

-- Tenant A: acme-sample
insert into clients (id, owner_user_id, slug, name, domain, icp_segment, tier, is_sample) values
  ('a1000000-0000-0000-0000-000000000001',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'acme-sample', 'ACME (sample tenant)', 'acme-sample.example.com',
   'saas', 'starter', true)
on conflict (slug) do nothing;

-- Tenant B: globex-sample
insert into clients (id, owner_user_id, slug, name, domain, icp_segment, tier, is_sample) values
  ('b1000000-0000-0000-0000-000000000001',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'globex-sample', 'Globex (sample tenant)', 'globex-sample.example.com',
   'service', 'free', true)
on conflict (slug) do nothing;

-- Sample run for Tenant A
insert into runs (id, client_id, owner_user_id, graph_snapshot, mode, visibility_score,
                  visibility, confidence, low_confidence, blind_spot, is_sample, status) values
  ('a2000000-0000-0000-0000-000000000001',
   'a1000000-0000-0000-0000-000000000001',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '{"mode":"mock","snapshot_schema":1,"note":"illustrative sample — not a real scan result"}',
   'mock', 0.12,
   '{"acme-sample.example.com":0.12,"competitor.example.com":0.34}',
   'high', false, null, true, 'complete')
on conflict (id) do nothing;

-- Sample run for Tenant B
insert into runs (id, client_id, owner_user_id, graph_snapshot, mode, visibility_score,
                  visibility, confidence, low_confidence, blind_spot, is_sample, status) values
  ('b2000000-0000-0000-0000-000000000001',
   'b1000000-0000-0000-0000-000000000001',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   '{"mode":"mock","snapshot_schema":1,"note":"illustrative sample — not a real scan result"}',
   'mock', null,
   null,
   'high', false,
   'WAF-blocked: 403 returned by Akamai CDN. SPA static-fetch blind spot — score is NULL, not 0.',
   true, 'needs_review')
on conflict (id) do nothing;

-- Sample citation for Tenant A
insert into citations (run_id, owner_user_id, source_url, source_domain, platform, query_text, position, is_client) values
  ('a2000000-0000-0000-0000-000000000001',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'https://acme-sample.example.com/blog/sample', 'acme-sample.example.com',
   'perplexity', 'sample query [illustrative]', 1, true);

-- Sample recommendation for Tenant A
insert into recommendations (run_id, owner_user_id, fix_id, title, kind, priority,
                              impact, effort, status, human_reviewed, is_sample) values
  ('a2000000-0000-0000-0000-000000000001',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'FIX-S001', 'Sample: add FAQ schema to pricing page', 'schema', 'medium',
   3, 2, 'proposed', false, true);

-- Sample verification result for Tenant A
insert into verification_results (run_id, owner_user_id, method, status, passed,
                                   verdict, is_sample) values
  ('a2000000-0000-0000-0000-000000000001',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'deterministic_fallback', 'unverifiable', false,
   'sample — no real verification run yet', true);

-- Sample artifact for Tenant A (deterministic_fallback; never a real screenshot)
-- Requires scan-proof bucket to exist (inserted in 0005_run_artifacts.sql).
insert into run_artifacts (run_id, client_id, owner_user_id, stage, viewport,
                           storage_path, method, is_sample) values
  ('a2000000-0000-0000-0000-000000000001',
   'a1000000-0000-0000-0000-000000000001',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'before', 1440,
   'a1000000-0000-0000-0000-000000000001/a2000000-0000-0000-0000-000000000001/before@1440.png',
   'deterministic_fallback', true)
on conflict (run_id, stage, viewport) do nothing;
