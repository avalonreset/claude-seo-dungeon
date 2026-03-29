# Claude SEO Dungeon

## Project Overview

A gamified 16-bit dungeon crawler that turns SEO audits into boss battles.
Built with Phaser.js and powered by Claude Code's SEO analysis pipeline.
Players choose a character class (Warrior/Opus, Samurai/Sonnet, Knight/Haiku),
enter a domain, and fight SEO issue "demons" in turn-based combat. The "Vanquish"
action channels Claude to generate real code fixes during battle.

## Architecture

```
claude-seo-dungeon/
  dungeon/                           # Game application
    index.html                     # Game shell + title screen UI
    launch.js                      # Startup script
    vite.config.js                 # Vite build configuration
    server/
      index.js                     # Express + WebSocket bridge to Claude Code
    src/
      main.js                      # Entry point, title screen, transitions
      knight-sprite.js             # Character select sprite animations
      activity-log.js              # Guild Ledger (real-time log panel)
      utils/
        ws.js                      # WebSocket bridge client
        sound-manager.js           # Procedural audio engine (Web Audio API)
      scenes/
        BootScene.js               # Asset loading + DPR setup
        GateScene.js               # Continue/new quest selection
        SummoningScene.js          # Audit progress + loading animations
        DungeonHallScene.js        # Browse SEO issues (demon list)
        BattleScene.js             # Turn-based combat system
        VictoryScene.js            # Post-battle XP + loot rewards
    assets/
      luizmelo/                    # Character sprite sheets
  skills/                           # Claude Code SEO skills (backend)
    seo/SKILL.md                   # Main orchestrator
    seo-audit/SKILL.md             # Full site audit
    seo-technical/SKILL.md         # Technical SEO
    seo-content/SKILL.md           # E-E-A-T analysis
    seo-schema/SKILL.md            # Schema.org markup
    seo-sitemap/SKILL.md           # XML sitemap analysis
    seo-geo/SKILL.md               # AI search optimization
    seo-local/SKILL.md             # Local SEO
    seo-maps/SKILL.md              # Maps intelligence
    (+ 7 more sub-skills)
  agents/                           # Subagents for parallel analysis
  scripts/                          # Python execution scripts
  extensions/                       # DataForSEO + Banana MCP installers
  docs/                             # Extended documentation
```

## Game Scenes (Flow)

```
Title Screen → Gate → Summoning → Dungeon Hall → Battle → Victory
     ↑                                              ↓
     └──────────── Return to Guild ←────────────────┘
```

1. **Title Screen** (HTML): Domain input, character select, volume control
2. **Gate Scene** (HTML overlay): Continue quest / new quest per character
3. **Summoning Scene** (Phaser): Audit runs, progress bar, Guild Ledger updates
4. **Dungeon Hall** (Phaser): Browse demons sorted by SEO impact severity
5. **Battle Scene** (Phaser): Turn-based combat with attack/vanquish/defend/flee
6. **Victory Scene** (Phaser): XP rewards, loot drops, next demon or return

## Development

```bash
cd dungeon
npm install
npm run dev          # Starts Vite + WebSocket bridge
```

### Dev Shortcuts

- `?battle=1` - Skip to battle scene with first cached demon
- `?battle=1&issue=2` - Skip to specific issue index

### Key Files

- `dungeon/src/scenes/BattleScene.js` - Main combat logic (~2400 lines)
- `dungeon/src/utils/sound-manager.js` - 25+ procedural sound effects
- `dungeon/src/knight-sprite.js` - Character select animations
- `dungeon/server/index.js` - WebSocket bridge to Claude Code

### Rules

- Phaser scenes go in `dungeon/src/scenes/`
- Utility modules go in `dungeon/src/utils/`
- All audio is procedural (Web Audio API) - no audio files
- Canvas renders at 3x DPR minimum for 4K text clarity
- Sprite assets stay under `dungeon/assets/luizmelo/`

## SEO Backend

The SEO analysis is powered by Claude Code skills bundled in `skills/` and `agents/`.
These run server-side through the WebSocket bridge when a player starts an audit.

| Command | Purpose |
|---------|---------|
| `/seo audit <url>` | Full site audit with parallel subagents |
| `/seo technical <url>` | Technical SEO (crawlability, security, CWV) |
| `/seo content <url>` | E-E-A-T and content quality |
| `/seo schema <url>` | Schema.org detection and generation |
| `/seo geo <url>` | AI search / GEO optimization |

## Ecosystem

Part of the avalonreset-pro tool suite:
- [Claude SEO](https://github.com/avalonreset-pro/claude-seo-dungeon) - this project
- [Claude GitHub](https://github.com/avalonreset-pro/claude-github) - GitHub repo optimization
- [Codex SEO](https://github.com/avalonreset-pro/codex-seo) - SEO tools for Codex CLI
