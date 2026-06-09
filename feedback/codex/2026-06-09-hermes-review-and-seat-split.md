## Hermes integration note — 2026-06-09

- **Hermes feedback/PR status:** no repo-bound Hermes review notes were present in `feedback/hermes/`, and no Hermes branch or commit was available in this checkout to integrate.
- **Decision:** `deferred` as non-blocking. There was no Hermes-authored repo artifact to review before deploy.
- **Action taken instead:** implemented and applied the live Supabase membership split directly:
  - `atpatzat333@gmail.com` -> admin seat, approval access, scan launch enabled
  - `atpatzat@gmail.com` -> tier-3 member seat, scan launch enabled, no approval access
- **Follow-up:** if Hermes sends vault-backed migration or strategy notes later, reconcile them against `0013_client_memberships.sql` and `0014_inline_membership_rls.sql`.
