#!/usr/bin/env python3
"""Check release inputs without printing credential values or personal content.

By default checks tracked working-tree files plus untracked, non-ignored files.
Use --history for reachable Git blobs (read-only), and --deny TEXT for an
additional case-insensitive private marker. Neither mode certifies image pixels.
"""
from __future__ import annotations

import argparse
import fnmatch
import json
from pathlib import Path
import re
import subprocess


SECRET = re.compile(
    rb"AIza[0-9A-Za-z_-]{35}|ghp_[A-Za-z0-9]{36}|"
    rb"github_pat_[A-Za-z0-9_]{40,}|gh[ous]_[A-Za-z0-9]{36}|"
    rb"AKIA[0-9A-Z]{16}|GOCSPX-[A-Za-z0-9_-]{20,}|"
    rb"sk-(?:proj-)?[A-Za-z0-9]{20,}|xai-[A-Za-z0-9_-]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|"
    rb"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"
)
ARTIFACTS = (
    ".env", ".env.*", "*.pem", "*.key", "*.p12", "*.jsonl", "*.har",
    "oauth-token.json", "client_secret*.json", "service_account*.json",
    "runtime-state.json", "FULL-AUDIT-REPORT.md", "ACTION-PLAN.md",
    "*-AUDIT-REPORT.md", "*-ACTION-PLAN.md", "LOCAL-SEO-ANALYSIS-*",
    "GEO-ANALYSIS-*.md", "MAPS-ANALYSIS-*.md",
)
LOCAL_DIRS = {".logs", ".gbrain", ".claude", ".codex", ".gemini", ".grok", "output", "test-results", "playwright-report"}
SAMPLES = {".env.example", ".env.sample", ".env.template"}


def git(root: Path, *args: str) -> bytes:
    return subprocess.check_output(["git", "-C", str(root), *args])


def content_findings(data: bytes, deny: list[str]) -> list[dict]:
    # Decode text before marker checks: compressed image bytes can coincidentally
    # spell a name. Binary media is inventoried separately for visual review.
    try:
        content = data.decode("utf-8")
    except UnicodeDecodeError:
        return []
    findings = []
    for line, text in enumerate(content.splitlines(), 1):
        if SECRET.search(text.encode("utf-8")):
            findings.append({"line": line, "rule": "credential-pattern"})
        if any(marker.casefold() in text.casefold() for marker in deny):
            findings.append({"line": line, "rule": "private-marker"})
        if "<!-- gbrain:skillpack:begin -->" == text.strip():
            findings.append({"line": line, "rule": "injected-agent-configuration"})
    return findings


def scan(root: Path, *, history: bool = False, deny: list[str] | None = None) -> dict:
    findings, media = [], []
    checked = 0
    if history:
        # One read per unique reachable blob. Names are used only as references;
        # no checkout, rewriting, or mutation of repository history takes place.
        objects = git(root, "rev-list", "--objects", "--all").decode().splitlines()
        proc = subprocess.Popen(["git", "-C", str(root), "cat-file", "--batch"], stdin=subprocess.PIPE, stdout=subprocess.PIPE)
        try:
            for item in objects:
                oid, _, name = item.partition(" ")
                proc.stdin.write((oid + "\n").encode())
                proc.stdin.flush()
                header = proc.stdout.readline().decode().strip().split()
                size = int(header[2])
                data = proc.stdout.read(size)
                proc.stdout.read(1)
                if header[1] != "blob":
                    continue
                checked += 1
                for finding in content_findings(data, deny or []):
                    findings.append({"path": name, "blob": oid, **finding})
        finally:
            proc.stdin.close()
            proc.stdout.close()
            proc.wait()
    else:
        paths = sorted(set(git(root, "ls-files", "--cached", "--others", "--exclude-standard", "-z").decode().strip("\0").split("\0")))
        for name in paths:
            path = root / name
            if not path.is_file():
                continue
            checked += 1
            if (path.name not in SAMPLES and any(fnmatch.fnmatch(path.name, pattern) for pattern in ARTIFACTS)) or LOCAL_DIRS.intersection(Path(name).parts):
                findings.append({"path": name, "rule": "local-artifact"})
            if path.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp", ".gif", ".mp4", ".pdf"} and not name.startswith("dungeon/public/assets/"):
                media.append(name)
            for finding in content_findings(path.read_bytes(), deny or []):
                findings.append({"path": name, **finding})
    return {"mode": "history" if history else "release-inputs", "checked": checked, "findings": findings, "media_requiring_visual_review": media, "ok": not findings}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--history", action="store_true")
    parser.add_argument("--deny", action="append", default=[], help="Private literal marker to reject; values are never echoed")
    args = parser.parse_args()
    result = scan(args.root.resolve(), history=args.history, deny=args.deny)
    print(json.dumps(result, indent=2))
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
