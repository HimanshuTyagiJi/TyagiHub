IMAGES FOLDER
=============
Naming convention:
  logo.svg            - Main wordmark logo
  favicon.svg         - SVG favicon
  favicon.ico         - ICO favicon (generate from SVG)
  apple-touch-icon.png - 180x180 PNG for iOS
  icon-192.png        - PWA icon 192x192
  icon-512.png        - PWA icon 512x512
  og-default.jpg      - OpenGraph fallback image (1200x630)

OG Image spec:
  - Size: 1200x630 pixels
  - Include TyagiHub logo + tagline
  - Save as og-default.jpg

Tools to generate PNG/ICO from SVG:
  - https://realfavicongenerator.net (use favicon.svg as input)
  - Or use ImageMagick: convert favicon.svg -resize 192x192 icon-192.png
