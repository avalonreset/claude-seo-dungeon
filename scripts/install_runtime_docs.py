"""Bind this suite's installed prompts to its absolute managed runtime path."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def bind(source: Path, skills: Path, agents: Path) -> None:
    runtime = (skills / "seo" / "scripts" / "runtime.py").resolve().as_posix()
    command = f'python "{runtime}"'
    for skill in (source / "skills").iterdir():
        if not (skill / "SKILL.md").is_file():
            continue
        for doc in (skills / skill.name).rglob("*.md"):
            text = doc.read_text(encoding="utf-8")
            for action in ("run", "setup", "doctor"):
                text = text.replace(f"claude-seo {action}", f"{command} {action}")
            doc.write_text(text, encoding="utf-8", newline="\n")
    for profile in (source / "agents-codex").glob("*.toml"):
        installed = agents / profile.name
        text = installed.read_text(encoding="utf-8")
        # TOML basic strings use the same quote/backslash escapes as JSON here.
        escaped = json.dumps(command)[1:-1]
        for action in ("run", "setup", "doctor"):
            text = text.replace(f"claude-seo {action}", f"{escaped} {action}")
        installed.write_text(text, encoding="utf-8", newline="\n")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--skills-root", type=Path, required=True)
    parser.add_argument("--agents-root", type=Path, required=True)
    args = parser.parse_args()
    bind(Path(__file__).resolve().parents[1], args.skills_root, args.agents_root)


if __name__ == "__main__":
    main()
