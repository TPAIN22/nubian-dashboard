/**
 * Runs after `next build` (npm `postbuild`).
 *
 * `output: "standalone"` emits a self-contained server in .next/standalone,
 * but by design it leaves out `public/` and `.next/static/` — those are
 * expected to come from a CDN. We serve them from the same process, so copy
 * them into place. Without this step the server starts but every image,
 * font, and client chunk 404s.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const standalone = path.join(root, ".next", "standalone");

if (!fs.existsSync(path.join(standalone, "server.js"))) {
  console.error(
    '[prepare-standalone] .next/standalone/server.js is missing. Is `output: "standalone"` set in next.config.ts?',
  );
  process.exit(1);
}

const copies = [
  [path.join(root, "public"), path.join(standalone, "public")],
  [path.join(root, ".next", "static"), path.join(standalone, ".next", "static")],
];

for (const [from, to] of copies) {
  if (!fs.existsSync(from)) continue;
  fs.rmSync(to, { recursive: true, force: true });
  fs.cpSync(from, to, { recursive: true });
  console.log(`[prepare-standalone] ${path.relative(root, from)} -> ${path.relative(root, to)}`);
}
