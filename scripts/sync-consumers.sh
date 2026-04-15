#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SOURCE_ROOT="${REPO_ROOT}/.claude/skills"
REPO_AGENTS_ROOT="${REPO_ROOT}/.agents/skills"
WORKSPACE_ROOT="$(cd "${REPO_ROOT}/.." && pwd)"
WORKSPACE_AGENTS_ROOT="${WORKSPACE_ROOT}/.agents/skills"
HOME_AGENTS_ROOT="${HOME}/.agents/skills"
HOME_CLAUDE_ROOT="${HOME}/.claude/skills"

MANAGED_SKILLS=(
  feature-plan
  feature-evaluate-plan
  feature-create-spec
  feature-review-spec
  feature-implement
  feature-code
  feature-fix
  feature-verify
  state-scan
)

DEPRECATED_SKILLS=(
  flow-01-shape
  flow-02-bet
  flow-03-spec-create
  flow-04-spec-review
  flow-05-spec-plan
  flow-06-spec-execute
)

usage() {
  cat <<'EOF'
Usage:
  scripts/sync-consumers.sh check
  scripts/sync-consumers.sh repo-mirror
  scripts/sync-consumers.sh workspace-consumer
  scripts/sync-consumers.sh home-agents
  scripts/sync-consumers.sh home-claude
  scripts/sync-consumers.sh all
EOF
}

require_rsync() {
  if ! command -v rsync >/dev/null 2>&1; then
    echo "ERROR: rsync is required for scripts/sync-consumers.sh" >&2
    exit 1
  fi
}

ensure_source() {
  for skill in "${MANAGED_SKILLS[@]}"; do
    if [[ ! -d "${SOURCE_ROOT}/${skill}" ]]; then
      echo "ERROR: canonical skill missing: ${SOURCE_ROOT}/${skill}" >&2
      exit 1
    fi
  done
}

remove_deprecated() {
  local target_root="$1"
  for skill in "${DEPRECATED_SKILLS[@]}"; do
    if [[ -e "${target_root}/${skill}" ]]; then
      rm -rf "${target_root:?}/${skill}"
      echo "removed deprecated ${target_root}/${skill}"
    fi
  done
}

sync_target() {
  local target_root="$1"
  require_rsync
  ensure_source
  mkdir -p "${target_root}"
  remove_deprecated "${target_root}"

  for skill in "${MANAGED_SKILLS[@]}"; do
    mkdir -p "${target_root}/${skill}"
    rsync -a --checksum --delete "${SOURCE_ROOT}/${skill}/" "${target_root}/${skill}/"
  done

  echo "synced ${target_root}"
}

check_target() {
  local target_root="$1"
  ensure_source

  if [[ ! -d "${target_root}" ]]; then
    echo "DRIFT: missing target root ${target_root}" >&2
    return 1
  fi

  local failed=0
  for skill in "${MANAGED_SKILLS[@]}"; do
    if [[ ! -d "${target_root}/${skill}" ]]; then
      echo "DRIFT: missing ${target_root}/${skill}" >&2
      failed=1
      continue
    fi
    if ! diff -qr "${SOURCE_ROOT}/${skill}" "${target_root}/${skill}" >/dev/null 2>&1; then
      echo "DRIFT: ${target_root}/${skill} differs from canonical source" >&2
      failed=1
    fi
  done

  for skill in "${DEPRECATED_SKILLS[@]}"; do
    if [[ -e "${target_root}/${skill}" ]]; then
      echo "DRIFT: deprecated skill still present at ${target_root}/${skill}" >&2
      failed=1
    fi
  done

  if [[ "${failed}" -eq 0 ]]; then
    echo "OK: ${target_root}"
    return 0
  fi

  return 1
}

check_all() {
  local failed=0
  check_target "${REPO_AGENTS_ROOT}" || failed=1
  check_target "${WORKSPACE_AGENTS_ROOT}" || failed=1
  check_target "${HOME_AGENTS_ROOT}" || failed=1
  check_target "${HOME_CLAUDE_ROOT}" || failed=1
  return "${failed}"
}

main() {
  local command="${1:-}"

  case "${command}" in
    check)
      check_all
      ;;
    repo-mirror)
      sync_target "${REPO_AGENTS_ROOT}"
      ;;
    workspace-consumer)
      sync_target "${WORKSPACE_AGENTS_ROOT}"
      ;;
    home-agents)
      sync_target "${HOME_AGENTS_ROOT}"
      ;;
    home-claude)
      sync_target "${HOME_CLAUDE_ROOT}"
      ;;
    all)
      sync_target "${REPO_AGENTS_ROOT}"
      sync_target "${WORKSPACE_AGENTS_ROOT}"
      sync_target "${HOME_AGENTS_ROOT}"
      sync_target "${HOME_CLAUDE_ROOT}"
      check_all
      ;;
    *)
      usage >&2
      exit 1
      ;;
  esac
}

main "${1:-}"
