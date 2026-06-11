VENDOR LIBRARIES — TyagiHub Tools
===================================
All Open Source. MIT / Apache 2.0. NO CDN in production.

================================================================
1. PDF-LIB (MIT License)
   Required for: PDF Compress, Merge, Split, Rotate, Protect, Unlock, JPG to PDF
   GitHub: https://github.com/Hopding/pdf-lib
================================================================
Download URL:
  https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js

Place at:
  /assets/vendor/pdf-lib/pdf-lib.min.js

Status: [ ] DOWNLOAD REQUIRED

================================================================
2. PDF.JS — Mozilla (Apache 2.0 License)
   Required for: PDF to JPG tool only
   GitHub: https://github.com/mozilla/pdf.js
================================================================
Download: https://github.com/mozilla/pdf.js/releases/latest
Get pdfjs-X.X-dist.zip, extract:
  build/pdf.min.js        → /assets/vendor/pdfjs/pdf.min.js
  build/pdf.worker.min.js → /assets/vendor/pdfjs/pdf.worker.min.js

Status: [ ] DOWNLOAD REQUIRED (optional — only for PDF to JPG)

================================================================
All other tools (Compress, Merge, Split, Rotate, Protect,
Unlock, JPG to PDF) work with pdf-lib only.
