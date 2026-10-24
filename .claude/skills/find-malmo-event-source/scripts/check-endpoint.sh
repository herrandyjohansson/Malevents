#!/usr/bin/env bash
# Can a server read this URL? One plain GET with the MÖEVENTS user agent,
# no cookies and no browser, as the Vercel functions would make it.
# Also prints the site's robots.txt rules for all user agents.
#
# Usage: check-endpoint.sh <url>
set -euo pipefail

url=${1:?usage: check-endpoint.sh <url>}
case "$url" in https://* | http://*) ;; *) echo "URL must start with http(s)://" >&2; exit 2 ;; esac

UA="MaleventsBot/1.0 (+https://github.com/herrandyjohansson/Malevents)"
body=$(mktemp)
trap 'rm -f "$body"' EXIT

curl -sS -L --max-time 15 -A "$UA" -H "Accept: application/json, text/html;q=0.9, */*;q=0.8" \
  -o "$body" -w "status=%{http_code} type=%{content_type} bytes=%{size_download} time=%{time_total}s\n" -- "$url"

if jq -e . "$body" >/dev/null 2>&1; then
  jq -c 'if type == "array" then {array: length, keys: (.[0] | if type == "object" then keys else type end)}
         else {object: keys} end' "$body"
else
  echo "not JSON; first bytes:"
  head -c 300 "$body" | tr '\n' ' '
  echo
fi

origin=$(printf '%s' "$url" | sed -E 's#^(https?://[^/]+).*#\1#')
echo "robots.txt rules for User-agent: * at $origin:"
curl -sS --max-time 10 -A "$UA" -- "$origin/robots.txt" |
  awk 'tolower($1) == "user-agent:" { star = ($2 == "*") } star && tolower($1) ~ /^(dis)?allow:/' | head -20 || true
