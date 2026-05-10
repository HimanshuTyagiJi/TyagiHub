FONTS — DOWNLOAD INSTRUCTIONS
==============================

TyagiHub uses 3 font families, all served locally (no CDN).

FONTS REQUIRED:
---------------

1. Outfit (body text)
   Download: https://fonts.google.com/specimen/Outfit
   Files needed:
     - Outfit-Regular.woff2
     - Outfit-Medium.woff2
     - Outfit-SemiBold.woff2
     - Outfit-Bold.woff2

2. Space Grotesk (display/headings)
   Download: https://fonts.google.com/specimen/Space+Grotesk
   Files needed:
     - SpaceGrotesk-Regular.woff2
     - SpaceGrotesk-Medium.woff2
     - SpaceGrotesk-SemiBold.woff2
     - SpaceGrotesk-Bold.woff2

3. JetBrains Mono (code/mono)
   Download: https://www.jetbrains.com/lp/mono/ or GitHub
   Files needed:
     - JetBrainsMono-Regular.woff2
     - JetBrainsMono-Medium.woff2

HOW TO DOWNLOAD WOFF2 FILES:
-----------------------------
Option A — Google Fonts Helper (easiest):
  1. Go to https://gwfh.mranftl.com/fonts
  2. Search each font
  3. Select woff2 format only
  4. Download and place in this folder (/assets/fonts/)

Option B — Manual:
  1. Go to fonts.google.com
  2. Select the font → Download family
  3. Use a tool like fonttools or online converter to make woff2
  4. Place in this folder

FALLBACK:
---------
If fonts are not downloaded, the CSS falls back to system fonts:
  - Body:    sans-serif
  - Display: sans-serif
  - Mono:    monospace

The site will still work without the font files.
