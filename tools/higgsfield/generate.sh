#!/usr/bin/env bash
# Generates stills one process at a time, hard-killing any request that hangs.
#   tools/higgsfield/generate.sh hero how      (names from images.ts)
# Higgsfield requests can hang forever and the SDK's own timeout does not always
# fire, so each attempt gets 6 minutes and up to 3 tries.
set -uo pipefail
cd "$(dirname "$0")"
LIMIT=${LIMIT:-360}
for name in "$@"; do
  ok=0
  for attempt in 1 2 3; do
    echo "$name: attempt $attempt"
    bun run images.ts "$name" & pid=$!
    for ((t = 0; t < LIMIT; t += 5)); do kill -0 "$pid" 2>/dev/null || break; sleep 5; done
    if kill -0 "$pid" 2>/dev/null; then
      echo "$name: hung after ${LIMIT}s, killing"; kill -9 "$pid" 2>/dev/null; wait "$pid" 2>/dev/null
      continue
    fi
    if wait "$pid"; then ok=1; break; fi
  done
  [ $ok = 1 ] || echo "$name: FAILED after 3 attempts"
done
