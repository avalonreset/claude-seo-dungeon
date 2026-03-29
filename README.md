# Claude SEO Dungeon

A gamified 16-bit dungeon crawler that turns SEO audits into boss battles. Choose your character, descend into the dungeon, and slay your SEO demons one by one.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.0-blue)](CHANGELOG.md)
[![Built with Phaser](https://img.shields.io/badge/built%20with-Phaser%203-orange)](https://phaser.io/)
[![Powered by Claude](https://img.shields.io/badge/powered%20by-Claude%20Code-blueviolet)](https://claude.ai/claude-code)

![Gate Scene](screenshots/gate-2cached.png)

## How It Works

1. **Choose your warrior** - Warrior (Opus), Samurai (Sonnet), or Knight (Haiku)
2. **Enter a domain** - The SEO audit runs via Claude Code, discovering issues as dungeon demons
3. **Explore the dungeon** - Browse discovered SEO issues sorted by severity in the Dungeon Hall
4. **Battle demons** - Turn-based combat with attack, vanquish (AI-powered fix), defend, and flee
5. **Collect loot** - Earn XP and rewards for every demon slain

Each demon represents a real SEO issue found on the target site. The "Vanquish" action channels Claude to generate and apply an actual fix to the codebase.

## Features

- **16-bit pixel art** - Three animated character classes with idle, run, attack, hit, and death sprites
- **Procedural sound effects** - 25+ synthesized sounds via Web Audio API (zero audio files)
- **Real SEO analysis** - WebSocket bridge connects Phaser game to Claude Code's SEO audit pipeline
- **AI-powered fixes** - Channeling mechanic generates real code fixes during battle
- **4K rendering** - DPR-aware canvas scaling for crisp text on high-DPI displays
- **Atmospheric effects** - Dust motes, embers, ground fog, and procedural brick wall backgrounds
- **Guild Ledger** - Real-time activity log with rich formatting, icons, and typing animations
- **Cinematic transitions** - Fade-to-black sequences for descending and ascending

## Quick Start

```bash
cd dungeon
npm install
npm run dev
```

This starts both the WebSocket bridge server and the Vite dev server. Open `http://localhost:3000` in your browser.

### Production Build

For optimized performance (recommended for recording/demos):

```bash
cd dungeon
npm run build
npx serve dist -l 3000 -s
```

Make sure the bridge server is still running (`npm run server` in another terminal).

### Prerequisites

- Node.js 18+
- [Claude Code](https://claude.ai/claude-code) (for SEO audit functionality)

## Architecture

```
claude-seo-dungeon/
  dungeon/
    index.html                   # Game shell + title screen
    src/
      main.js                    # Entry point, title screen logic
      knight-sprite.js           # Character select animations
      activity-log.js            # Guild Ledger system
      utils/
        ws.js                    # WebSocket bridge client
        sound-manager.js         # Procedural audio engine
      scenes/
        BootScene.js             # Asset loading
        GateScene.js             # Continue/new quest selection
        SummoningScene.js        # Audit progress + loading
        DungeonHallScene.js      # Issue browser (demon list)
        BattleScene.js           # Turn-based combat
        VictoryScene.js          # Post-battle rewards
    server/
      index.js                   # Express + WebSocket bridge
    assets/
      luizmelo/                  # Sprite sheets (warrior, samurai, knight)
```

## Character Classes

| Character | Model | Strengths |
|-----------|-------|-----------|
| **Warrior** | Claude Opus | Maximum analytical depth |
| **Samurai** | Claude Sonnet | Balanced speed and quality |
| **Knight** | Claude Haiku | Fast, efficient combat |

## Tech Stack

- **[Phaser 3](https://phaser.io/)** - 2D game framework
- **[Vite](https://vitejs.dev/)** - Build tool and dev server
- **[Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)** - Procedural sound synthesis
- **Express + WebSocket** - Bridge between game UI and Claude Code
- **[Sprite assets by LuizMelo](https://luizmelo.itch.io/)** - Character sprite sheets

## Hackathon Context

Built for the Claude Code hackathon. The idea: what if SEO audits weren't boring spreadsheets but dungeon crawls where every issue is a monster you can fight?

The game connects to Claude Code's SEO analysis pipeline through a WebSocket bridge. When you "vanquish" a demon, Claude generates a real fix for the SEO issue and applies it to your codebase.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

[MIT](LICENSE)
