# MBA Finance Study Hub

Static, mobile-first study site (notes, mind maps, practice, 70-Q/90-min mock) for the DY Patil Online MBA (Finance).

- `content/catalog.json` lists semesters and subjects. Set `"live": true` to publish a subject.
- `content/<sem>/<subject>/` holds `subject.json`, `bank.js` (questions), `notes/*.md`, `mindmaps/*.html`.
- `node build.js` (needs pandoc) writes the site into `public/`.
- Hosting: Cloudflare Workers (project `mba-finance`, static assets). Pushes to `main` run `npx wrangler deploy`, which serves `public/` per `wrangler.jsonc`. Pull requests get a preview build (`npx wrangler preview`, needs the `previews` block).
