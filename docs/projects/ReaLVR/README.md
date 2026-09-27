# ReaLVR project website

Static project page for GitHub Pages. No build or third-party JavaScript dependencies.

Public location: https://xixiaouab.github.io/projects/ReaLVR/

## Update resource links

Edit `links.js` and fill the `paper`, `code`, and `model` HTTPS URLs. The resource buttons enable automatically. Empty URLs remain disabled and expose “Coming soon” in the tooltip and accessible label.

## Preview

Run `python3 -m http.server 8765` in this folder and open http://localhost:8765/.

## Design

Neutral black-and-white page layout with dark resource pills. The Amazon logo keeps its original colors. The title icon and favicon use the original blue-and-white robot holding a magnifying glass from the paper's main figure. Author links retain the reference page’s blue. Original scientific figures keep their native colors.

## Assets

- `evidence-credit.svg`: self-contained, chaptered animation with subtitles, pause/play, replay, seeking, and reduced motion support. Playback starts when the animation is visible and pauses when it leaves the screen.
- `evidence-credit.gif`: downloadable version of the same animation timeline.
- The animation reuses the original image, robot, token palette, and method artwork from slide 8. It follows image patches and question words into tokens, model input, latent rollout, paired answer readouts, differential credit, and visual supervision, then returns to the full original figure. Scenes settle long enough to read their subtitles. Every latent position retains a uniform baseline weight; highlighted positions receive stronger supervision.
- `evidence-credit-still.svg` opens the complete original figure. Pause/play and reduced motion are supported.
- Paper figures are taken from the author's ReaLVR manuscript.
- The animation is a conceptual schematic, not a measured attention trace.

Content corresponds to the 41-page arXiv manuscript preview dated September 25, 2026. Selected result rows retain the paper's numerical values. The 235B model is evaluated on three tasks only.
