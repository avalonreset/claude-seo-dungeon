# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
