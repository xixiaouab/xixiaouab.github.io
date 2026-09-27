# ReaLVR project website

Static project page for GitHub Pages. No build or third-party JavaScript dependencies.

Public location: https://xixiaouab.github.io/projects/ReaLVR/

## Update resource links

Edit `links.js` and fill the `paper`, `code`, and `model` HTTPS URLs. The resource buttons enable automatically. Empty URLs show “Coming soon”.

## Preview

Run `python3 -m http.server 8765` in this folder and open http://localhost:8765/.

## Assets

- `evidence-credit.svg`: self-contained conceptual mechanism animation; pause/play and reduced motion supported.
- `evidence-credit.gif`: downloadable token animation.
- The flat illustration follows the manuscript main figure: rectangular latent tokens, simple arrows, and orange outlines for positions with higher supervision weights. Every latent position retains a uniform baseline weight.
- Paper figures are taken from the author's ReaLVR manuscript.
- The animation is a conceptual schematic, not a measured attention trace.

Content corresponds to the 41-page arXiv manuscript preview dated September 25, 2026. Selected result rows retain the paper's numerical values. The 235B model is evaluated on three tasks only.
