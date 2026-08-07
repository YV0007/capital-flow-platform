#!/usr/bin/env python3
"""Download a real logo / founder photo for each Capital Flow entity into
public/logos/, and write src/data/logoManifest.json mapping node id -> path.

Runtime logo services (Clearbit/unavatar) are flaky and DNS-blocked in some
browsers, so we fetch once here (curl-style, server-side) and ship the files.
Re-run whenever entityReference.json gains new entities.

RESOLUTION MATTERS. Node tiles render up to ~90 CSS px on a retina canvas, so
a 16px favicon turns to mush. We therefore fetch EVERY candidate and keep the
sharpest one, rather than the first that answers:
  · the site's own <link rel=icon/apple-touch-icon> — SVG or 180px+ usually
  · unavatar / Google s2 at the largest size they'll serve
  · an X avatar for individuals
SVG always wins; among rasters the largest min(w,h) wins.
"""
import json, os, re, subprocess, tempfile, urllib.request, urllib.error
from html.parser import HTMLParser
from urllib.parse import urlparse, urljoin

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF = os.path.join(ROOT, "src/data/entityReference.json")
OUT_DIR = os.path.join(ROOT, "public/logos")
MANIFEST = os.path.join(ROOT, "src/data/logoManifest.json")
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36"
EXT = {"image/png": ".png", "image/jpeg": ".jpg", "image/jpg": ".jpg",
       "image/svg+xml": ".svg", "image/x-icon": ".ico",
       "image/vnd.microsoft.icon": ".ico", "image/webp": ".webp", "image/gif": ".gif"}
MIN_ACCEPTABLE = 96          # below this we keep looking but still accept as last resort
TIMEOUT = 10


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


class IconParser(HTMLParser):
    """Collect <link rel=...icon...> hrefs + their declared sizes."""
    def __init__(self):
        super().__init__()
        self.icons = []          # (href, size_hint)

    def handle_starttag(self, tag, attrs):
        if tag != "link":
            return
        a = dict(attrs)
        rel = (a.get("rel") or "").lower()
        if "icon" not in rel:
            return
        href = a.get("href")
        if not href:
            return
        sizes = (a.get("sizes") or "").lower()
        m = re.match(r"(\d+)x(\d+)", sizes)
        hint = int(m.group(1)) if m else (9999 if href.lower().endswith(".svg") else 0)
        if "apple-touch" in rel and not hint:
            hint = 180           # the de-facto apple-touch size
        self.icons.append((href, hint))


def site_icons(domain):
    """Icons declared by the site itself — the sharpest source when it exists."""
    for scheme in ("https://", "https://www."):
        try:
            req = urllib.request.Request(scheme + domain, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
                base = r.geturl()
                html = r.read(400_000).decode("utf-8", "ignore")
        except Exception:
            continue
        p = IconParser()
        try:
            p.feed(html)
        except Exception:
            pass
        icons = sorted(p.icons, key=lambda t: -t[1])
        return [urljoin(base, h) for h, _ in icons[:4]]
    return []


def candidates(links):
    out, seen = [], []
    def add(u):
        if u and u not in seen:
            seen.append(u); out.append(u)

    web = next((l for l in links if l.get("kind") == "website"), None)
    xl = next((l for l in links if l.get("kind") == "x"), None)
    firm = next((l for l in links if l.get("kind") == "firm"), None)
    wd = domain_of(web["url"]) if web else None
    fd = domain_of(firm["url"]) if firm else None
    h = x_handle(xl["url"]) if xl else None

    for d in (wd, fd):
        if d:
            for u in site_icons(d):
                add(u)
    if h:
        add(f"https://unavatar.io/x/{h}?fallback=false")
    for d in (wd, fd):
        if d:
            add(f"https://unavatar.io/{d}?fallback=false")
            add(f"https://icon.horse/icon/{d}")
            add(f"https://www.google.com/s2/favicons?sz=256&domain={d}")
    return out


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        ct = (r.headers.get("Content-Type") or "").split(";")[0].strip().lower()
        data = r.read()
    if len(data) < 200:
        return None
    if not ct.startswith("image/"):
        # some CDNs serve SVG as text/plain or octet-stream
        if data[:200].lstrip().startswith(b"<svg") or b"<svg" in data[:400]:
            ct = "image/svg+xml"
        else:
            return None
    return ct, data


def measure(ct, data):
    """Sharpness score: SVG is resolution-free, rasters score on min(w,h)."""
    if ct == "image/svg+xml":
        return 10_000
    with tempfile.NamedTemporaryFile(suffix=EXT.get(ct, ".png"), delete=False) as f:
        f.write(data); path = f.name
    try:
        out = subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", path],
                             capture_output=True, text=True, timeout=15).stdout
        nums = [int(x) for x in re.findall(r"pixel(?:Width|Height):\s*(\d+)", out)]
        return min(nums) if len(nums) == 2 else 0
    except Exception:
        return 0
    finally:
        os.unlink(path)


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
        best = None                     # (score, ct, data, url)
        for url in candidates(links):
            try:
                res = fetch(url)
            except Exception:
                res = None
            if not res:
                continue
            ct, data = res
            score = measure(ct, data)
            if best is None or score > best[0]:
                best = (score, ct, data, url)
            if score >= 512:            # plenty sharp — stop paying for more
                break
        if best:
            score, ct, data, url = best
            # drop any stale file for this entity under a different extension
            for f in os.listdir(OUT_DIR):
                if os.path.splitext(f)[0] == safe:
                    os.unlink(os.path.join(OUT_DIR, f))
            fname = safe + EXT.get(ct, ".png")
            with open(os.path.join(OUT_DIR, fname), "wb") as f:
                f.write(data)
            manifest[node_id] = f"/logos/{fname}"
            ok += 1
            flag = " LOW-RES" if score < MIN_ACCEPTABLE else ""
            label = "vector" if score == 10_000 else f"{score}px"
            print(f"  ok   {node_id:52s} {label:>7s}{flag}  <- {url[:58]}")
        else:
            miss += 1
            print(f"  MISS {node_id:52s} (monogram)")
    json.dump(manifest, open(MANIFEST, "w"), indent=2, ensure_ascii=False)
    print(f"\n{ok} logos saved, {miss} missing -> src/data/logoManifest.json")


if __name__ == "__main__":
    main()
