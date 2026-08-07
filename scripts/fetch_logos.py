#!/usr/bin/env python3
"""Download a real logo / founder photo for each Capital Flow entity into
public/logos/, and write src/data/logoManifest.json mapping node id -> path.

Runtime logo services (Clearbit/unavatar) are flaky and DNS-blocked in some
browsers, so we fetch once here (curl-style, server-side) and ship the files.
Re-run whenever entityReference.json gains new entities.
"""
import json, os, re, urllib.request, urllib.error
from urllib.parse import urlparse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF = os.path.join(ROOT, "src/data/entityReference.json")
OUT_DIR = os.path.join(ROOT, "public/logos")
MANIFEST = os.path.join(ROOT, "src/data/logoManifest.json")
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36"
EXT = {"image/png": ".png", "image/jpeg": ".jpg", "image/jpg": ".jpg",
       "image/svg+xml": ".svg", "image/x-icon": ".ico",
       "image/vnd.microsoft.icon": ".ico", "image/webp": ".webp", "image/gif": ".gif"}


def domain_of(url):
    try:
        h = urlparse(url).hostname or ""
        return h[4:] if h.startswith("www.") else h
    except Exception:
        return None


def x_handle(url):
    try:
        return (urlparse(url).path or "").strip("/").split("/")[0] or None
    except Exception:
        return None


def candidates(links):
    out, seen = [], set()
    def add(u):
        if u and u not in seen:
            seen.add(u); out.append(u)
    web = next((l for l in links if l.get("kind") == "website"), None)
    xl = next((l for l in links if l.get("kind") == "x"), None)
    firm = next((l for l in links if l.get("kind") == "firm"), None)
    wd = domain_of(web["url"]) if web else None
    if wd:
        add(f"https://unavatar.io/{wd}?fallback=false")
    h = x_handle(xl["url"]) if xl else None
    if h:
        add(f"https://unavatar.io/x/{h}?fallback=false")
    fd = domain_of(firm["url"]) if firm else None
    if fd:
        add(f"https://unavatar.io/{fd}?fallback=false")
    if wd:
        add(f"https://www.google.com/s2/favicons?sz=128&domain={wd}")
    if fd:
        add(f"https://www.google.com/s2/favicons?sz=128&domain={fd}")
    return out


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=20) as r:
        ct = (r.headers.get("Content-Type") or "").split(";")[0].strip().lower()
        data = r.read()
    if not ct.startswith("image/") or len(data) < 300:
        return None
    return ct, data


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    ref = json.load(open(REF))
    manifest = {}
    ok = miss = 0
    for node_id, meta in ref.items():
        if node_id == "_note":
            continue
        links = meta.get("links") or []
        safe = re.sub(r"[^A-Za-z0-9]+", "_", node_id)
        got = None
        for url in candidates(links):
            try:
                res = fetch(url)
            except (urllib.error.URLError, urllib.error.HTTPError, Exception):
                res = None
            if res:
                ct, data = res
                ext = EXT.get(ct, ".png")
                fname = safe + ext
                with open(os.path.join(OUT_DIR, fname), "wb") as f:
                    f.write(data)
                manifest[node_id] = f"/logos/{fname}"
                got = url
                break
        if got:
            ok += 1
            print(f"  ok   {node_id:52s} <- {got[:60]}")
        else:
            miss += 1
            print(f"  MISS {node_id:52s} (monogram)")
    json.dump(manifest, open(MANIFEST, "w"), indent=2, ensure_ascii=False)
    print(f"\n{ok} logos saved, {miss} missing -> src/data/logoManifest.json")


if __name__ == "__main__":
    main()
