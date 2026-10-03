#!/bin/bash
# Installs the Agent Reach CLI in Claude Code cloud sessions.
# The skill itself lives in .claude/skills/agent-reach.
set -euo pipefail

# Only run in remote (cloud) sessions; locally, install it once by hand.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

if command -v agent-reach >/dev/null 2>&1; then
  exit 0
fi

AGENT_REACH_REF="a19a171"  # pinned commit of github.com/Panniantong/Agent-Reach (v1.5.0)

pip install --quiet "git+https://github.com/Panniantong/Agent-Reach.git@${AGENT_REACH_REF}" >&2

# Zero-config channels: mcporter + Exa search.
agent-reach install --env=auto --system >/dev/null 2>&1 || true

# yt-dlp needs a JS runtime for YouTube.
mkdir -p "$HOME/.config/yt-dlp"
grep -qxF -- '--js-runtimes node' "$HOME/.config/yt-dlp/config" 2>/dev/null \
  || printf '%s\n' '--js-runtimes node' >> "$HOME/.config/yt-dlp/config"
