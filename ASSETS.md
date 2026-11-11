# ASSETS - camera imagery

The camera views use still photographs (cropped to 16:9, resized to 1280×720, JPEG-optimised, ~1 MB total) in `public/cameras/`.
All come from **Pexels**, used under the [Pexels License](https://www.pexels.com/license/): free for commercial use, no attribution required.

| File | Pexels photo |
|---|---|
| `gate.jpg` | https://www.pexels.com/photo/construction-workers-in-orange-vests-walking-28906308/ |
| `slab.jpg` | https://www.pexels.com/photo/men-working-in-a-construction-site-2383650/ |
| `tower.jpg` | https://www.pexels.com/photo/construction-workers-on-the-building-site-10202865/ |
| `rigging.jpg` | https://www.pexels.com/photo/construction-workers-at-industrial-site-in-action-30223853/ |
| `formwork.jpg` | https://www.pexels.com/photo/construction-workers-working-on-a-construction-site-9964624/ |
| `haul.jpg` | https://www.pexels.com/photo/two-people-walking-on-a-construction-site-8961261/ |
| `welding.jpg` | https://www.pexels.com/photo/industrial-welder-in-action-with-sparks-flying-34039390/ |

## Important before external use
- The photos show real, in some cases identifiable, people. The Pexels License restricts depicting identifiable people in a way that could be demeaning or imply endorsement. The product UI labels some of them as "violations" - fine for an internal or closed client review, but **replace these frames with the client's own footage, consented images, or non-identifiable material before any public release**.
- The AI overlays (boxes, track IDs, PPE results, violations) are scripted and placed by hand over these images. They are not produced by computer vision.
- To swap an image: replace the file in `public/cameras/` and re-place the boxes for that camera in `src/mock/actors.ts` (percent of frame).
