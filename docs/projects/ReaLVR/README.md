# ReaLVR project website

Static project page for GitHub Pages. No build or third-party JavaScript dependencies.

Public location: https://xixiaouab.github.io/projects/ReaLVR/

## Update resource links

Edit `links.js` and fill the `paper`, `code`, and `model` HTTPS URLs. The resource buttons enable automatically. Empty URLs remain disabled and expose “Coming soon” in the tooltip and accessible label.

## Preview

Run `python3 -m http.server 8765` in this folder and open http://localhost:8765/.

## Design

Neutral black-and-white page layout with dark resource pills. The Amazon logo keeps its original colors. The custom ReaLVR mark connects a selected image region to two highlighted latent tokens, using muted blue and peach. Author links retain the reference page’s blue. Original scientific figures keep their native colors.

## Assets

- `evidence-credit.svg`: self-contained conceptual mechanism animation; pause/play and reduced motion supported.
- `evidence-credit.gif`: downloadable token animation.
- The animation uses the original method artwork from slide 8, exported September 25, 2026. The vector artwork is preserved, with gentle camera focus and overlays on its existing token and supervision paths. Every latent position retains a uniform baseline weight.
- `evidence-credit-still.svg` opens the complete original figure. Pause/play and reduced motion are supported.
- Paper figures are taken from the author's ReaLVR manuscript.
- The animation is a conceptual schematic, not a measured attention trace.

Content corresponds to the 41-page arXiv manuscript preview dated September 25, 2026. Selected result rows retain the paper's numerical values. The 235B model is evaluated on three tasks only.
