"""Point the publishing metadata of this static copy at its real GitHub Pages URL.

Every page carries absolute URLs for search engines and social previews
(`<link rel="canonical">`, `hreflang` alternates, `og:url`, `og:image` and the
Organization block in JSON-LD). Those cannot be relative, and this copy ships
them with a placeholder:

    https://YOUR-USERNAME.github.io/YOUR-REPO/

Run this script once, after the repository exists, to write the real address
into all 79 pages. Pages that are not published metadata (CSS, images, every
navigation link) are already relative and are never touched.

Usage:
    python set-site-url.py https://USERNAME.github.io/REPO
    python set-site-url.py https://USERNAME.github.io            (user site)

The script is idempotent: run it again with a new address (for example after
renaming the repository) and it rewrites the same values.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent

CANONICAL = re.compile(rb'(<link rel="canonical" href=")([^"]*)(")')
HREFLANG = re.compile(
    rb'(<link rel="alternate" hreflang=")(fa|en|ar|x-default)(" href=")([^"]*)(")'
)
OG_URL = re.compile(rb'(<meta property="og:url" content=")([^"]*)(")')
OG_IMAGE = re.compile(rb'(<meta property="og:image" content=")([^"]*)(")')
LD_BLOCK = re.compile(
    rb'(<script type="application/ld\+json">)(.*?)(</script>)', re.DOTALL
)
LD_URL = re.compile(rb'("url"\s*:\s*")([^"]*)(")')

OG_IMAGE_PATH = "/static/img/og-cover.png"
# The 404 page is the Persian one, so it advertises the Persian home page.
FALLBACK_ROUTE = "/fa/"


def normalise(raw):
    base = raw.strip().rstrip("/")
    if not re.match(r"^https?://[^/\s]+", base):
        raise SystemExit(
            "Expected an address like https://USERNAME.github.io/REPO\n"
            f"Got: {raw!r}"
        )
    return base


def route_for(page):
    rel = page.relative_to(ROOT).as_posix()
    if rel == "404.html":
        return FALLBACK_ROUTE
    directory = rel[: -len("/index.html")] if rel.endswith("/index.html") else ""
    return f"/{directory}/" if directory else "/"


def alternate_route(route, language):
    """The same page in another language, e.g. /fa/services/ -> /en/services/."""
    target = "fa" if language == "x-default" else language
    parts = [part for part in route.split("/") if part]
    if parts:
        parts[0] = target
    else:
        parts = [target]
    return "/" + "/".join(parts) + "/"


def rewrite_page(page, base):
    """Return (new bytes, counters) or (None, counters) when nothing matched."""
    original = page.read_bytes()
    counts = {"canonical": 0, "hreflang": 0, "og:url": 0, "og:image": 0, "ld": 0}
    route = route_for(page)
    page_url = (base + route).encode("utf-8")
    image_url = (base + OG_IMAGE_PATH).encode("utf-8")
    base_url = base.encode("utf-8")

    text = CANONICAL.sub(
        lambda m: m.group(1) + page_url + m.group(3), original
    )
    counts["canonical"] = len(CANONICAL.findall(original))

    before = text
    text = HREFLANG.sub(
        lambda m: m.group(1)
        + m.group(2)
        + m.group(3)
        + (base + alternate_route(route, m.group(2).decode())).encode("utf-8")
        + m.group(5),
        before,
    )
    counts["hreflang"] = len(HREFLANG.findall(before))

    before = text
    text = OG_URL.sub(lambda m: m.group(1) + page_url + m.group(3), before)
    counts["og:url"] = len(OG_URL.findall(before))

    before = text
    text = OG_IMAGE.sub(lambda m: m.group(1) + image_url + m.group(3), before)
    counts["og:image"] = len(OG_IMAGE.findall(before))

    # Only inside the JSON-LD block, so an unrelated "url" key is never touched.
    def fix_ld(match):
        counts["ld"] += len(LD_URL.findall(match.group(2)))
        fixed = LD_URL.sub(lambda m: m.group(1) + base_url + m.group(3), match.group(2))
        return match.group(1) + fixed + match.group(3)

    text = LD_BLOCK.sub(fix_ld, text)

    return (text if text != original else None), counts


def main():
    if len(sys.argv) != 2:
        raise SystemExit(__doc__.strip().split("Usage:")[0].strip() + "\n\nUsage: python set-site-url.py https://USERNAME.github.io/REPO")

    base = normalise(sys.argv[1])
    pages = sorted(ROOT.rglob("*.html"))
    pages = [p for p in pages if "static" not in p.relative_to(ROOT).parts]

    changed = 0
    totals = {"canonical": 0, "hreflang": 0, "og:url": 0, "og:image": 0, "ld": 0}
    for page in pages:
        updated, counts = rewrite_page(page, base)
        for key, value in counts.items():
            totals[key] += value
        if updated is not None:
            page.write_bytes(updated)
            changed += 1

    print(f"Base URL : {base}")
    print(f"Pages    : {len(pages)} HTML files scanned ({changed} written)")
    for key in ("canonical", "hreflang", "og:url", "og:image", "ld"):
        print(f"  {key:9s}: {totals[key]}")
    if totals["canonical"] == 0:
        raise SystemExit("No canonical tag found — is this the right folder?")


if __name__ == "__main__":
    main()
