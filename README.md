# The World in One Page — Tuesday 24 November 2026

[![make.fun](https://make.fun/badge/news-image-20261124.svg)](https://make.fun/bounty/news-image-20261124)
[![rank](https://make.fun/badge/news-image-20261124/Loireweast/news-image-20261124-entry/rank.svg)](https://make.fun/bounty/news-image-20261124)
[![reward](https://make.fun/badge/news-image-20261124/Loireweast/news-image-20261124-entry/reward.svg)](https://make.fun/bounty/news-image-20261124)

A newspaper front page summing up the world's news of **Tuesday 24 November 2026** in one image — an entry for the [make.fun news-image-20261124 bounty](https://make.fun/bounty/news-image-20261124).

Lead story: Putin vows retaliation as Ukraine keeps striking Russian oil refineries despite Trump's plea. Also inside: the overnight strike on Zaporizhzhia, Israeli strikes in Gaza, Malaysia's repatriation of 6,803 Myanmar nationals, the UK's sabotage warning to Ukraine's suppliers, a Russian drone over Poland, Russian jets in Seoul's air zone, Asian markets surging, and the day's ticker.

## How it is made

- `tools/scene.html` — the front page, written fresh in this session (HTML + CSS + one inline SVG illustration).
- `tools/render.mjs` — renders the page to `entry.png` with headless Chrome over the DevTools pipe.
- `main.ts` — the entry program (Node 22, stdlib only): copies `entry.png` to `$MAKEFUN_OUTPUT_DIR/entry.png`. Deterministic — the same bytes on every run.

Run it: `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`

## License

MIT — see [LICENSE](LICENSE).
