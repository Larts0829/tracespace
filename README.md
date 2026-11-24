# TraceSpace

An AR-assisted tracing tool. Upload a reference image, open the camera, and the
image is overlaid on the live feed so you can trace it onto physical paper with
a pencil or pen. The phone is the projector; the drawing happens on the paper.

## Run locally

```bash
npm install
npm run dev          # http://localhost:5173
npm run dev:https    # HTTPS with a self-signed cert, for testing on a phone
npm run build        # type-check and production build
npm run preview      # serve the production build
```

## Deploy to GitHub Pages

Pushing to `main` builds the site and deploys it to GitHub Pages. After the
first successful deployment, open
`https://larts0829.github.io/tracespace/`. Camera access works over this HTTPS
URL.

Camera access requires HTTPS or `localhost`. For a phone on your Wi-Fi, use
`npm run dev:https`, open the printed network URL, and accept the self-signed
certificate warning.

## Features

- **Home**: Start Tracing (resumes the most recent project), upload, drag-and-drop,
  recent projects with thumbnails, rename, delete, and a how-it-works guide
  shown on first visit.
- **Preview / prepare**: opacity, zoom, rotation, mirror, vertical flip,
  grayscale, fit and reset, plus drag, pinch and twist on the preview.
- **Tracing workspace**: rear camera (switches between cameras where the
  browser lists more than one), camera pause and resume, a collapsible control
  panel, lock, mirror, flip, grayscale, rotate, zoom, reset, focus mode (hides
  all chrome), and browser fullscreen.
- **Gestures**: one finger drags, two fingers pinch, zoom and twist together.
  The workspace uses `touch-action: none`, so the page does not scroll while
  you adjust.
- **Desktop**: mouse drag, mouse-wheel zoom, keyboard shortcuts.
- **Projects**: stored locally in IndexedDB (metadata and image blobs in separate
  stores). Changes autosave with a short debounce and flush when you leave a
  screen. No account or backend.

## Keyboard shortcuts (tracing workspace)

| Key | Action |
| --- | --- |
| Arrow keys | Nudge 2 px (hold Shift for 12 px) |
| `+` / `-` | Zoom in / out |
| `[` / `]` | Rotate ∓5° / ±5° |
| `M` | Mirror horizontally |
| `V` | Flip vertically |
| `G` | Toggle grayscale |
| `L` | Lock / unlock |
| `R` | Reset |
| `F` | Fullscreen |
| `H` | Focus mode (hide controls) |
| `C` | Pause / resume camera |
| `Esc` | Leave focus mode, or exit tracing |

## Limitations

- **iOS Safari** does not allow the Fullscreen API on arbitrary elements. The
  fullscreen button is hidden where the browser reports it unavailable. Focus
  mode still gives an immersive view.
- **HEIC** photos from iPhones are not decodable in most desktop browsers.
  Convert them to JPG first, or export from Photos as JPEG.
- **Crop** is not implemented. Fit and zoom cover framing, and the overlay can
  be partly off-screen without issue. A true crop tool would need a canvas
  pipeline and is a reasonable next step.
- **Camera zoom and exposure** are controlled by the OS camera driver, which
  the browser does not expose consistently. The app's zoom scales the overlay
  only.
- **Projects** live in the browser's storage for this origin. Clearing site
  data deletes them. Use `navigator.storage.persist()` or add export/import if
  that matters for your users.
- **Fonts** use the system stack (Inter if installed) to avoid a network
  dependency.

## Project structure

```
src/
  App.tsx                     view routing, import flow, project list state
  types.ts                    shared types and default transform
  lib/
    db.ts                     IndexedDB wrapper
    image.ts                  upload validation, ids, date formatting
    math.ts                   geometry helpers for gestures
  hooks/
    useCamera.ts              getUserMedia lifecycle, device switching, errors
    useProjectTransform.ts    transform state with debounced autosave
    useObjectUrl.ts           Blob → object URL with cleanup
  components/
    OverlayImage.tsx          the draggable, rotatable overlay (pointer + wheel)
    TracingWorkspace.tsx      camera workspace and controls
    ProjectEditor.tsx         pre-trace preview and adjustments
    HomeScreen.tsx, ProjectCard.tsx, Onboarding.tsx
    Slider.tsx, IconButton.tsx, ToolTile.tsx, Logo.tsx
  styles/index.css            Tailwind layers and component classes
```

## Testing checklist

Run through this on a phone over HTTPS:

1. Upload an image → it opens in the editor.
2. Start tracing → the rear camera starts and the image sits above the feed.
3. Drag with one finger, pinch to zoom, twist to rotate.
4. Move the opacity slider down to 10% and back to 100%.
5. Lock → drag, pinch and rotate do nothing; opacity still changes.
6. Pause the camera, resume it, and exit. Confirm the camera light goes off.
7. Reopen the project from Home → the position and adjustments are restored.
8. Deny camera permission → the error card appears and the app keeps working.
