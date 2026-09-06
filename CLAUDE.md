# Legends SEO Dungeon Compatibility Notes

Treat this repository as the open-source Legends SEO Dungeon build. Use
`AGENTS.md` for the full operating policy.

The browser game supports Codex, Claude, Gemini, and Grok. The SEO engine is stored as portable files,
so compatible terminal-agent workflows can read the same source:

- Start at `skills/seo/SKILL.md` for `/seo` routing.
- Use `agents/` prompt files when a task needs a specialist SEO perspective.
- Run Python helpers from `scripts/` when the skill asks for executable checks.
- Preserve the URL-safety guards in `scripts/url_safety.py`.
- Keep user-facing naming as `Legends SEO Dungeon`.
