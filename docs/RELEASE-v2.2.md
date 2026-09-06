# Legends SEO Dungeon v2.2 Refresh Notes

## Scope

This refresh keeps the existing private `v2.2` line. It does not bump project
version metadata, create a tag, publish a release, or change the packaged
runtime defaults.

Codex remains the default Legends SEO Dungeon runtime. Claude Code and Gemini
CLI remain optional local runtime overrides/backward-compatible choices through
the existing picker and bridge settings.

## Refresh Highlights

- Refreshed `data/google-updates.json` from the stale 2026-05-25 verification
  state through the official Google Search Status Dashboard and Search Central
  posts available on 2026-07-09.
- Added the February 2026 Discover update, March 2026 spam update, back-button
  hijacking policy, May/June 2026 Search documentation changes, June 2026 spam
  update, Merchant Center `video_link`, and the July 2026 Search Console platform
  property update.
- Corrected Core Web Vitals language to use inclusive good thresholds and
  updated the Soft Navigations origin-trial wording.
- Clarified `llms.txt` as optional and ignored by Google Search, while preserving
  its non-Google AI crawler and agent-documentation usefulness.
- Filled missing DataForSEO cost/tool references in the core skill and extension
  mirror, fixed the API-module count, and documented the Google Images SERP
  command consistently.
- Corrected stale setup/reference URLs for Firecrawl, SE Ranking, Ahrefs,
  Indexing API quota docs, Privacy Sandbox, and DataForSEO pricing.
- Updated private command and architecture docs so optional extensions are
  documented as `/seo <extension>` commands when installed.

## Intentionally Excluded

- Upstream Claude SEO Brain marketing and `pro/seo-brain` workflow copy were not
  imported. They conflict with the private Legends SEO Dungeon distribution and
  Codex-first positioning.
- Upstream public `CITATION.cff` release-date cleanup was not imported because
  private version metadata stays on the existing v2.2 line.

## Verification

Run before publishing the reviewed private release:

```bash
python scripts/portability_check.py --strict
python -m pytest tests/test_content_quality.py tests/test_manifest_consistency.py -q
git diff --check
git status --short --branch
```

The parent release orchestrator should publish/update the existing private v2.2
GitHub release after reviewing the local commit.
