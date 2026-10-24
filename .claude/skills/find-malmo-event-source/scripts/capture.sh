#!/usr/bin/env bash
# Records the requests a page makes while it loads, with OpenWeb's capture
# and an empty Chrome profile (public data only, what a server would see).
# Prints the data-looking requests; the full HAR is in <out-dir>/capture/.
#
# Usage: capture.sh <page-url> <out-dir> [seconds-to-wait, default 20]
set -euo pipefail

url=${1:?usage: capture.sh <page-url> <out-dir> [seconds]}
out=${2:?usage: capture.sh <page-url> <out-dir> [seconds]}
secs=${3:-20}

case "$url" in https://* | http://*) ;; *) echo "URL must start with http(s)://" >&2; exit 2 ;; esac
command -v openweb >/dev/null || { echo "openweb CLI missing: npm install -g @openweb-org/openweb" >&2; exit 3; }
command -v jq >/dev/null || { echo "jq missing" >&2; exit 3; }

mkdir -p "$out"
out=$(cd "$out" && pwd)
home="$out/.openweb-home"
profile="$out/.chrome-profile/Default"
mkdir -p "$home" "$profile"
# Never the user's own Chrome profile: capture would copy its cookies.
printf '{"browser":{"profile":"%s","headless":true}}\n' "$profile" >"$home/config.json"
export OPENWEB_HOME="$home"

cleanup() {
  openweb capture stop >/dev/null 2>&1 || true
  openweb browser stop >/dev/null 2>&1 || true
}
trap cleanup EXIT

rm -rf "$out/capture"
openweb browser start >/dev/null 2>&1
openweb capture start --cdp-endpoint http://127.0.0.1:9222 --output "$out/capture" >"$out/capture.log" 2>&1 &
sleep 4
# Open the page only once capture is attached; `capture start --isolate`
# attaches after the load and misses exactly the requests we want.
curl -fsS -X PUT "http://127.0.0.1:9222/json/new?$url" >/dev/null
sleep "$secs"
openweb capture stop >/dev/null 2>&1 || true
sleep 2

har="$out/capture/traffic.har"
[ -s "$har" ] || { echo "No traffic recorded; see $out/capture.log" >&2; exit 4; }

echo "requests recorded: $(jq '.entries | length' "$har")"
echo "data-looking requests (method status type bytes url):"
jq -r '
  .entries[]
  | select(.request.method != "OPTIONS")
  | (.response.content.mimeType // "") as $type
  | select($type | startswith("image/") | not)
  | select(($type | test("json|xml|rss|calendar|text/plain")) or (.request.url | test("/api/|graphql|wp-json|/feed|ical|\\.ics|\\.json|_next/data")))
  | select(.request.url | test("google-analytics|googletagmanager|doubleclick|facebook|hotjar|sentry|segment|cookiebot|consent|insights|clarity|vimeo|youtube") | not)
  | [.request.method, (.response.status | tostring), $type, ((.response.content.size // 0) | tostring), .request.url[0:220]]
  | @tsv' "$har" | sort -u | tee "$out/requests.tsv"
