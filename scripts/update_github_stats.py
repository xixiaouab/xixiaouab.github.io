#!/usr/bin/env python3
"""Cache stars received by xixiaouab's public owned GitHub repositories.

No token or third-party service is required. Failed/incomplete requests never
replace the last successful snapshot. Forks and archived repositories are
included because they are still public repositories owned by this account.
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

LOGIN = "xixiaouab"
API_URL = f"https://api.github.com/users/{LOGIN}/repos"


def fetch_page(page: int) -> list[dict[str, Any]]:
    query = urllib.parse.urlencode({
        "type": "owner", "per_page": 100, "page": page,
        "sort": "full_name", "direction": "asc",
    })
    request = urllib.request.Request(API_URL + "?" + query, headers={
        "Accept": "application/vnd.github+json",
        "User-Agent": "xixiaouab-homepage-statistics",
    })
    with urllib.request.urlopen(request, timeout=25) as response:
        data = json.load(response)
    if not isinstance(data, list):
        raise ValueError("GitHub did not return a repository list")
    return data


def collect_snapshot() -> dict[str, Any]:
    seen: set[int] = set()
    total = 0
    for page in range(1, 1001):
        repositories = fetch_page(page)
        for repo in repositories:
            if not isinstance(repo, dict):
                raise ValueError("Malformed repository record")
            owner = repo.get("owner") or {}
            if owner.get("login", "").lower() != LOGIN.lower():
                raise ValueError("Unexpected repository owner")
            if repo.get("private") is not False:
                raise ValueError("Unexpected non-public repository")
            repo_id, stars = repo.get("id"), repo.get("stargazers_count")
            if type(repo_id) is not int or repo_id <= 0 or repo_id in seen:
                raise ValueError("Duplicate or invalid repository ID; retry later")
            if type(stars) is not int or stars < 0:
                raise ValueError("Invalid star count")
            seen.add(repo_id)
            total += stars
        if len(repositories) < 100:
            break
    else:
        raise ValueError("Repository pagination did not finish")

    now = datetime.now(timezone.utc).replace(microsecond=0)
    return {
        "schema_version": 1,
        "profile": {"login": LOGIN, "github_url": f"https://github.com/{LOGIN}"},
        "summary": {
            "total_stars": total,
            "public_repository_count": len(seen),
            "updated": now.date().isoformat(),
            "updated_at_utc": now.isoformat(),
            "source": "github_rest_public_repositories",
        },
        "scope": {
            "visibility": "public", "ownership": "owner",
            "include_forks": True, "include_archived": True,
        },
        "source_url": API_URL + "?type=owner&per_page=100",
    }


def has_valid_cache(path: Path) -> bool:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        count = data["summary"]["total_stars"]
        return data["profile"]["login"] == LOGIN and type(count) is int and count >= 0
    except (OSError, ValueError, KeyError, TypeError):
        return False


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", default="docs/data/github_stats.json")
    parser.add_argument("--soft-fail", action="store_true")
    args = parser.parse_args()
    output = Path(args.output)
    try:
        document = collect_snapshot()
        output.parent.mkdir(parents=True, exist_ok=True)
        temporary = output.with_suffix(output.suffix + ".tmp")
        temporary.write_text(json.dumps(document, indent=2) + "\n", encoding="utf-8")
        temporary.replace(output)
    except Exception as exc:
        print(f"::warning::GitHub statistics update skipped: {exc}", file=sys.stderr)
        return 0 if args.soft_fail and has_valid_cache(output) else 1
    print(f"Updated GitHub stars: {document['summary']['total_stars']} "
          f"across {document['summary']['public_repository_count']} public owned repositories")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
