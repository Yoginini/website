#!/usr/bin/env bash
# Turns a raw still from out/ into the files the site serves:
#   assets/img/<name>-<width>.webp and .jpg at each width.
#   tools/higgsfield/optimise.sh <name> [crop]
# crop is an optional ImageMagick geometry (WxH+X+Y) applied first, for trimming
# film-frame borders or edge artefacts the model sometimes paints in.
# GRADE="<magick ops>" applies a colour adjustment after the crop, to pull a
# still onto the same warm grade as the rest of the set.
# Widths: the hero gets 640/1280/1920, everything else 480/800/1200.
set -euo pipefail
cd "$(dirname "$0")"
name="$1"; crop="${2:-}"
src=$(ls out/"$name".* | head -1)
dest=../../assets/img; mkdir -p "$dest"
if [ "$name" = hero ]; then widths="640 1280 1920"; else widths="480 800 1200"; fi
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
magick "$src" -auto-orient ${crop:+-crop "$crop" +repage} ${GRADE:-} -strip -colorspace sRGB "$tmp/base.png"
for w in $widths; do
  magick "$tmp/base.png" -resize "${w}x" -filter Lanczos "$tmp/$w.png"
  magick "$tmp/$w.png" -quality 74 -define webp:method=6 "$dest/$name-$w.webp"
  magick "$tmp/$w.png" -quality 80 -sampling-factor 4:2:0 -interlace JPEG "$dest/$name-$w.jpg"
done
for f in "$dest/$name"-*; do
  printf '%-28s %5s KB  %s\n' "$(basename "$f")" "$(( $(stat -f%z "$f") / 1024 ))" "$(magick identify -format '%wx%h' "$f")"
done
