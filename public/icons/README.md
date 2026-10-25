# Icons — REPLACE BEFORE PLAY STORE SUBMISSION

These four files are placeholders generated during Phase 1.7 so the
PWA manifest, favicon, and splash screen have real files to point
to. They are visually minimal and MUST be replaced before uploading
the TWA to Play Console.

## Required files and sizes

| Path                          | Size    | Used by                              |
|-------------------------------|---------|--------------------------------------|
| /LQ-64.png                    | 64×64   | index.html favicon                   |
| /LQ-192.png                   | 192×192 | index.html apple-touch-icon, manifest |
| /logo.png                     | 512×512 | SplashScreen.tsx, manifest           |
| /icons/maskable-512.png       | 512×512 | manifest maskable (safe zone 80%)    |

## Replace procedure

1. Export the LeanIQA logo at each size above (PNG, transparent
   background where appropriate, use the same lime-on-dark treatment
   as Logo.tsx).
2. For maskable-512.png, keep the logo inside the central 80% of
   the canvas so Android's circular crop does not cut it.
3. Overwrite the files in this folder and /public/ at the same paths.
4. Run `npm run build` — the hashes will change but nothing else.

## How to check maskable safe zone

Open /icons/maskable-512.png in an image editor. Draw a circle
centered at (256, 256) with radius 180 (the "safe zone"). The logo
must fit entirely inside that circle.