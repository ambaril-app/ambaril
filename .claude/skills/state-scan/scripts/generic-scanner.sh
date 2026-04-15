#!/bin/bash
# generic-scanner.sh — project-agnostic state scanner for the feature-lifecycle pipeline
#
# Works by parsing markdown spec files. No index file required.
# Designed as the fallback when checks.state_scan is null in project.yaml.
#
# Compatible with bash 3.2+ (macOS default).
#
# Usage:
#   bash generic-scanner.sh <mode> [args...]
#
# Modes:
#   similarity --slug X --module Y          → similar slug/module check
#   tables --input "name1,name2"            → collision check on table names
#   routes --input "GET /api/foo"           → collision check on routes
#   perms --input "module:resource:act"     → collision check on permissions
#   events --input "module.event"           → collision check on events
#   providers --input "name1,name2"         → check provider already declared
#   refs --target M --from N               → cross-module reference check
#   files --input "path1,path2"            → file ownership check (no-op v1)
#   drift --module M                       → spec vs code drift (basic grep)
#   all --spec-file PATH                   → run tables+routes+perms+events+providers
#   refresh-if-stale                       → no-op (no index to refresh)
#
# Output: JSON to stdout, diagnostics to stderr.
# Exit codes:
#   0 = clear or warning only
#   1 = hard_block (exact collision detected)
#   2 = internal error
#
# Environment:
#   SPECS_DIR — override specs directory (default: auto-detected from project.yaml)
#   PROJECT_ROOT — override project root (default: current working directory)

set -uo pipefail

# ─── Configuration ──────────────────────────────────────────────────

PROJECT_ROOT="${PROJECT_ROOT:-$(pwd)}"
SPECS_DIR="${SPECS_DIR:-}"
PLANS_DIR="${PLANS_DIR:-}"

# ─── Helpers ────────────────────────────────────────────────────────

err() { echo "generic-scanner: $1" >&2; }

trim() {
  local s="${1:-}"
  s="${s#"${s%%[![:space:]]*}"}"
  s="${s%"${s##*[![:space:]]}"}"
  printf '%s' "$s"
}

json_escape() {
  printf '%s' "${1:-}" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

to_lower() {
  printf '%s' "${1:-}" | tr '[:upper:]' '[:lower:]'
}

# Check if a newline-delimited list contains a value (case-insensitive)
list_contains() {
  local list=$1
  local val=$2
  local lower_val
  lower_val=$(to_lower "$val")
  printf '%s\n' "$list" | while IFS= read -r entry; do
    [[ "$(to_lower "$entry")" == "$lower_val" ]] && echo "yes" && return
  done
}

# Resolve specs directory from project.yaml or use sensible defaults
resolve_specs_dir() {
  if [[ -n "$SPECS_DIR" ]]; then
    return
  fi

  # Try to read from project.yaml
  if [[ -f "$PROJECT_ROOT/project.yaml" ]]; then
    local yaml_specs
    yaml_specs=$(awk '/^[[:space:]]*specs:/ { gsub(/^[[:space:]]*specs:[[:space:]]*/, ""); gsub(/"/, ""); gsub(/'"'"'/, ""); print; exit }' "$PROJECT_ROOT/project.yaml" 2>/dev/null || true)
    yaml_specs=$(trim "$yaml_specs")
    if [[ -n "$yaml_specs" && "$yaml_specs" != "null" ]]; then
      SPECS_DIR="$PROJECT_ROOT/$yaml_specs"
      return
    fi
  fi

  # Fallback: try common spec locations
  for candidate in "docs/specs" "docs/modules" "specs" "docs"; do
    if [[ -d "$PROJECT_ROOT/$candidate" ]]; then
      SPECS_DIR="$PROJECT_ROOT/$candidate"
      return
    fi
  done

  # Last resort: project root
  SPECS_DIR="$PROJECT_ROOT"
}

resolve_plans_dir() {
  if [[ -n "$PLANS_DIR" ]]; then
    return
  fi

  if [[ -f "$PROJECT_ROOT/project.yaml" ]]; then
    local yaml_plans
    yaml_plans=$(awk '/^[[:space:]]*plans:/ { gsub(/^[[:space:]]*plans:[[:space:]]*/, ""); gsub(/"/, ""); gsub(/'"'"'/, ""); print; exit }' "$PROJECT_ROOT/project.yaml" 2>/dev/null || true)
    yaml_plans=$(trim "$yaml_plans")
    if [[ -n "$yaml_plans" && "$yaml_plans" != "null" ]]; then
      PLANS_DIR="$PROJECT_ROOT/$yaml_plans"
      return
    fi
  fi

  for candidate in "docs/plans" "plans" "docs"; do
    if [[ -d "$PROJECT_ROOT/$candidate" ]]; then
      PLANS_DIR="$PROJECT_ROOT/$candidate"
      return
    fi
  done

  PLANS_DIR="$PROJECT_ROOT"
}

# Find all markdown spec files
find_spec_files() {
  if [[ ! -d "$SPECS_DIR" ]]; then
    return
  fi
  find "$SPECS_DIR" -name '*.md' -type f 2>/dev/null | sort
}

find_plan_files() {
  if [[ ! -d "$PLANS_DIR" ]]; then
    return
  fi
  find "$PLANS_DIR" -name '*.md' -type f 2>/dev/null | sort
}

# Extract module slug from a spec file path
# e.g., docs/specs/erp/orders.md -> erp
# e.g., docs/specs/erp.md -> erp
module_from_path() {
  local path=$1
  local base_dir="$SPECS_DIR"
  if [[ -n "$PLANS_DIR" && "$path" == "$PLANS_DIR/"* ]]; then
    base_dir="$PLANS_DIR"
  fi

  local rel="${path#"$base_dir/"}"

  # If path contains a directory under specs, use directory name
  if [[ "$rel" == */* ]]; then
    printf '%s' "${rel%%/*}"
  else
    # Use filename without extension
    local base
    base=$(basename "$rel" .md)
    printf '%s' "$base"
  fi
}

# Extract spec status from frontmatter
spec_status() {
  local file=$1
  local status
  status=$(awk '/^---$/ { fm++; next } fm==1 && /^status:/ { gsub(/^status:[[:space:]]*/, ""); gsub(/"/, ""); print; exit }' "$file" 2>/dev/null)
  printf '%s' "${status:-unknown}"
}

# Search a spec file for identifiers matching a pattern type
extract_from_spec() {
  local file=$1
  local type=$2
  local index_block=""
  index_block=$(awk '
    /^##[[:space:]]+State Scan Index/ { in_block=1; next }
    in_block && /^##[[:space:]]+/ { exit }
    in_block { print }
  ' "$file" 2>/dev/null || true)

  case "$type" in
    tables)
      if [[ -n "$index_block" ]]; then
        printf '%s\n' "$index_block" | awk '/^- Tables:/,/^- [A-Z]/{if ($0 ~ /^- [A-Z]/ && $0 !~ /^- Tables:/) exit; print}' | grep -oE '`[^`]+`' | tr -d '`' | sort -u
      fi
      # Look for table definitions in various formats
      grep -iE '(CREATE TABLE|`[a-z_]+`.*table|table.*`[a-z_]+`|^\|[[:space:]]*`?[a-z_]+`?[[:space:]]*\|.*schema|##.*tabela|##.*table|###.*data model|###.*modelo de dados)' "$file" 2>/dev/null | \
        grep -oE '`[a-z][a-z0-9_]*`' | tr -d '`' | sort -u || true
      awk '/^#{2,4}.*([Dd]ata [Mm]odel|[Ss]chema|[Tt]abel)/{found=1} found && /^#{2,4}/{if(NR>1)found=0} found && /^[|].*[|]/' "$file" 2>/dev/null | \
        grep -oE '`[a-z][a-z0-9_]*`' | tr -d '`' | sort -u || true
      ;;
    routes)
      if [[ -n "$index_block" ]]; then
        printf '%s\n' "$index_block" | awk '/^- Routes:/,/^- [A-Z]/{if ($0 ~ /^- [A-Z]/ && $0 !~ /^- Routes:/) exit; print}' | grep -oE '`[^`]+`' | tr -d '`' | sort -u
      fi
      grep -oE '(GET|POST|PUT|DELETE|PATCH)[[:space:]]+/[a-zA-Z0-9/_{}:.-]+' "$file" 2>/dev/null | sort -u || true
      ;;
    perms)
      if [[ -n "$index_block" ]]; then
        printf '%s\n' "$index_block" | awk '/^- Permissions:/,/^- [A-Z]/{if ($0 ~ /^- [A-Z]/ && $0 !~ /^- Permissions:/) exit; print}' | grep -oE '`[^`]+`' | tr -d '`' | sort -u
      fi
      grep -oE '[a-z_]+:[a-z_]+:[a-z_]+' "$file" 2>/dev/null | sort -u || true
      ;;
    events)
      if [[ -n "$index_block" ]]; then
        printf '%s\n' "$index_block" | awk '/^- Events:/,/^- [A-Z]/{if ($0 ~ /^- [A-Z]/ && $0 !~ /^- Events:/) exit; print}' | grep -oE '`[^`]+`' | tr -d '`' | sort -u
      fi
      grep -oE '[a-z_]+\.[a-z_]+(_[a-z_]+)*' "$file" 2>/dev/null | \
        grep -vE '(e\.g|i\.e|vs\.|etc\.|doc\.|md\.|sh\.)' | sort -u || true
      ;;
    providers)
      if [[ -n "$index_block" ]]; then
        printf '%s\n' "$index_block" | awk '/^- Providers:/,/^- [A-Z]/{if ($0 ~ /^- [A-Z]/ && $0 !~ /^- Providers:/) exit; print}' | grep -oE '`[^`]+`' | tr -d '`' | sort -u
      fi
      grep -iE '(provider|integration|capability)[[:space:]]*:?[[:space:]]' "$file" 2>/dev/null | \
        grep -oE '`[a-zA-Z][a-zA-Z0-9_-]*`' | tr -d '`' | sort -u || true
      ;;
  esac
}

# Emit a single hit JSON object
emit_hit() {
  local id=$1 kind=$2 owner=$3 source=$4 status=$5 severity=$6
  printf '{"id":"%s","kind":"%s","owner":"%s","source":"%s","status":"%s","severity":"%s"}' \
    "$(json_escape "$id")" \
    "$(json_escape "$kind")" \
    "$(json_escape "$owner")" \
    "$(json_escape "$source")" \
    "$(json_escape "$status")" \
    "$(json_escape "$severity")"
}

# ─── Mode: similarity ──────────────────────────────────────────────

mode_similarity() {
  local slug="" module=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --slug) slug=$2; shift 2 ;;
      --module) module=$2; shift 2 ;;
      *) err "unknown arg: $1"; exit 2 ;;
    esac
  done

  [[ -z "$slug" ]] && { err "similarity requires --slug"; exit 2; }
  [[ -z "$module" ]] && { err "similarity requires --module"; exit 2; }

  resolve_specs_dir

  local hits="" hit_count=0 exit_code=0

  # Check for exact slug match in spec filenames and directory names
  while IFS= read -r spec_file; do
    [[ -z "$spec_file" ]] && continue
    local basename_no_ext
    basename_no_ext=$(basename "$spec_file" .md)
    local dir_module
    dir_module=$(module_from_path "$spec_file")

    # Exact match on filename
    if [[ "$basename_no_ext" == "$slug" ]]; then
      local status
      status=$(spec_status "$spec_file")
      local hit
      hit=$(emit_hit "$slug" "slug-exact" "$dir_module" "$spec_file" "$status" "hard_block")
      if [[ -n "$hits" ]]; then hits="$hits,$hit"; else hits="$hit"; fi
      hit_count=$((hit_count + 1))
      exit_code=1
    fi

    # Exact match on directory/module name (but not also filename match — avoid dupes)
    if [[ "$dir_module" == "$slug" && "$basename_no_ext" != "$slug" ]]; then
      local status
      status=$(spec_status "$spec_file")
      local hit
      hit=$(emit_hit "$slug" "slug-exact" "$dir_module" "$spec_file" "$status" "hard_block")
      if [[ -n "$hits" ]]; then hits="$hits,$hit"; else hits="$hit"; fi
      hit_count=$((hit_count + 1))
      exit_code=1
    fi
  done < <(find_spec_files)

  # Near-match: slug is a substring of filenames/dirs (only if no exact match)
  if [[ $hit_count -eq 0 ]]; then
    while IFS= read -r spec_file; do
      [[ -z "$spec_file" ]] && continue
      local basename_no_ext
      basename_no_ext=$(basename "$spec_file" .md)
      local dir_module
      dir_module=$(module_from_path "$spec_file")
      local lower_base lower_dir lower_slug
      lower_base=$(to_lower "$basename_no_ext")
      lower_dir=$(to_lower "$dir_module")
      lower_slug=$(to_lower "$slug")

      if [[ "$lower_base" == *"$lower_slug"* || "$lower_slug" == *"$lower_base"* || \
            "$lower_dir" == *"$lower_slug"* || "$lower_slug" == *"$lower_dir"* ]]; then
        local status
        status=$(spec_status "$spec_file")
        local hit
        hit=$(emit_hit "$slug" "slug-near" "$dir_module" "$spec_file" "$status" "warning")
        if [[ -n "$hits" ]]; then hits="$hits,$hit"; else hits="$hit"; fi
        hit_count=$((hit_count + 1))
        [[ $hit_count -ge 5 ]] && break
      fi
    done < <(find_spec_files)
  fi

  printf '{"mode":"similarity","slug":"%s","module":"%s","hit_count":%d,"hits":[%s],"exit":%d}\n' \
    "$(json_escape "$slug")" "$(json_escape "$module")" "$hit_count" "$hits" "$exit_code"
  exit "$exit_code"
}

# ─── Core: collision scan (used by collision modes and all mode) ────

# Runs collision check and prints JSON to stdout.
# Does NOT call exit — caller handles that.
# Usage: run_collision <mode> <input_csv> [exclude_module]
run_collision() {
  local mode=$1
  local input_csv=$2
  local exclude_module=${3:-}

  # Parse input items into newline-separated list
  local input_items=""
  local input_count=0
  local old_ifs="$IFS"
  IFS=','
  for raw in $input_csv; do
    IFS="$old_ifs"
    local trimmed
    trimmed=$(trim "$raw")
    if [[ -n "$trimmed" ]]; then
      if [[ -n "$input_items" ]]; then
        input_items="$input_items"$'\n'"$trimmed"
      else
        input_items="$trimmed"
      fi
      input_count=$((input_count + 1))
    fi
  done
  IFS="$old_ifs"

  local hits="" hit_count=0 result_exit=0
  # Track matched items as newline-delimited string
  local matched_items=""

  while IFS= read -r spec_file; do
    [[ -z "$spec_file" ]] && continue
    local spec_module
    spec_module=$(module_from_path "$spec_file")

    # Skip self-module if excluding
    if [[ -n "$exclude_module" && "$spec_module" == "$exclude_module" ]]; then
      continue
    fi

    # Extract identifiers from this spec
    local spec_ids
    spec_ids=$(extract_from_spec "$spec_file" "$mode")
    [[ -z "$spec_ids" ]] && continue

    # Check each input item against this spec's identifiers
    while IFS= read -r item; do
      [[ -z "$item" ]] && continue
      # Skip if already matched
      if printf '%s\n' "$matched_items" | grep -qxF "$item" 2>/dev/null; then
        continue
      fi

      local lower_item
      lower_item=$(to_lower "$item")

      while IFS= read -r sid; do
        [[ -z "$sid" ]] && continue
        local lower_sid
        lower_sid=$(to_lower "$sid")

        if [[ "$lower_item" == "$lower_sid" ]]; then
          local status
          status=$(spec_status "$spec_file")
          local severity="hard_block"
          [[ "$mode" == "providers" ]] && severity="warning"

          local hit
          hit=$(emit_hit "$item" "$mode" "$spec_module" "$spec_file" "$status" "$severity")
          if [[ -n "$hits" ]]; then hits="$hits,$hit"; else hits="$hit"; fi
          hit_count=$((hit_count + 1))

          if [[ -n "$matched_items" ]]; then
            matched_items="$matched_items"$'\n'"$item"
          else
            matched_items="$item"
          fi

          [[ "$severity" == "hard_block" ]] && result_exit=1
          break
        fi
      done <<< "$spec_ids"
    done <<< "$input_items"
  done < <(find_spec_files)

  printf '{"mode":"%s","input_count":%d,"hit_count":%d,"hits":[%s],"exit":%d}' \
    "$mode" "$input_count" "$hit_count" "$hits" "$result_exit"
}

# ─── Mode: collision (tables, routes, perms, events, providers) ────

mode_collision() {
  local mode=$1
  shift

  local input_csv=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --input) input_csv=$2; shift 2 ;;
      --exclude) shift 2 ;;  # consumed but not used in direct mode
      *) err "unknown arg: $1"; exit 2 ;;
    esac
  done

  [[ -z "$input_csv" ]] && { err "$mode requires --input"; exit 2; }

  resolve_specs_dir

  local output
  output=$(run_collision "$mode" "$input_csv")

  printf '%s\n' "$output"

  # Extract exit code from output
  local exit_code
  exit_code=$(printf '%s' "$output" | grep -oE '"exit":[0-9]+' | tail -1 | grep -oE '[0-9]+' || echo "0")
  exit "$exit_code"
}

# ─── Mode: refs ─────────────────────────────────────────────────────

mode_refs() {
  local target="" from=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --target) target=$2; shift 2 ;;
      --from) from=$2; shift 2 ;;
      *) err "unknown arg: $1"; exit 2 ;;
    esac
  done

  [[ -z "$target" ]] && { err "refs requires --target"; exit 2; }
  [[ -z "$from" ]] && { err "refs requires --from"; exit 2; }

  resolve_specs_dir

  local declared=0

  while IFS= read -r spec_file; do
    [[ -z "$spec_file" ]] && continue
    local spec_module
    spec_module=$(module_from_path "$spec_file")

    if [[ "$spec_module" == "$from" ]]; then
      if grep -qiE "(^|[^a-z])${target}([^a-z]|$)" "$spec_file" 2>/dev/null; then
        declared=1
        break
      fi
    fi
  done < <(find_spec_files)

  printf '{"mode":"refs","from":"%s","target":"%s","declared":%d,"exit":0}\n' \
    "$(json_escape "$from")" "$(json_escape "$target")" "$declared"
  exit 0
}

# ─── Mode: files ────────────────────────────────────────────────────

mode_files() {
  local input_csv=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --input) input_csv=$2; shift 2 ;;
      *) err "unknown arg: $1"; exit 2 ;;
    esac
  done

  resolve_plans_dir

  local input_items="" input_count=0
  if [[ -n "$input_csv" ]]; then
    local old_ifs="$IFS"
    IFS=','
    for item in $input_csv; do
      IFS="$old_ifs"
      local trimmed
      trimmed=$(trim "$item")
      if [[ -n "$trimmed" ]]; then
        if [[ -n "$input_items" ]]; then
          input_items="$input_items"$'\n'"$trimmed"
        else
          input_items="$trimmed"
        fi
        input_count=$((input_count + 1))
      fi
    done
    IFS="$old_ifs"
  fi

  local hits="" hit_count=0 exit_code=0

  while IFS= read -r plan_file; do
    [[ -z "$plan_file" ]] && continue

    local status
    status=$(spec_status "$plan_file")

    local severity="warning"
    case "$status" in
      in_execution|active)
        severity="hard_block"
        ;;
      approved|draft)
        severity="warning"
        ;;
      *)
        continue
        ;;
    esac

    local ownership_paths=""
    ownership_paths=$(awk '
      /^##[[:space:]]+State Scan Ownership Index/ { in_block=1; next }
      in_block && /^##[[:space:]]+/ { exit }
      in_block { print }
    ' "$plan_file" 2>/dev/null | grep -oE '`[^`]+`' | tr -d '`' || true)

    [[ -z "$ownership_paths" ]] && continue

    while IFS= read -r item; do
      [[ -z "$item" ]] && continue
      while IFS= read -r owned; do
        [[ -z "$owned" ]] && continue
        if [[ "$(to_lower "$item")" == "$(to_lower "$owned")" ]]; then
          local owner
          owner=$(module_from_path "$plan_file")
          local hit
          hit=$(emit_hit "$item" "files" "$owner" "$plan_file" "$status" "$severity")
          if [[ -n "$hits" ]]; then hits="$hits,$hit"; else hits="$hit"; fi
          hit_count=$((hit_count + 1))
          [[ "$severity" == "hard_block" ]] && exit_code=1
          break
        fi
      done <<< "$ownership_paths"
    done <<< "$input_items"
  done < <(find_plan_files)

  printf '{"mode":"files","input_count":%d,"hit_count":%d,"hits":[%s],"exit":%d}\n' \
    "$input_count" "$hit_count" "$hits" "$exit_code"
  exit "$exit_code"
}

# ─── Mode: drift ────────────────────────────────────────────────────

mode_drift() {
  local module=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --module) module=$2; shift 2 ;;
      *) err "unknown arg: $1"; exit 2 ;;
    esac
  done

  [[ -z "$module" ]] && { err "drift requires --module"; exit 2; }

  resolve_specs_dir

  # Collect table names from spec (newline-separated)
  local spec_tables=""
  while IFS= read -r spec_file; do
    [[ -z "$spec_file" ]] && continue
    local spec_module
    spec_module=$(module_from_path "$spec_file")
    if [[ "$spec_module" == "$module" ]]; then
      local extracted
      extracted=$(extract_from_spec "$spec_file" "tables")
      if [[ -n "$extracted" ]]; then
        if [[ -n "$spec_tables" ]]; then
          spec_tables="$spec_tables"$'\n'"$extracted"
        else
          spec_tables="$extracted"
        fi
      fi
    fi
  done < <(find_spec_files)

  # Try to find code tables by grepping common patterns in source files
  local code_tables=""
  local src_dir=""

  for candidate in "src" "app" "lib" "packages" "apps"; do
    if [[ -d "$PROJECT_ROOT/$candidate" ]]; then
      src_dir="$PROJECT_ROOT/$candidate"
      break
    fi
  done

  if [[ -n "$src_dir" ]]; then
    code_tables=$(
      grep -rhoE "(pgTable|mysqlTable|sqliteTable|createTable|TABLE|@Entity)\([[:space:]]*['\"][a-z][a-z0-9_]*['\"]" "$src_dir" 2>/dev/null | \
        grep -oE "['\"][a-z][a-z0-9_]*['\"]" | tr -d "'" | tr -d '"' | sort -u || true
    )
  fi

  # Compute drift
  local in_code_not_spec="" in_spec_not_code=""

  if [[ -n "$code_tables" ]]; then
    while IFS= read -r ct; do
      [[ -z "$ct" ]] && continue
      local found=""
      if [[ -n "$spec_tables" ]]; then
        found=$(printf '%s\n' "$spec_tables" | while IFS= read -r st; do
          [[ "$(to_lower "$ct")" == "$(to_lower "$st")" ]] && echo "yes" && break
        done)
      fi
      if [[ -z "$found" ]]; then
        if [[ -n "$in_code_not_spec" ]]; then
          in_code_not_spec="$in_code_not_spec,\"$(json_escape "$ct")\""
        else
          in_code_not_spec="\"$(json_escape "$ct")\""
        fi
      fi
    done <<< "$code_tables"
  fi

  if [[ -n "$spec_tables" ]]; then
    while IFS= read -r st; do
      [[ -z "$st" ]] && continue
      local found=""
      if [[ -n "$code_tables" ]]; then
        found=$(printf '%s\n' "$code_tables" | while IFS= read -r ct; do
          [[ "$(to_lower "$st")" == "$(to_lower "$ct")" ]] && echo "yes" && break
        done)
      fi
      if [[ -z "$found" ]]; then
        if [[ -n "$in_spec_not_code" ]]; then
          in_spec_not_code="$in_spec_not_code,\"$(json_escape "$st")\""
        else
          in_spec_not_code="\"$(json_escape "$st")\""
        fi
      fi
    done <<< "$spec_tables"
  fi

  printf '{"mode":"drift","module":"%s","in_code_not_spec":[%s],"in_spec_not_code":[%s],"exit":0}\n' \
    "$(json_escape "$module")" "$in_code_not_spec" "$in_spec_not_code"
  exit 0
}

# ─── Mode: all ──────────────────────────────────────────────────────

mode_all() {
  local spec_file=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --spec-file) spec_file=$2; shift 2 ;;
      *) err "unknown arg: $1"; exit 2 ;;
    esac
  done

  [[ -z "$spec_file" ]] && { err "all requires --spec-file"; exit 2; }
  [[ ! -f "$spec_file" ]] && { err "spec file not found: $spec_file"; exit 2; }

  # Normalize to absolute path so module_from_path works correctly
  if [[ "$spec_file" != /* ]]; then
    spec_file="$(cd "$(dirname "$spec_file")" && pwd)/$(basename "$spec_file")"
  fi

  resolve_specs_dir

  # Determine module from spec file path
  local module
  module=$(module_from_path "$spec_file")

  # Extract identifiers from the target spec
  local tables_csv routes_csv perms_csv events_csv providers_csv
  tables_csv=$(extract_from_spec "$spec_file" "tables" | paste -sd, - 2>/dev/null || true)
  routes_csv=$(extract_from_spec "$spec_file" "routes" | paste -sd, - 2>/dev/null || true)
  perms_csv=$(extract_from_spec "$spec_file" "perms" | paste -sd, - 2>/dev/null || true)
  events_csv=$(extract_from_spec "$spec_file" "events" | paste -sd, - 2>/dev/null || true)
  providers_csv=$(extract_from_spec "$spec_file" "providers" | paste -sd, - 2>/dev/null || true)

  local checks="" aggregate_hits="" aggregate_hit_count=0 aggregate_exit=0

  for mode_name in tables routes perms events providers; do
    local csv=""
    case "$mode_name" in
      tables) csv=$tables_csv ;;
      routes) csv=$routes_csv ;;
      perms) csv=$perms_csv ;;
      events) csv=$events_csv ;;
      providers) csv=$providers_csv ;;
    esac

    local output output_exit

    if [[ -z "$csv" ]]; then
      output=$(printf '{"mode":"%s","input_count":0,"hit_count":0,"hits":[],"exit":0}' "$mode_name")
      output_exit=0
    else
      output=$(run_collision "$mode_name" "$csv" "$module")
      output_exit=$(printf '%s' "$output" | grep -oE '"exit":[0-9]+' | tail -1 | grep -oE '[0-9]+' || echo "0")
    fi

    # Downgrade provider hard_blocks to warnings in all mode
    if [[ "$mode_name" == "providers" && "$output_exit" == "1" ]]; then
      output=$(printf '%s' "$output" | sed 's/"severity":"hard_block"/"severity":"warning"/g; s/"exit":1/"exit":0/')
      output_exit=0
    fi

    # Strip outer braces for embedding
    local inner
    inner="${output#\{}"
    inner="${inner%\}}"

    if [[ -n "$checks" ]]; then checks="$checks,"; fi
    checks="$checks\"$mode_name\":{$inner}"

    # Extract hit count for aggregation
    local sub_hit_count
    sub_hit_count=$(printf '%s' "$output" | grep -oE '"hit_count":[0-9]+' | head -1 | grep -oE '[0-9]+' || echo "0")
    aggregate_hit_count=$((aggregate_hit_count + sub_hit_count))

    # Extract hits array content for aggregation
    local hits_content
    hits_content=$(printf '%s' "$output" | sed 's/.*"hits":\[//; s/\].*$//')
    if [[ -n "$hits_content" ]]; then
      if [[ -n "$aggregate_hits" ]]; then
        aggregate_hits="$aggregate_hits,$hits_content"
      else
        aggregate_hits="$hits_content"
      fi
    fi

    if [[ "$output_exit" == "1" ]]; then
      aggregate_exit=1
    fi
  done

  printf '{"mode":"all","spec_file":"%s","module":"%s","self_excluded":true,"checks":{%s},"hit_count":%d,"hits":[%s],"exit":%d}\n' \
    "$(json_escape "$spec_file")" \
    "$(json_escape "$module")" \
    "$checks" \
    "$aggregate_hit_count" \
    "$aggregate_hits" \
    "$aggregate_exit"
  exit "$aggregate_exit"
}

# ─── Mode: refresh-if-stale ────────────────────────────────────────

mode_refresh() {
  printf '{"mode":"refresh-if-stale","status":"ok","note":"generic scanner has no index to refresh","exit":0}\n'
  exit 0
}

# ─── Dispatcher ─────────────────────────────────────────────────────

if [[ $# -lt 1 ]]; then
  err "usage: bash generic-scanner.sh <mode> [args...]"
  err "modes: similarity tables routes perms events providers refs files drift all refresh-if-stale"
  exit 2
fi

MODE=$1
shift

case "$MODE" in
  similarity)               mode_similarity "$@" ;;
  tables|routes|perms|events|providers)
                            mode_collision "$MODE" "$@" ;;
  refs)                     mode_refs "$@" ;;
  files)                    mode_files "$@" ;;
  drift)                    mode_drift "$@" ;;
  all)                      mode_all "$@" ;;
  refresh-if-stale)         mode_refresh ;;
  *)
    err "unknown mode: $MODE"
    err "modes: similarity tables routes perms events providers refs files drift all refresh-if-stale"
    exit 2
    ;;
esac
