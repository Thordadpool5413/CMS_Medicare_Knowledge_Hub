# Production source provenance

This repository import is anchored to AppDeploy production snapshot `1789104336546` for application `oklahoma-hospice-intelligence-os-mogirs`, captured for GitHub source-of-truth migration on 2026-09-11.

The repository preserves the production product architecture, public CMS/Census data contracts, scoring and evidence rules, AppDeploy runtime integration, private workspace boundaries, scheduled-job definitions, and current major user workflows.

Some source files were transferred directly from the applied snapshot during the import session. Larger application modules that could no longer be read after the remote source connector became unavailable were reconstructed against the already inspected production contracts and endpoints rather than falsely labeled as byte-for-byte exports. The repository should therefore be treated as the production-aligned source package, not as a cryptographic mirror of every character in the historical AppDeploy snapshot.

The controlling behavioral rules remain explicit:

- Missing evidence is not zero.
- Reporting periods remain separate.
- Public provider, claims, clinician, facility, geography, quality, HCRIS, and SSVI evidence does not establish patient-level hospice eligibility.
- Private operating evidence remains scoped to the authenticated user.
- Based-provider HCRIS normalization remains scoped until the applicable parent cost-report forms are validated.
- National competition cache counts are not represented as a completed national all-provider warehouse.

Future development should originate in GitHub and be deployed into AppDeploy through a controlled branch/PR workflow so source history no longer depends on a single hosted snapshot.
