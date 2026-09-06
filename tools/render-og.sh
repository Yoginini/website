#!/usr/bin/env bash
# Regenerates every raster asset from tools/*.html and assets/favicon.svg using
# headless Chrome. ImageMagick cannot rasterize these correctly (CSS gradients,
# webfonts, SVG transforms), so Chrome does the work.
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

shoot() { # src w h out [scale]
  "$CHROME" --headless --disable-gpu --no-sandbox --hide-scrollbars \
    --force-device-scale-factor="${5:-1}" --window-size="$2,$3" \
    --virtual-time-budget=12000 --screenshot="$4" "file://$1" >/dev/null 2>&1
}

urlenc() { python3 -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.argv[1]))' "$1"; }

card() { # out title kicker sub
  shoot "$ROOT/tools/og-render.html?t=$(urlenc "$2")&k=$(urlenc "$3")&s=$(urlenc "$4")" \
    1200 630 "$ROOT/assets/$1"
}

# Default Open Graph card
shoot "$ROOT/tools/og-render.html" 1200 630 "$ROOT/assets/og.png"

# Per-page cards
card og-philosophy.png "Technology in service <em>of stillness.</em>" "PHILOSOPHY" \
  "Why everything is purple, and the seven rules that decide how the app behaves."
card og-community.png "Alone on your mat. <em>Never on your own.</em>" "COMMUNITY" \
  "Practise live with people in other cities. No leaderboards, friends only by default."
card og-coaches.png "Real teachers, <em>by the hour.</em>" "FOUNDING COHORT" \
  "Coaches set their own rate and keep 80%. We are recruiting the first of them."
card og-pricing.png "One plan. <em>Coaches priced by coaches.</em>" "PRICING" \
  "\$3 for 14 days, then \$15 a month. Live sessions are paid at the teacher's own rate."
card og-privacy.png "There is no video <em>to leak.</em>" "PRIVACY" \
  "Every frame is analysed on your phone and discarded. Only angles and scores leave it."

# README banner, rendered at 2x so it stays crisp on retina
shoot "$ROOT/tools/banner-render.html" 1280 400 "$ROOT/assets/readme-banner.png" 2

# Icon: Chrome ignores window widths under ~500px, so render at 512 and downscale.
cat > "$TMP/icon.html" <<HTML
<!DOCTYPE html><meta charset="utf-8">
<style>html,body{margin:0;background:#100D17;width:512px;height:512px}
svg{display:block;width:512px;height:512px}</style>
$(cat "$ROOT/assets/favicon.svg")
HTML
shoot "$TMP/icon.html" 512 512 "$TMP/icon512.png"
cp "$TMP/icon512.png" "$ROOT/assets/icon-512.png"
sips -z 180 180 "$TMP/icon512.png" --out "$ROOT/assets/apple-touch-icon.png" >/dev/null

for f in og.png og-philosophy.png og-community.png og-coaches.png og-pricing.png og-privacy.png readme-banner.png icon-512.png apple-touch-icon.png; do
  printf '%-24s %s\n' "$f" "$(sips -g pixelWidth -g pixelHeight "$ROOT/assets/$f" | tail -2 | tr -d ' \n')"
done
