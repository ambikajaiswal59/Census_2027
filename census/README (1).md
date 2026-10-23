# Census data — how it works and how to update it

The map boundaries and all the census figures (population, SC, ST, literates …)
come from two **shapefiles** (State and District). They are converted **once**
into small files the browser loads. Nothing else in the code has to change.

```
census/source/…shp            the original shapefiles (State + District)   ← you replace these
census/census.config.mjs      the ONE settings file                        ← you edit this
scripts/build-census.mjs      the converter (don't edit)
        │   npm run build:census
        ▼
public/data/census/states.geojson, districts.geojson   map boundaries
src/data/census/states.json, districts.json           figures per state / district
src/data/census/meta.json                              year + Parameters list
```

The generated files always have the **same names**, so the dashboard never needs
a code change when the data changes. Never edit the generated files by hand.

## One-time setup

```bash
npm i -D mapshaper
```

Add this line to `"scripts"` in `package.json`:

```json
"build:census": "node scripts/build-census.mjs"
```

Put the shapefiles under `census/source/` (keep each `.shp` with its `.dbf`,
`.shx`, `.prj`, `.cpg` next to it).

## When a NEW census arrives

1. Copy the new State and District shapefiles into `census/source/`
   (for example `census/source/2027/State/…` and `…/District/…`).
2. Open `census/census.config.mjs` and change:
   - `year` and `label` (for example `2027` and `"Census 2027"`)
   - `source.state` and `source.district` (the new `.shp` paths)
   - the column names under `state:` / `district:` and `parameters[].column`
     **only if** the new files name them differently
3. Run:
   ```bash
   npm run build:census
   ```
   It prints how many states / districts it found and the total population, so
   you can check the numbers at a glance. If something does not match (missing
   column, a district whose state can't be found) it stops and says exactly what
   to fix.
4. Restart `npm run dev` and look at the map and the table.

## Add or remove a Parameter

In `census/census.config.mjs`, edit the `parameters` list: one line per
Parameter — `key` (name used by the app), `label` (text in the sidebar),
`column` (column in the **District** file). Then run `npm run build:census`.
The sidebar updates by itself. State / UT figures are the sum of their districts.

## Fix a spelling difference

If a name in the file is spelled differently from what you want (or from the
directory API), add it under `nameFixes` in the config, for example
`"Tamilnadu": "Tamil Nadu"`.

## Good to know

- Boundary detail: `simplify` in the config (smaller % = smaller files, rougher
  borders). 2–3 % keeps the files around 1.4 MB in total.
- The big original shapefiles (about 70 MB) are only needed when you run the
  build; they are never sent to the browser. You can keep them out of git if you
  prefer — commit the generated files instead.
- The map and the table both read the generated files, so they always agree.
