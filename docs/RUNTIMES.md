# Supported game runtimes

Install and sign in to at least one CLI, then choose it on the title screen.
The game uses local official CLI processes and their authentication. It does not
include credentials or connect to a maintainer's account. Run a simple prompt
in your selected CLI first so any interactive sign-in is complete.

| Runtime | Official setup | Game transport | Warrior / Samurai / Knight |
| --- | --- | --- | --- |
| Codex | [Codex CLI](https://developers.openai.com/codex/cli/) | `codex app-server --stdio` | xhigh / high / medium effort |
| Claude | [Claude Code](https://code.claude.com/docs/en/setup) | `claude --print --output-format text --permission-mode acceptEdits` | Opus / Sonnet / Haiku |
| Gemini | [Gemini CLI](https://geminicli.com/docs/get-started/installation/) | `gemini --prompt ... --output-format text --approval-mode auto_edit` | Pro / Flash / Flash-Lite |
| Grok | [xAI Grok Build](https://github.com/xai-org/grok-build) | `grok --single ... --output-format plain --permission-mode acceptEdits` | configured model; high / high / medium effort |

Codex is selected by default and requires explicitly arming its YOLO toggle.
The other runtimes use their edit-accepting modes and do not require the Codex
toggle. Commands outside those modes' permissions can be denied in headless
operation; the Guild Ledger shows the CLI result. The remote-control helper
and active-turn steering remain Codex-specific. Audits, attacks, and ordinary
Guild Ledger prompts work through all four selected runtimes.

## Grok configuration

Use xAI's official Grok CLI, not an unrelated package with the same command name.
The bridge looks for the official binary in `~/.grok/bin` (or `GROK_HOME/bin`)
before searching PATH. `SEO_DUNGEON_GROK_CLI` overrides that discovery with an
explicit executable path. Keep executable paths separate from argument strings.

Grok uses the model configured in your CLI account by default. Optional overrides:

| Variable | Meaning |
| --- | --- |
| `SEO_DUNGEON_GROK_MODEL` | Model for every character |
| `SEO_DUNGEON_GROK_MODEL_DEEP`, `_BALANCED`, `_FAST` | Per-character model override |
| `SEO_DUNGEON_GROK_EFFORT_DEEP`, `_BALANCED`, `_FAST` | Per-character reasoning effort |
| `SEO_DUNGEON_GROK_ARGS` | Advanced argument template; use `{{prompt}}` for the prompt |

Use `grok models` to find model IDs available to your account. The template's
default is `--single {{prompt}} --output-format plain --permission-mode acceptEdits`.
Use only effort values supported by your selected model. Model values `default`,
`auto`, and `none` tell the bridge to leave model selection to the CLI.

Claude and Gemini support the same `SEO_DUNGEON_<RUNTIME>_CLI`, `_MODEL`,
`_MODEL_DEEP`, `_MODEL_BALANCED`, `_MODEL_FAST`, and `_ARGS` override pattern.
See the main README for their defaults. API authentication is optional where
the provider supports account sign-in; choose the provider's supported method.

## Engine and other agents

Run `python scripts/runtime.py setup` once from the extracted Dungeon folder.
The game prompt supplies the absolute engine path even when your audited project
is elsewhere. The root Codex skill installer is optional for game use and
installs skills for direct Codex use outside the game.

Other terminal agents can read `AGENTS.md`, `skills/`, `agents/`, and `scripts/`
as portable instructions. They are not additional tested game-picker runtimes.

## Verification

`npm run test:cli` checks Codex transport. `npm run test:runtimes` launches real
child-process fixtures for Claude, Gemini, and Grok, checks their arguments,
streaming, profiles, literal prompt handling, and nonzero failures. These tests
need no provider account. `npm run test:dialogue` checks runtime selection in a
headless browser. Provider login and model entitlement remain local prerequisites.

The Grok arguments follow [xAI's headless reference](https://github.com/xai-org/grok-build/blob/main/crates/codegen/xai-grok-pager/docs/user-guide/14-headless-mode.md).
