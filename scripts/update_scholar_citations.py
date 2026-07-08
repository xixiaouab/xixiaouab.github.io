#!/usr/bin/env python3
"""Update the Google Scholar citation snapshot used by the homepage.

The script prefers SerpApi when SERPAPI_KEY is available because GitHub Actions
often runs from IP ranges that Google Scholar blocks. It falls back to direct
profile parsing for local/manual runs.
"""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any


AUTHOR_ID = os.environ.get("SCHOLAR_AUTHOR_ID", "Q4DnRVgAAAAJ")
SCHOLAR_URL = f"https://scholar.google.com/citations?user={AUTHOR_ID}&hl=en"
OUTPUT_PATH = Path("docs/data/scholar_citations.json")
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
)


def fetch_json(url: str) -> dict[str, Any]:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=40) as response:
        return json.loads(response.read().decode("utf-8"))


def fetch_text(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=40) as response:
        return response.read().decode("utf-8", errors="replace")


def int_or_none(value: Any) -> int | None:
    if value is None:
        return None
    text = re.sub(r"[^\d]", "", str(value))
    return int(text) if text else None


def metric_from_serpapi_table(table: list[dict[str, Any]], key: str) -> int | None:
    for row in table:
        value = row.get(key)
        if isinstance(value, dict):
            return int_or_none(value.get("all"))
        if value is not None:
            return int_or_none(value)
    return None


def parse_serpapi(data: dict[str, Any]) -> dict[str, Any]:
    author = data.get("author", {})
    cited_by = data.get("cited_by", {})
    table = cited_by.get("table") or []
    articles = data.get("articles") or []

    papers = []
    for article in articles:
        cited = article.get("cited_by") or {}
        papers.append(
            {
                "title": article.get("title", ""),
                "year": str(article.get("year", "") or ""),
                "venue": article.get("publication", "") or article.get("conference", "") or "",
                "citations": int_or_none(cited.get("value")) or 0,
                "link": article.get("link") or cited.get("link") or "",
            }
        )

    return {
        "name": author.get("name") or "Xi Xiao",
        "affiliation": author.get("affiliations") or "",
        "total_citations": metric_from_serpapi_table(table, "citations"),
        "h_index": metric_from_serpapi_table(table, "h_index"),
        "i10_index": metric_from_serpapi_table(table, "i10_index"),
        "papers": papers,
        "source": "serpapi",
    }


def parse_direct_scholar(page: str) -> dict[str, Any]:
    meta_match = re.search(r"Cited by\s+([\d,]+)", page)
    stat_values = [
        int_or_none(html.unescape(value))
        for value in re.findall(r'<td class="gsc_rsb_std">([^<]+)</td>', page)
    ]

    row_pattern = re.compile(
        r'<tr class="gsc_a_tr">.*?'
        r'<a href="(?P<href>[^"]+)" class="gsc_a_at">(?P<title>.*?)</a>'
        r'(?P<body>.*?)'
        r'<td class="gsc_a_c">(?P<citation_cell>.*?)</td>.*?'
        r'<td class="gsc_a_y">(?P<year_cell>.*?)</td>',
        re.S,
    )
    papers = []
    for match in row_pattern.finditer(page):
        body = match.group("body")
        gray = re.findall(r'<div class="gs_gray">(.*?)</div>', body, re.S)
        venue = ""
        if len(gray) > 1:
            venue = re.sub(r"<.*?>", "", gray[1])
            venue = html.unescape(re.sub(r"\s+", " ", venue)).strip()
        citation_text = re.sub(r"<.*?>", "", match.group("citation_cell"))
        year_text = re.sub(r"<.*?>", "", match.group("year_cell"))
        href = html.unescape(match.group("href"))
        if href.startswith("/"):
            href = "https://scholar.google.com" + href
        papers.append(
            {
                "title": html.unescape(re.sub(r"<.*?>", "", match.group("title"))).strip(),
                "year": html.unescape(year_text).strip(),
                "venue": venue,
                "citations": int_or_none(citation_text) or 0,
                "link": href,
            }
        )

    total = int_or_none(meta_match.group(1)) if meta_match else None
    if total is None and stat_values:
        total = stat_values[0]

    return {
        "name": "Xi Xiao",
        "affiliation": "",
        "total_citations": total,
        "h_index": stat_values[2] if len(stat_values) > 2 else None,
        "i10_index": stat_values[4] if len(stat_values) > 4 else None,
        "papers": papers,
        "source": "google_scholar_direct",
    }


def fetch_snapshot() -> dict[str, Any]:
    serpapi_key = os.environ.get("SERPAPI_KEY", "").strip()
    if serpapi_key:
        params = {
            "engine": "google_scholar_author",
            "author_id": AUTHOR_ID,
            "hl": "en",
            "num": "100",
            "api_key": serpapi_key,
        }
        url = "https://serpapi.com/search.json?" + urllib.parse.urlencode(params)
        data = fetch_json(url)
        if data.get("error"):
            raise RuntimeError(data["error"])
        return parse_serpapi(data)

    return parse_direct_scholar(fetch_text(SCHOLAR_URL))


def load_existing(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def build_document(snapshot: dict[str, Any], existing: dict[str, Any]) -> dict[str, Any]:
    today = date.today().isoformat()
    total = snapshot.get("total_citations")
    if total is None:
        raise RuntimeError("Could not read total citation count.")

    history = list(existing.get("history") or [])
    history = [entry for entry in history if entry.get("date") != today]
    history.append({"date": today, "total_citations": total})
    history = history[-730:]

    papers = sorted(snapshot.get("papers") or [], key=lambda item: item.get("citations", 0), reverse=True)
    return {
        "profile": {
            "name": snapshot.get("name") or "Xi Xiao",
            "scholar_id": AUTHOR_ID,
            "scholar_url": SCHOLAR_URL,
            "affiliation": snapshot.get("affiliation") or "",
        },
        "summary": {
            "total_citations": total,
            "h_index": snapshot.get("h_index"),
            "i10_index": snapshot.get("i10_index"),
            "paper_count": len(papers),
            "updated": today,
            "updated_at_utc": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
            "source": snapshot.get("source"),
        },
        "history": history,
        "top_papers": papers[:8],
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default=str(OUTPUT_PATH))
    parser.add_argument("--soft-fail", action="store_true")
    args = parser.parse_args()

    output = Path(args.output)
    try:
        document = build_document(fetch_snapshot(), load_existing(output))
    except Exception as exc:  # noqa: BLE001
        if args.soft_fail:
            print(f"Scholar citation update skipped: {exc}", file=sys.stderr)
            return 0
        raise

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(document, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(
        "Updated Scholar citations:",
        document["summary"]["total_citations"],
        "citations from",
        document["summary"]["source"],
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
