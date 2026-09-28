# FORGE project page

Static research site for **FORGE: Form-Optimal Routing of Grounded Evidence for Frozen LLM Agents**.

Published at https://xixiaouab.github.io/projects/FORGE/ from `docs/projects/FORGE` on the personal site's `master` branch.

- `index.html`: authors, affiliations, text and citation.
- `style.css`: responsive site styles.
- `script.js`: protocol/host comparison and BibTeX copy.
- `motion.html`: independent, captioned method animation, with controls and reduced-motion support.
- `links.js`: public resource URLs; set `code` when the code is released.
- `assets/FORGE.pdf`: arXiv-style PDF from Overleaf, 27 September 2026.
- Paper figures retain their original artwork and colors.

## Result provenance

Cached results use Table 1, Fresh Online results use Table 2, and cross-host transfer uses Table 8. Fresh Online counts all calls/tokens. Full uses four pre-route host feature probes plus one final-answer call; Lite uses just the final-answer call. Displayed comparisons never mix the two protocols.

Preview from this directory with `python3 -m http.server 8767`.
