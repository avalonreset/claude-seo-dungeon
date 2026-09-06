# Public SEO engine provenance

Checked 2026-09-06. This distribution imports the publicly released Claude SEO
engine only. Private research, paid product materials, and operator workspace
records are not redistribution sources.

## Pinned public sources

| Source | Ref | Commit |
| --- | --- | --- |
| [Claude SEO](https://github.com/AgriciDaniel/claude-seo) | main | `a1480c7e590b16001bd9dc1627eacdcd44d580f9` |
| [Public release](https://github.com/AgriciDaniel/claude-seo/releases/tag/v2.2.5) | v2.2.5 | `2384fdd9429696021d143006a722c7cf1aa76d43` |

The [provenance manifest](upstream-seo-provenance.json) records public Git blob
IDs, normalized imported file hashes, and per-file adaptation flags for all
293 core engine paths. These hashes describe the engine import; later game and
packaging changes are documented separately. Reproduce public source trees with
`gh api repos/AgriciDaniel/claude-seo/git/trees/<commit>?recursive=1`, reject a
truncated response, and compare the path-to-blob-SHA mappings.

## Update and adaptations

This update imports only files obtained from the public Claude SEO Git history,
using v2.2.0 as the merge ancestor and public main's v2.2.5 maintenance as the
source. It preserves Dungeon's existing changes where they define runtime or
product behavior. The 293 engine paths all exist in the candidate; 43 differ
from public upstream because of retained Dungeon adaptations.

- Preserve the dungeon UI, local Codex/Claude/Gemini choices, selected delegation
  strength, and direct DataForSEO/Firecrawl adapters.
- Refresh Codex specialist profile bodies from the portable agent instructions.
- Keep upstream's managed Python runtime and add the two existing direct API
  adapters to its explicit dispatch allowlist.
- Bind the game prompt to its absolute engine runtime path, so auditing a client
  project does not resolve scripts relative to that client's directory.
- Package the launcher, runtime manifest, update ledger, and original license
  in both Codex installers. Rewrite installed prompt commands to the installed
  runtime path. Setup uses an isolated environment without a global pip fallback.
- Retain Dungeon's existing absence of the optional promotional report footer.
  Copyright/license attribution remains in the distributed source and notices.
- The initial engine import retained game/package version 2.2. The consolidated
  public distribution now aligns both game/package and engine versions at 2.2.5.
  Public release packaging is a subsequent step, separate from this engine audit.

## Redistribution and attribution

[Public upstream's MIT license](https://github.com/AgriciDaniel/claude-seo/blob/a1480c7e590b16001bd9dc1627eacdcd44d580f9/LICENSE)
permits modification and redistribution subject to preserving its copyright
and permission notice. The exact public notice is included in
[LICENSE-CLAUDE-SEO](../LICENSE-CLAUDE-SEO), alongside Dungeon's own license.
[Third-party notices](../THIRD-PARTY-NOTICES.md) identify the public origin,
version, author, and local adaptations. Updated public contributor credits
are retained in [CONTRIBUTORS.md](../CONTRIBUTORS.md).

The bundled FLOW framework/prompts retain their source and CC BY 4.0 notices.
Their component license requires attribution, a license link, and notice of
changes; the project MIT license does not replace it. The existing game art
has separate attributions and licenses listed in the third-party notices;
this engine audit does not newly certify the entire pre-existing asset catalog.

Only already-public upstream history was used as update material.

## Validation

- Full Python regression suite: 425 passed, 9 skipped on Windows (POSIX-only
  executable-bit, signal, or permission checks).
- Actual Windows installer in a temporary home containing spaces, with dependency
  downloads disabled: installed data/runtime/licenses verified, all 23 Codex
  profiles parsed, and installed runtime doctor returned the correct version
  without falsely claiming dependencies were ready.
- Strict portability: 33 skills, zero errors/warnings.
- Strict repository consistency: zero errors/warnings.
- Game prompt policy regression and production Vite build: passed. Vite retains
  its large-bundle advisory; no UI assets or layout were changed.
- Managed runtime setup with `--skip-browser`: passed. Doctor reports
  `ready: true`, `browser_ready: false`, engine 2.2.5. Dispatch smoke checks for
  the update-ledger tool and both direct API adapters passed without paid calls.
- Final focused installer/consistency checks: 7 passed after staging all files.
- All 293 candidate provenance hashes verified; staged file/credential-pattern
  and conflict-marker inspection is clean.
- `git diff --check`: passed.

Upstream-only Windows uninstaller/hosted-workflow tests were not imported because
this update preserves Dungeon's own uninstall and CI implementation. Other
upstream installer tests were adapted to Dungeon's actual Codex packaging;
the real temporary-home install test replaces upstream layout-string assumptions.
No live paid SEO request, client-site edit, desktop session, or public release
was performed as part of these checks.
