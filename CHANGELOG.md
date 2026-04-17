# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.9.0] - 2026-04-17

### Game experience - late-day polish (April 17)

- **Gate scene: knight turns toward the selected card.** Hovering Continue Quest (left) or New Quest (right) now swings the knight to face that direction; clicking locks the facing and the slash animation fires in that direction. Fixes the old random-cycle bug where the slash often pointed away from the card just picked. Works for all three character classes.
- **Linkify the Guild Ledger.** URLs become clickable blue anchors (open in new tab). Backticked paths/commands become green copy-to-clipboard spans with a toast confirmation. Tokenizer uses DOM nodes (no innerHTML/XSS surface). `window.addLog` exposed for console-based debugging.
- **Demon damage actually lands.** Old bug: `Math.floor(demonMaxHP * 0.05)` rounded to 0 for any demon under 20 HP. New formula: 12-18% of max HP with minimum 1, stronger hit when Claude actually edited files (fixData.fixed = true), hard floor at 15% so only VANQUISH kills. When HP drops below 30%, 40% chance of regen per attack with gothic flavor line ("The Archdemon steels itself against the wound.").
- **Palette refresh: black content surfaces, blue interactive surfaces.** Narrator box, top issue description, Guild Ledger, Dungeon Hall rows, Victory panel, Gate cards, Title shell all moved from navy-tinted (`#08081a / 0x0a0a24`) to near-black (`#060608`). ATTACK / VANQUISH / DEFEND / FLEE menu + both HP panels + form inputs stay blue as interactive chrome. Gold borders on content, blue borders on interactive.
- **Remember last domain + project path.** On successful descend, `seo_dungeon_last_domain` + `seo_dungeon_last_path` are written to localStorage. Next launch restores them. First-time users still see the HTML defaults (`seodungeon.com` / `D:\seodungeon`).
- **PWA metadata** (icon.svg, manifest.webmanifest, apple-touch-icon, theme-color) so the game can be installed as a web app.

### Incidents resolved

- **Binary corruption from em-dash cleanup.** A `sed` run over `git ls-files` matched the UTF-8 em-dash byte sequence (`E2 80 94`) inside compressed image data in 471 binary files, deleting 1-6 bytes from each and corrupting every PNG/WebP. Restored all 418 still-tracked binaries from the pre-corruption commit. Added explicit `binary` rules to `.gitattributes` for every image/font/archive/media extension so it can't happen again. Pruned 6083 unused asset files (14 MB DCSS tileset + unused LuizMelo packs + DCSS fallback monsters).

### Game experience - second pass (April 17)

- **13-demon animated roster** (replacing the 24-demon DCSS static experiment). Every demon is a 0x72 DungeonTileset II character with a real 4-frame idle animation, tier-ranked:
  - *Critical:* The Archdemon, The Ogre
  - *High:* Orc Warrior, Risen Colossus, Skeleton Warrior
  - *Medium:* Chort, Masked Orc, Pumpkin Fiend
  - *Low:* Orc Shaman, Imp, Wogol
  - *Info:* Goblin, Tiny Zombie
- **NEAREST pixel filter** applied to every demon frame (previously only the original 5 severities were crisp; new-tier demons were falling back to LINEAR and rendering soft).
- **Themed assignment engine**: SEO category → demon archetype mapping (schema → enforcers, broken links → skeletons, performance → imps, stale content → zombies, etc.) plus tier-rank hierarchy so the worst issue always faces the top demon.
- **Cinematic silhouette state** for undefeated demons: blacked-out silhouette with tier-escalating aura (critical gets full aura + embers + halo).
- **Cinematic defeated state**: blood-red drain tint, slump rotation, layered blood pool with drip droplets, 2-4 painterly killing-blow slashes, blood spatter ring, corner `DEFEATED` stamp. Corpses freeze on a deterministic random idle frame so every one looks slightly different.
- **Final victory sequence - "The Hall Is Still"**: 4-phase Dark-Souls-inspired finale when every demon is defeated. Veil dimming, title type-in, parchment-style stat ledger (demon counts per tier + XP + active quest time), name awarded by total XP (*Trespasser / Warden / Cleanser / Undying*), and two choices: `SEEK ANOTHER` (back to splash for a new audit) or `REMAIN` (walk among the dead).
- **Visibility-aware quest timer**: `TIME IN THE DARK` only counts time the tab was visible. Alt-Tab, minimize, lid-close - none of it pads the total.
- **Battle prompts anchored to the selected demon**: server builds a structured `DEMON FILE` focus header with every available field (severity, category, URL, file, selector, line, id, description). Claude reads user intent naturally - polite directives ("can you fix this?") work as fixes, questions get answered without triggering edits, ambiguous messages get a clarifying question instead of a guess.
- **Neutral out-of-battle chat**: `bridge.chat()` / server `chat` type for when you're not fighting a demon - pure pass-through to `claude -p` with your selected model and project dir, zero framing.
- **Expanded gothic flavor text**: ~700 descent lines, ~260 hall lines, single-line hacker ticker with chunked type-in (5-6× faster) and three width-preserving exit variants (fade-drift, dissolve, wipe) instead of reverse-typing oscillation.
- **Internal QA harness** (`dungeon/tests/run-tests.mjs`): 232 assertions covering manifest logic, battle prompt shape, asset reachability, bridge routing, and Playwright headless smoke.

## [1.9.0] - 2026-04-16

### Added
- **6 new SEO skills**: seo-backlinks (backlink profile analysis with Moz/Bing/CC), seo-cluster (SERP-based semantic topic clustering), seo-sxo (search experience optimization), seo-drift (SEO change monitoring), seo-ecommerce (e-commerce SEO + marketplace intel), seo-google (Google SEO APIs: GSC, PageSpeed, CrUX, GA4, Indexing API)
- **6 new subagents**: Matching agents for each new skill (17 total agents, up from 11)
- **21 new Python scripts**: Google API clients, backlink analysis, drift monitoring, DataForSEO utilities, report generation
- **Firecrawl extension**: Full-site crawling and site mapping via Firecrawl MCP
- **AGENTS.md**: Multi-platform support instructions (Cursor, Antigravity)
- **CONTRIBUTORS.md**: Credits for Pro Hub Challenge community contributors
- **Report generation**: PDF/HTML/Excel reports via WeasyPrint + matplotlib
- **Security patches**: urllib3 CVE-2026-21441 (CVSS 8.9), Playwright CVE-2025-59288, Pillow CVE-2025-48379

### Changed
- **SEO engine upgraded**: v1.6.1 → v1.9.0 (parity with upstream AgriciDaniel/claude-seo)
- **Main orchestrator**: Now routes 23 skills (20 core + 3 extensions) with up to 15 parallel subagents
- **seo-audit**: Expanded to integrate backlinks, clustering, SXO, drift, e-commerce, and Google API agents
- **seo-images**: Added SERP image analysis and Google Shopping image eligibility checks
- **seo-hreflang**: Added DACH, FR, ES, JA cultural adaptation profiles and content parity checks
- **All skills**: Version bumped to 1.9.0 with MIT LICENSE.txt files
- **requirements.txt**: Added Google API, report generation, and Excel export dependencies
- **plugin.json**: Updated to v1.9.0 with 34 keywords (added clustering, SXO, drift, e-commerce, backlinks)
- **fetch_page.py**: Enhanced with SSRF-safe URL validation
- **parse_html.py**: Enhanced for drift tracking and schema extraction

### Preserved
- **Dungeon crawler UI**: All game code, scenes, sprites, sounds untouched
- **13 visual audit scripts**: Dungeon-exclusive visual analysis tools preserved alongside upstream scripts

## [0.1.0] - 2026-03-29

### Added
- **Dungeon crawler UI**: Full 16-bit pixel art game built with Phaser.js
- **Character select**: Three playable characters (Warrior/Opus, Samurai/Sonnet, Knight/Haiku) with animated sprite previews
- **SEO audit integration**: WebSocket bridge connects Phaser game to Claude Code SEO analysis
- **Battle system**: Turn-based combat against SEO issue "demons" with attack, vanquish, defend, and flee actions
- **Channeling mechanic**: AI-powered fix generation during battle via Claude API
- **Gate scene**: Continue quest / new quest selection with cached audit data
- **Summoning scene**: Animated audit progress with real-time Guild Ledger updates
- **Dungeon hall**: Browse discovered SEO issues sorted by impact severity
- **Victory scene**: XP and loot rewards after defeating demons
- **Guild Ledger**: Real-time activity log with rich formatting, icons, and animations
- **Procedural sound effects**: 25+ synthesized sounds via Web Audio API (no audio files)
- **Volume control**: SFX toggle and slider with localStorage persistence
- **4K rendering**: DPR-aware canvas scaling for crisp text on high-DPI displays
- **Cinematic transitions**: Fade-to-black sequences for descending/ascending
- **Atmospheric particles**: Dust motes, embers, and ground fog in battle scenes
- **Animated demon sprites**: Procedurally generated demon visuals per SEO issue category
