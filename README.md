# ML Infomap — React + Tailwind

A React (Vite) + Tailwind CSS conversion of the original static HTML page.

## Getting started

```bash
npm install
npm run dev       # start dev server
npm run build     # production build to dist/
npm run preview   # preview the production build
```

## Folder structure

```
ml-infomap/
├── index.html                  # Vite entry HTML (fonts + Tabler icons CDN)
├── tailwind.config.js          # design tokens (colors, fonts, shadows) mapped from the original CSS vars
├── postcss.config.js
├── vite.config.js
├── public/
│   └── images/
│       └── ML_Info_Icon.png    # logo (placeholder — swap with the real logo)
└── src/
    ├── main.jsx                 # React root
    ├── index.css                # Tailwind directives + small custom utilities (btn shimmer)
    ├── App.jsx                  # thin shell — just renders the Home page
    ├── pages/
    │   └── Home.jsx              # page composition: layout, scroll refs, modal state
    ├── data/
    │   ├── phaseData.js          # Census 2027 phase content (timeline + modal)
    │   └── sampleData.js         # directory demo rows, hierarchy trees, hero stats
    └── components/
        ├── Header.jsx            # sticky nav + mobile menu
        ├── Button.jsx            # reusable primary/secondary CTA button
        ├── Hero.jsx               # headline + snapshot card
        ├── StatCard.jsx           # reusable stat tile (used 4x in the snapshot card)
        ├── PhaseTimeline.jsx      # renders the 3 PhaseCards
        ├── PhaseCard.jsx          # single timeline entry
        ├── PhaseModal.jsx         # "Show more" detail popup
        ├── TreeList.jsx           # reusable label/value list (used for hierarchy + local body blocks)
        ├── DirectoryExplorer.jsx  # search/level/sort controls + results table
        └── Footer.jsx

```

## Notes on the conversion

- All inline `<style>` CSS has been translated to Tailwind utility classes; the few effects that
  don't map cleanly to utilities (button hover shimmer, modal enter animation) live in
  `src/index.css` under `@layer components` / `tailwind.config.js` `keyframes`.
- Repeated markup was extracted into components: the 4 hero stat tiles → `StatCard`, the 3 census
  phases → `PhaseCard` (driven by `phaseData.js`), and the two label/value trees in the directory
  panel → `TreeList`.
- The directory search/filter/sort table and the "Show more" modal are now driven by React state
  instead of direct DOM manipulation.
- Tabler Icons and Google Fonts are loaded via the same CDN links as the original page (declared in
  `index.html`).
- Replace `public/images/ML_Info_Icon.png` with the real logo file — a placeholder is included so
  the build runs out of the box.
