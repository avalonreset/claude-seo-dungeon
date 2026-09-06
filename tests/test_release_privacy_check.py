"""Real Git fixtures ensure the release gate catches local and historic leaks."""
import importlib.util
from pathlib import Path
import subprocess


spec = importlib.util.spec_from_file_location("release_privacy_check", Path(__file__).resolve().parents[1] / "scripts/release_privacy_check.py")
privacy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(privacy)


def run_git(root, *args):
    subprocess.run(["git", "-C", str(root), *args], check=True, capture_output=True)


def test_scans_tracked_and_new_inputs_without_echoing_secret(tmp_path):
    run_git(tmp_path, "init")
    (tmp_path / "readme.md").write_text("Public documentation")
    run_git(tmp_path, "add", "readme.md")
    secret = "ghp_" + "1a2b3c" * 6
    (tmp_path / ".env").write_text("TOKEN=" + secret + "\nXAI_TOKEN=xai-" + "5e6f7a" * 6)
    (tmp_path / "client.txt").write_text("A private-customer.example audit")
    result = privacy.scan(tmp_path, deny=["private-customer.example"])
    assert {f["rule"] for f in result["findings"]} == {"credential-pattern", "private-marker", "local-artifact"}
    assert secret not in str(result)
    assert "private-customer.example" not in str(result)


def test_history_finds_removed_secret_and_leaves_worktree_clean(tmp_path):
    run_git(tmp_path, "init")
    run_git(tmp_path, "config", "user.name", "Test")
    run_git(tmp_path, "config", "user.email", "test@example.com")
    source = tmp_path / "old.txt"
    source.write_text("ghp_" + "2b3c4d" * 6)
    run_git(tmp_path, "add", ".")
    run_git(tmp_path, "commit", "-m", "Fixture")
    source.write_text("Removed")
    run_git(tmp_path, "add", ".")
    run_git(tmp_path, "commit", "-m", "Clean fixture")
    assert privacy.scan(tmp_path)["ok"]
    result = privacy.scan(tmp_path, history=True)
    assert not result["ok"]
    assert result["findings"][0]["path"] == "old.txt"
    assert privacy.git(tmp_path, "status", "--porcelain") == b""


def test_examples_and_binary_pixels_are_not_personal_content(tmp_path):
    run_git(tmp_path, "init")
    (tmp_path / ".env.example").write_text("TOKEN=YOUR_TOKEN")
    (tmp_path / "image.png").write_bytes(b"\x89PNG\xffprivate-marker")
    result = privacy.scan(tmp_path, deny=["private-marker"])
    assert result["ok"]
    assert result["media_requiring_visual_review"] == ["image.png"]
