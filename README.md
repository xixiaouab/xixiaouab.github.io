# Xi Xiao · Academic homepage

Source for [xixiaouab.github.io](https://xixiaouab.github.io/), Xi Xiao's academic homepage and research project pages.

The site presents research in foundation model post-training, multimodal reasoning, agentic AI, and scientific AI, together with publications, experience, and academic service.

## Repository structure

| Path | Purpose |
| --- | --- |
| `docs/_layouts/index.html` | Homepage content and publication entries |
| `docs/static/minimal-home.css` | Homepage and publication styles |
| `docs/js/main.js` | News scrolling, publication figures, and citation display |
| `docs/other-publications.html` | Complete publication archive |
| `docs/projects/` | Research project pages |
| `docs/images/` | Profile, institution, and publication images |
| `docs/files/Xi_Xiao_CV.pdf` | Public CV |
| `docs/data/scholar_citations.json` | Citation data used by the homepage |
| `scripts/update_scholar_citations.py` | Citation-data update script |

## Local preview

The homepage uses Jekyll and the GitHub Pages dependencies listed in `docs/Gemfile`. With Ruby and Bundler installed:

```bash
git clone https://github.com/xixiaouab/xixiaouab.github.io.git
cd xixiaouab.github.io/docs
bundle install
bundle exec jekyll serve
```

Open the local URL printed by Jekyll, usually `http://127.0.0.1:4000`.

## Maintaining the site

- Edit the homepage in `docs/_layouts/index.html`; `docs/index.markdown` selects that layout.
- Keep publication titles, authors, venues, and resource links consistent with the paper records.
- Add project assets under their existing project folders and retain their source credits.
- Update the stylesheet version query when changing cached CSS.
- Keep the public CV and the linked homepage version synchronized.

The `Update Scholar Citations` workflow refreshes the citation JSON daily and can also be run manually. It reads the `SERPAPI_KEY` repository secret; credentials should remain in GitHub Actions secrets.

## Credits

Template and project-page credits are retained in the website footers and individual project pages. Paper PDFs, figures, and other research materials retain their respective authorship and license notices.
