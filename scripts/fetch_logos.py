#!/usr/bin/env python3
"""Find a real logo / founder photo for every Capital Flow entity.

    python3 scripts/fetch_logos.py              # only entities missing a logo (fast)
    python3 scripts/fetch_logos.py --all        # re-fetch everything, keep the sharpest
    python3 scripts/fetch_logos.py --dry-run    # report only, write nothing

Writes:
    public/logos/<slug>.<ext>       the image files (shipped, no runtime DNS)
    src/data/logoManifest.json      node id -> /logos/... path
    src/data/entityReference.json   auto-resolved websites folded back in

DRIVEN BY THE MAP, NOT THE REFERENCE FILE. The engine ships new entities every
cycle; most arrive with no curated link, so keying off entityReference.json (as
this script used to) meant they were never even attempted. We now walk
capitalMap.json's node list and, for anything without a known site, RESOLVE a
domain from the entity name and verify it before trusting it.

TWO RULES THAT KEEP THIS HONEST
  1. A guessed domain is only accepted when the page identifies itself as that
     entity — its <title> / og:site_name / description has to contain the name.
     Generic one-word names (Cathedral, Odyssey, Atoms) need a second signal:
     an industry keyword on the page. A wrong logo is worse than no logo.
  2. Everything auto-resolved is written back into entityReference.json marked
     `"auto_resolved": true`, so it is visible, auditable and correctable by
     hand. The next run leaves a hand-edited entry alone.

RESOLUTION MATTERS: node tiles render up to ~90 CSS px on a retina canvas, so a
16px favicon turns to mush. We fetch EVERY candidate and keep the sharpest —
SVG always wins; among rasters the largest min(w,h) wins.
"""
import json, os, re, subprocess, sys, tempfile, urllib.request, urllib.error
from html.parser import HTMLParser
from urllib.parse import urlparse, urljoin

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAP = os.path.join(ROOT, "src/data/capitalMap.json")
REF = os.path.join(ROOT, "src/data/entityReference.json")
# The ecosystem map is a SECOND map with its own entities and its own domain
# side-car. It used to be outside this script entirely, so 76 of its 107
# entities had no resolved domain and therefore no «Сайт» link in the panel —
# the side-car was a hand-written leftover from the NVIDIA pilot. Same walk,
# same verification, different store.
ECO_MAP = os.path.join(ROOT, "src/data/aiEcosystemNetwork.json")
ECO_DOMAINS = os.path.join(ROOT, "src/data/nvidiaEcosystemLogos.json")
OUT_DIR = os.path.join(ROOT, "public/logos")
MANIFEST = os.path.join(ROOT, "src/data/logoManifest.json")
MISSES = os.path.join(ROOT, "scripts/logo-misses.txt")   # a TODO list, not shipped

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36"
EXT = {"image/png": ".png", "image/jpeg": ".jpg", "image/jpg": ".jpg",
       "image/svg+xml": ".svg", "image/x-icon": ".ico",
       "image/vnd.microsoft.icon": ".ico", "image/webp": ".webp", "image/gif": ".gif"}
TIMEOUT = 10
LOW_RES = 96          # below this we flag it, but still ship it
GOOD_ENOUGH = 512     # stop probing once a candidate is this sharp

# Name suffixes that are corporate noise when guessing a domain.
SUFFIXES = {"ai", "labs", "lab", "inc", "corp", "co", "ltd", "llc", "holdings",
            "capital", "ventures", "partners", "group", "technologies", "tech",
            "systems", "energy", "atomics", "digital"}
# Legal-form noise stripped off the END of a name before guessing OR verifying.
# "Nebius Group N.V." has to become "Nebius" or we never try nebius.com — and we
# never match the site's own title either, since no page calls itself "N.V.".
LEGAL = {"nv", "bv", "ag", "sa", "as", "plc", "inc", "incorporated", "corp",
         "corporation", "co", "company", "ltd", "limited", "llc", "lp", "llp",
         "gmbh", "kk", "pte", "sarl", "n", "v", "group", "holdings", "holding"}
# A one-word generic name needs one of these on the page before we believe it.
INDUSTRY_WORDS = {"ai", "artificial intelligence", "machine learning", "compute",
                  "gpu", "data center", "datacenter", "startup", "platform",
                  "software", "model", "inference", "robot", "autonomy",
                  "defense", "cyber", "semiconductor", "chip", "silicon",
                  "energy", "reactor", "nuclear", "infrastructure", "venture",
                  "fund", "portfolio", "invest", "technology", "engineering"}
# Names too common to resolve by guess, whatever the page says.
NEVER_GUESS = {"prometheus", "monogram", "atoms", "flourish", "odyssey", "cathedral"}


# ── page inspection ────────────────────────────────────────────────────────
class PageParser(HTMLParser):
    """Collect icon links + the identity signals we verify a guess against."""
    def __init__(self):
        super().__init__()
        self.icons = []          # (href, size_hint)
        self.signals = []        # title / og:site_name / description text
        self._in_title = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "title":
            self._in_title = True
        elif tag == "meta":
            key = (a.get("property") or a.get("name") or "").lower()
            if key in ("og:site_name", "og:title", "description", "og:description",
                       "application-name", "apple-mobile-web-app-title"):
                self.signals.append(a.get("content") or "")
        elif tag == "link":
            rel = (a.get("rel") or "").lower()
            href = a.get("href")
            if "icon" not in rel or not href:
                return
            m = re.match(r"(\d+)x(\d+)", (a.get("sizes") or "").lower())
            hint = int(m.group(1)) if m else (9999 if href.lower().endswith(".svg") else 0)
            if "apple-touch" in rel and not hint:
                hint = 180
            self.icons.append((href, hint))

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False

    def handle_data(self, data):
        if self._in_title:
            self.signals.append(data)


def get_page(domain):
    """(base_url, PageParser) for a domain, or None."""
    for host in (domain, "www." + domain):
        try:
            req = urllib.request.Request("https://" + host, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
                base = r.geturl()
                html = r.read(400_000).decode("utf-8", "ignore")
        except Exception:
            continue
        p = PageParser()
        try:
            p.feed(html)
        except Exception:
            pass
        p.body_sample = html[:120_000].lower()
        return base, p
    return None


def norm(s):
    return re.sub(r"[^a-z0-9]+", "", (s or "").lower())


def has_word(blob, words):
    """Whole-word match. Substring matching is a trap: "ev" hits inside
    "development", "ai" inside "chair" — which is how lucid.ai once passed as
    Lucid Group, the EV maker."""
    return any(re.search(r"\b" + re.escape(w) + r"\b", blob) for w in words)


def core_words(name):
    """Entity name with legal-form noise trimmed off the end."""
    words = [w.lower() for w in re.findall(r"[A-Za-z0-9]+", name)]
    while len(words) > 1 and words[-1] in LEGAL:
        words.pop()
    return words


# Vocabulary a real page in each sector actually uses. Splitting the sector KEY
# instead ("neocloud") matches nothing — no company calls itself a neocloud.
SECTOR_KEYWORDS = {
    "neocloud": {"cloud", "gpu", "compute", "inference", "ai", "cluster"},
    "ai-compute": {"gpu", "compute", "cluster", "ai", "training", "inference"},
    "cloud-hyperscale": {"cloud", "compute", "hosting", "region", "ai"},
    "datacenters": {"data center", "datacenter", "colocation", "campus",
                    "megawatt", "cloud", "ai"},
    "semiconductors": {"semiconductor", "chip", "silicon", "wafer", "transistor",
                       "asic", "memory", "foundry"},
    "fab-equipment": {"semiconductor", "wafer", "lithography", "fab", "metrology",
                      "inspection", "e-beam"},
    "robotics": {"robot", "robotic", "automation", "manipulation", "actuator"},
    "ev-automotive": {"vehicle", "electric car", "ev", "automotive", "drivetrain",
                      "battery", "motor"},
    "defense-tech": {"defense", "defence", "military", "warfighter", "cyber",
                     "national security"},
    "power-energy": {"power", "energy", "grid", "turbine", "generation",
                     "electricity", "megawatt"},
    "nuclear": {"nuclear", "reactor", "fission", "smr", "fuel"},
    "networking": {"fiber", "network", "conduit", "bandwidth", "interconnect"},
    "ai-labs": {"ai", "model", "research", "agent", "intelligence"},
    "ai-applications": {"ai", "platform", "software", "agent", "enterprise"},
    "ai-data-platform": {"data", "ai", "platform", "analytics", "warehouse"},
    "biotech-ai": {"biotech", "therapeutic", "drug", "molecule", "clinical"},
}


def sector_words(sector):
    """Words a page about this sector should plausibly contain."""
    if not sector:
        return set()
    if sector in SECTOR_KEYWORDS:
        return SECTOR_KEYWORDS[sector]
    # Unknown sector: fall back to its own tokens rather than blocking outright.
    out = set()
    for part in re.split(r"[-_]", sector):
        out.add(part)
        if part.endswith("s"):
            out.add(part[:-1])
    return {w for w in out if len(w) > 2}


def page_is(entity_name, page, sector=None, domain=None):
    """Does this page actually belong to `entity_name`? Rule 1 in the docstring."""
    words = core_words(entity_name)
    if not words:
        return False
    core = "".join(words)
    # Identity signal: the page names itself, OR the domain we guessed IS the
    # name (nebius.com titles itself "The Ultimate AI Cloud" — marketing copy,
    # but owning nebius.com is itself evidence). The sector gate below still
    # has to pass either way.
    named = core in norm(" ".join(page.signals))
    domain_is_name = bool(domain) and norm(domain.rsplit(".", 1)[0]) == core
    if not (named or domain_is_name):
        return False
    # A single generic word ("Lucid", "Nebius") could be anyone's site, so it
    # also has to look like it operates in this entity's sector. Same when the
    # only thing vouching for the page is the domain.
    meaningful = [w for w in words if w not in SUFFIXES]
    if len(meaningful) <= 1 or not named:
        if meaningful and meaningful[0] in NEVER_GUESS:
            return False
        blob = " ".join(page.signals).lower() + " " + getattr(page, "body_sample", "")
        want = sector_words(sector) or INDUSTRY_WORDS
        if not has_word(blob, want) or not has_word(blob, INDUSTRY_WORDS):
            return False
    return True


def guess_domains(name):
    """Domain candidates derived from an entity name — verified before use."""
    words = core_words(name)
    if not words or len(" ".join(words)) > 40:
        return []
    stems, out = [], []
    stems.append("".join(words))
    if len(words) > 1:
        stems.append("-".join(words))
        if words[-1] in SUFFIXES:
            stems.append("".join(words[:-1]))
        stems.append(words[0])              # "Nebius Group N.V." -> nebius.com
    stems = [s for s in dict.fromkeys(stems) if len(s) >= 3]
    # TLD-major order: every stem gets .com tried before any stem gets .ai.
    # Stem-major order meant "ABB Robotics" burned its budget on abbrobotics.*
    # and never reached abb.com.
    for tld in (".com", ".ai", ".io", ".co"):
        for stem in stems:
            out.append(stem + tld)
    if words[-1] == "ai" and len(words) > 1:
        out.insert(0, "".join(words[:-1]) + ".ai")
    return list(dict.fromkeys(out))[:8]


# ── image candidates ───────────────────────────────────────────────────────
def domain_of(url):
    try:
        h = urlparse(url).hostname or ""
        return h[4:] if h.startswith("www.") else h
    except Exception:
        return None


def clean_domain(d):
    """Normalise a domain that may arrive bare ('nvidia.com') or as a URL."""
    if not d:
        return None
    d = str(d).strip()
    if "://" in d:
        d = domain_of(d) or ""
    d = d.split("/", 1)[0]
    d = d[4:] if d.startswith("www.") else d
    return d or None


def x_handle(url):
    try:
        return (urlparse(url).path or "").strip("/").split("/")[0] or None
    except Exception:
        return None


def icon_urls(domain, page=None, base=None):
    if page is None:
        got = get_page(domain)
        if not got:
            return []
        base, page = got
    return [urljoin(base, h) for h, _ in sorted(page.icons, key=lambda t: -t[1])[:4]]


def service_urls(domain):
    return [f"https://unavatar.io/{domain}?fallback=false",
            f"https://icon.horse/icon/{domain}",
            f"https://www.google.com/s2/favicons?sz=256&domain={domain}"]


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        ct = (r.headers.get("Content-Type") or "").split(";")[0].strip().lower()
        data = r.read()
    if len(data) < 200:
        return None
    if not ct.startswith("image/"):
        if b"<svg" in data[:400]:
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


def best_logo(urls):
    best = None
    for url in urls:
        try:
            res = fetch(url)
        except Exception:
            continue
        if not res:
            continue
        ct, data = res
        score = measure(ct, data)
        if best is None or score > best[0]:
            best = (score, ct, data, url)
        if score >= GOOD_ENOUGH:
            break
    return best


# ── main ───────────────────────────────────────────────────────────────────
def entities():
    """Every node on the map, with whatever the reference file knows about it."""
    nodes = json.load(open(MAP)).get("nodes", [])
    ref = json.load(open(REF))
    out = []
    for n in nodes:
        meta = ref.get(n["id"]) or {}
        # Node links win over the reference's, then merge the rest — mirrors what
        # the app does at capitalMap.js:463 (engine emit is the fresher source).
        node_links = n.get("links") or []
        merged = node_links + [l for l in (meta.get("links") or []) if l not in node_links]
        out.append({"id": n["id"], "name": n.get("label") or n["id"],
                    "sector": n.get("sector"), "links": merged,
                    "domain": n.get("domain"),   # engine's researched, authoritative site
                    "ref": meta})
    # reference-only entities (curated but not on this cycle's map) still refresh
    seen = {e["id"] for e in out}
    for nid, meta in ref.items():
        if nid != "_note" and nid not in seen:
            out.append({"id": nid, "name": meta.get("label") or nid.split(":", 1)[-1],
                        "sector": None, "links": meta.get("links") or [],
                        "domain": None, "ref": meta})

    # ── The ecosystem map ────────────────────────────────────────────────
    # Its ids never collide with the flow map's (`nvidia` vs `alloc:NVIDIA`),
    # so both live in one manifest. `store` says which side-car a newly
    # resolved domain belongs in.
    for e in out:
        e["store"] = "ref"
    eco_domains = json.load(open(ECO_DOMAINS)) if os.path.exists(ECO_DOMAINS) else {}
    for n in json.load(open(ECO_MAP)).get("entities", []):
        dom = eco_domains.get(n["id"])
        out.append({
            "id": n["id"],
            "name": n.get("name") or n["id"],
            # The sector is a slug on this map (`gpu_platform`); the verifier
            # only uses it for keyword hints, so underscores become spaces.
            "sector": (n.get("sector") or "").replace("_", " ") or None,
            # A known domain enters as a website link, exactly like a curated
            # one on the flow map, so the icon fetch treats both the same.
            "links": ([{"kind": "website", "label": dom, "url": f"https://{dom}"}]
                      if dom else []),
            "domain": dom,
            "ref": {},
            "store": "eco",
        })
    return out


def parent_logo(name, known):
    """A fund vehicle or JV borrows its sponsor's mark.

    "Andreessen Horowitz Fund X-B - AI Infrastructure, L.P." has no website of
    its own and never will, but a16z does — and showing the sponsor's mark is
    accurate, not a guess. Matches the LONGEST known entity name contained in
    this one, so "Altimeter Kilauea Fund II" picks Altimeter rather than a
    shorter accidental substring.
    """
    n = norm(name)
    best = None
    for other_name, path in known:
        o = norm(other_name)
        if len(o) < 6 or o == n:
            continue
        if o in n and (best is None or len(o) > len(best[0])):
            best = (o, other_name, path)
    return best


def main():
    only_missing = "--all" not in sys.argv
    dry = "--dry-run" in sys.argv
    os.makedirs(OUT_DIR, exist_ok=True)
    manifest = json.load(open(MANIFEST)) if os.path.exists(MANIFEST) else {}
    ref = json.load(open(REF))

    all_entities = entities()
    name_by_id = {e["id"]: e["name"] for e in all_entities}
    eco_domains = json.load(open(ECO_DOMAINS)) if os.path.exists(ECO_DOMAINS) else {}
    eco_auto = []

    ok = skipped = miss = resolved = inherited = 0
    low, unresolved, still_missing = [], [], []
    for e in all_entities:
        nid, name = e["id"], e["name"]
        have = manifest.get(nid)
        if only_missing and have and os.path.exists(os.path.join(ROOT, "public", have.lstrip("/"))):
            skipped += 1
            continue

        links = e["links"]
        web = next((l for l in links if l.get("kind") == "website"), None)
        firm = next((l for l in links if l.get("kind") == "firm"), None)
        xl = next((l for l in links if l.get("kind") == "x"), None)
        domains = [d for d in (domain_of(web["url"]) if web else None,
                               domain_of(firm["url"]) if firm else None) if d]

        urls, found_domain = [], None
        for d in domains:
            urls += icon_urls(d)
        if xl:
            h = x_handle(xl["url"])
            if h:
                urls.append(f"https://unavatar.io/x/{h}?fallback=false")

        # No link on file — resolve one, trusting only a verified page. The
        # engine's own `domain` (authoritative) is tried FIRST, then name-guesses.
        # It is still run through page_is, so a wrong emit can't sneak a bad logo in.
        if not domains:
            node_domain = clean_domain(e.get("domain"))
            candidates = ([node_domain] if node_domain else []) + guess_domains(name)
            for cand in dict.fromkeys(candidates):
                got = get_page(cand)
                if not got:
                    continue
                base, page = got
                if not page_is(name, page, e.get("sector"), cand):
                    continue
                found_domain = cand
                urls += icon_urls(cand, page, base)
                break

        for d in domains + ([found_domain] if found_domain else []):
            urls += service_urls(d)

        best = best_logo(list(dict.fromkeys(urls)))
        if not best:
            unresolved.append((nid, name))
            continue

        score, ct, data, url = best
        safe = re.sub(r"[^A-Za-z0-9]+", "_", nid)
        if not dry:
            for f in os.listdir(OUT_DIR):            # drop stale ext for this entity
                if os.path.splitext(f)[0] == safe:
                    os.unlink(os.path.join(OUT_DIR, f))
            fname = safe + EXT.get(ct, ".png")
            with open(os.path.join(OUT_DIR, fname), "wb") as f:
                f.write(data)
            manifest[nid] = f"/logos/{fname}"
            # Fold an auto-resolved site back into the reference file, so the
            # entity panel gains a link too — flagged for human review.
            if found_domain and e["store"] != "eco":
                entry = ref.setdefault(nid, {"type": "org"})
                if not entry.get("links"):
                    entry["links"] = [{"kind": "website", "label": found_domain,
                                       "url": f"https://{found_domain}"}]
                    entry["auto_resolved"] = True
            if found_domain and e["store"] == "eco":
                # The ecosystem side-car is a flat id -> domain map, and the
                # adapter reads it for BOTH the logo and the panel's «Сайт»
                # chip.
                eco_domains[nid] = found_domain
        if found_domain:
            resolved += 1
            if e["store"] == "eco":
                eco_auto.append((nid, name, found_domain))
        ok += 1
        label = "vector" if score == 10_000 else f"{score}px"
        if score < LOW_RES:
            low.append(f"{nid} ({label})")
        tag = f" resolved:{found_domain}" if found_domain else ""
        print(f"  ok   {nid:52s} {label:>7s}{tag}  <- {url[:56]}")

    # Second pass: anything still without a mark borrows its sponsor's, if it
    # plainly belongs to one. Runs last so it can see this run's new logos.
    known = [(name_by_id.get(i, ""), p) for i, p in manifest.items() if name_by_id.get(i)]
    for nid, name in unresolved:
        hit = parent_logo(name, known)
        if hit:
            _, parent_name, path = hit
            if not dry:
                manifest[nid] = path
            inherited += 1
            print(f"  ok   {nid:52s} inherit  <- {parent_name}")
        else:
            miss += 1
            still_missing.append((nid, name))
            print(f"  MISS {nid:52s} (monogram)")

    # A miss is usually correct — unnamed projects, JVs and government
    # programmes have no brand. The ones that ARE real companies just need a
    # website pasted into entityReference.json once, so list them explicitly.
    if still_missing and not dry:
        with open(MISSES, "w") as f:
            f.write("# Entities rendering as a monogram tile.\n"
                    "# Many are correct (projects, JVs, funds, private individuals).\n"
                    "# For any that IS a real company, add a website link to\n"
                    "# src/data/entityReference.json and re-run `npm run logos`.\n\n")
            for nid, name in still_missing:
                f.write(f"{nid}\t{name}\n")

    if not dry:
        json.dump(manifest, open(MANIFEST, "w"), indent=2, ensure_ascii=False)
        json.dump(ref, open(REF, "w"), indent=2, ensure_ascii=False)
        json.dump(dict(sorted(eco_domains.items())), open(ECO_DOMAINS, "w"),
                  indent=2, ensure_ascii=False)

    # Every guessed domain, listed. A verified page is good evidence but not
    # proof, and this side-car is what the panel links to — so the guesses are
    # printed for a human to glance over rather than buried in a diff.
    if eco_auto:
        print(f"\nЭкосистема — домены подобраны автоматически ({len(eco_auto)}), проверьте:")
        for nid, name, dom in eco_auto:
            print(f"  {nid:28s} {name[:30]:30s} -> {dom}")
    print(f"\n{ok + inherited} logos ({resolved} via auto-resolved domain, "
          f"{inherited} inherited from a sponsor), {skipped} already had one, "
          f"{miss} missing -> monogram")
    if low:
        print(f"low-res (site publishes nothing bigger): {', '.join(low)}")


if __name__ == "__main__":
    main()
