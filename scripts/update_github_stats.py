#!/usr/bin/env python3
"""Cache GitHub stars for personal repositories and verified coauthored projects.

Paper-to-repository mappings and explicit exclusions live in
scripts/github_research_projects.json. Repositories are deduplicated by GitHub
ID (including renamed repositories). A failed or incomplete refresh preserves
the previous snapshot. Only public repository metadata is collected.
"""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import re
import sys
import urllib.parse
import urllib.request

LOGIN = "xixiaouab"
SCHOLAR_ID = "Q4DnRVgAAAAJ"
API_BASE = "https://api.github.com"
REPOSITORY_NAME = re.compile(r"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$")


def request_json(url):
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "xixiaouab-homepage-statistics"}
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if token:
        headers["Authorization"] = "Bearer " + token
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=25) as response:
        return json.load(response)


def validate_repository(repo):
    if not isinstance(repo, dict) or repo.get("private") is not False:
        raise ValueError("Expected a public repository record")
    repo_id, stars, name = repo.get("id"), repo.get("stargazers_count"), repo.get("full_name")
    if type(repo_id) is not int or repo_id <= 0 or type(stars) is not int or stars < 0:
        raise ValueError("Invalid repository ID or star count")
    if not isinstance(name, str) or not REPOSITORY_NAME.fullmatch(name):
        raise ValueError("Invalid canonical repository name")
    return repo


def owned_repositories():
    seen, repositories = set(), []
    for page in range(1, 1001):
        query = urllib.parse.urlencode({"type": "owner", "per_page": 100, "page": page,
                                        "sort": "full_name", "direction": "asc"})
        data = request_json(f"{API_BASE}/users/{LOGIN}/repos?{query}")
        if not isinstance(data, list):
            raise ValueError("GitHub did not return a repository list")
        for record in data:
            repo = validate_repository(record)
            if (repo.get("owner") or {}).get("login", "").casefold() != LOGIN.casefold():
                raise ValueError("Unexpected repository owner")
            if repo["id"] in seen:
                raise ValueError("Duplicate pagination record; retry later")
            seen.add(repo["id"])
            repositories.append(repo)
        if len(data) < 100:
            return repositories
    raise ValueError("Repository pagination did not finish")


def publication_id(paper):
    values = urllib.parse.parse_qs(urllib.parse.urlparse(paper.get("link", "")).query)
    value = values.get("citation_for_view", [""])[0]
    if not value.startswith(SCHOLAR_ID + ":") or not value.split(":", 1)[1]:
        raise ValueError("Invalid Scholar publication identifier")
    return value


def load_scope(projects_path, scholar_path):
    config = json.loads(projects_path.read_text(encoding="utf-8"))
    scholar = json.loads(scholar_path.read_text(encoding="utf-8"))
    if config.get("schema_version") != 1 or config.get("profile") != {"login": LOGIN, "scholar_id": SCHOLAR_ID}:
        raise ValueError("Unexpected research-project configuration identity")
    if scholar.get("profile", {}).get("scholar_id") != SCHOLAR_ID or not scholar.get("all_papers"):
        raise ValueError("Scholar publication cache is unavailable or belongs to someone else")
    current = {publication_id(paper): paper["title"] for paper in scholar["all_papers"]}
    exclusions = config.get("excluded_papers", [])
    excluded_ids = {item["scholar_publication_id"] for item in exclusions}
    excluded_names, excluded_repo_ids = set(), set()
    for item in exclusions:
        for repo in item.get("repositories", []):
            name = repo["full_name"]
            if not REPOSITORY_NAME.fullmatch(name):
                raise ValueError("Invalid excluded repository name")
            excluded_names.add(name.casefold())
            if "id" in repo:
                if type(repo["id"]) is not int or repo["id"] <= 0:
                    raise ValueError("Excluded repository IDs must be positive integers")
                excluded_repo_ids.add(repo["id"])
    references, audited = {}, set()
    for paper in config.get("papers", []):
        paper_id = paper["scholar_publication_id"]
        if paper_id in audited:
            raise ValueError("Duplicate audited publication")
        audited.add(paper_id)
        if paper_id not in current or paper_id in excluded_ids:
            continue
        for repo in paper.get("repositories", []):
            name, evidence = repo["full_name"], repo.get("evidence_url", "")
            if not REPOSITORY_NAME.fullmatch(name) or not evidence.startswith("https://"):
                raise ValueError("A repository mapping requires a name and primary-source evidence")
            if name.casefold() in excluded_names:
                continue
            references.setdefault(name.casefold(), {"full_name": name, "papers": []})["papers"].append({
                "scholar_publication_id": paper_id, "title": current[paper_id], "evidence_url": evidence,
            })
    if not audited or not exclusions:
        raise ValueError("The project audit or its explicit exclusions are missing")
    coverage = {
        "scholar_paper_count": len(current), "audited_paper_count": len(set(current) & audited),
        "excluded_paper_count": len(set(current) & excluded_ids),
        "papers_with_verified_repositories": sum(bool(p.get("repositories")) and p["scholar_publication_id"] in current
                                                and p["scholar_publication_id"] not in excluded_ids
                                                for p in config["papers"]),
        "new_papers_pending_repository_audit": [
            {"scholar_publication_id": key, "title": title}
            for key, title in current.items() if key not in audited and key not in excluded_ids
        ],
    }
    return references, excluded_names, excluded_repo_ids, exclusions, coverage


def collect_snapshot(projects_path, scholar_path):
    references, excluded_names, excluded_ids, exclusions, coverage = load_scope(projects_path, scholar_path)
    owned = owned_repositories()
    by_name = {repo["full_name"].casefold(): repo for repo in owned}
    additional_names = sorted(set(references) - set(by_name))

    def fetch_repository(name):
        repo = validate_repository(request_json(f"{API_BASE}/repos/{name}"))
        return name, repo

    with ThreadPoolExecutor(max_workers=5) as executor:
        fetched = dict(executor.map(fetch_repository, additional_names))
    by_id = {}

    def add(repo, owned=False, papers=()):
        if repo["full_name"].casefold() in excluded_names or repo["id"] in excluded_ids:
            return
        item = by_id.setdefault(repo["id"], {
            "id": repo["id"], "full_name": repo["full_name"],
            "html_url": "https://github.com/" + repo["full_name"],
            "stars": repo["stargazers_count"], "owned": False, "papers": [],
        })
        item["owned"] = item["owned"] or owned
        for paper in papers:
            if paper not in item["papers"]:
                item["papers"].append(paper)

    for repo in owned:
        add(repo, owned=True)
    for name, reference in references.items():
        add(by_name[name] if name in by_name else fetched[name], papers=reference["papers"])
    repositories = sorted(by_id.values(), key=lambda repo: (-repo["stars"], repo["full_name"].casefold()))
    if len({repo["full_name"].casefold() for repo in repositories}) != len(repositories):
        raise ValueError("Inconsistent repository identity; retry later")
    now = datetime.now(timezone.utc).replace(microsecond=0)
    return {
        "schema_version": 2,
        "profile": {"login": LOGIN, "github_url": f"https://github.com/{LOGIN}", "scholar_id": SCHOLAR_ID},
        "summary": {
            "total_stars": sum(repo["stars"] for repo in repositories),
            "public_repository_count": len(repositories),
            "owned_repository_count": sum(repo["owned"] for repo in repositories),
            "additional_research_repository_count": sum(not repo["owned"] for repo in repositories),
            "updated": now.date().isoformat(), "updated_at_utc": now.isoformat(),
            "source": "github_rest_verified_personal_and_coauthored_repositories",
        },
        "scope": {
            "visibility": "public", "ownership": "personal_and_coauthored_research",
            "include_forks": True, "include_archived": True, "deduplicate_by": "github_repository_id",
            "excluded_papers": exclusions,
        },
        "coverage": coverage, "repositories": repositories,
    }


def has_valid_cache(path):
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        count = data["summary"]["total_stars"]
        return data["profile"]["login"] == LOGIN and type(count) is int and count >= 0
    except (OSError, ValueError, KeyError, TypeError):
        return False


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", default="docs/data/github_stats.json")
    parser.add_argument("--projects", default="scripts/github_research_projects.json")
    parser.add_argument("--scholar", default="docs/data/scholar_citations.json")
    parser.add_argument("--soft-fail", action="store_true")
    args = parser.parse_args()
    output = Path(args.output)
    try:
        document = collect_snapshot(Path(args.projects), Path(args.scholar))
        output.parent.mkdir(parents=True, exist_ok=True)
        temporary = output.with_suffix(output.suffix + ".tmp")
        temporary.write_text(json.dumps(document, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        temporary.replace(output)
    except Exception as exc:
        print(f"::warning::GitHub statistics update skipped: {exc}", file=sys.stderr)
        return 0 if args.soft_fail and has_valid_cache(output) else 1
    print(f"Updated GitHub stars: {document['summary']['total_stars']} across "
          f"{document['summary']['public_repository_count']} distinct public repositories")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
