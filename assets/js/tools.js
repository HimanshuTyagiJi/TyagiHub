/**
 * TyagiHub Tools — JavaScript Master Engine
 * Tyagi MultiTech
 * ============================================================
 * File: assets/js/tools.js
 * Feature: Smart Dual-View Router Injection Layer.
 * - Global View (/tools/): No subsections headers anywhere. Simple truncated single row grid.
 * - Dedicated PDF Page (/tools/pdf/): 4 Explicit clean subsections grids showing all 24 tools.
 * Rules: Laptop layout = 6 cards per row max. Mobile layout = 2 cards per row (4 total).
 * ============================================================
 */

'use strict';

/* ============================================================
   SVG ICONS LIBRARY (All original icons restored completely)
   ============================================================ */
const ICONS = {
  // PDF Icons
  pdftoword: `<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  editpdf: `<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  scandoc: `<svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`,
  offlinescantopdf: `<svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="3"/><path d="M12 10v3l1.5 1.5"/></svg>`,
  createpdf: `<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="12" x2="12" y2="18"/><line x1="9" y1="15" x2="15" y2="15"/></svg>`,
  redact: `<svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
  signature: `<svg viewBox="0 0 24 24"><path d="M3 17c3.33-3.33 5-5 5-8a4 4 0 0 1 8 0c0 3-1.34 4.68-2.67 6.33L12 17"/><path d="M5 21h14"/><circle cx="18" cy="8" r="3"/></svg>`,
  protect: `<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  unlock: `<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>`,
  watermark: `<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>`,
  grayscale: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20"/></svg>`,
  merge: `<svg viewBox="0 0 24 24"><path d="M8 6H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"/><path d="M16 6h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3"/><line x1="12" y1="3" x2="12" y2="21"/></svg>`,
  split: `<svg viewBox="0 0 24 24"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/><path d="m15 9 6-6"/></svg>`,
  removepage: `<svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
  reorder: `<svg viewBox="0 0 24 24"><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>`,
  extractpage: `<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="9 15 12 18 15 15"/><line x1="12" y1="12" x2="12" y2="18"/></svg>`,
  imgcrop: `<svg viewBox="0 0 24 24"><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg>`,
  headerfooter: `<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><rect x="4" y="4" width="16" height="3" rx="0.5" fill="currentColor" opacity="0.4"/><rect x="4" y="17" width="16" height="3" rx="0.5" fill="currentColor" opacity="0.4"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
  rotate: `<svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
  pdftojpg: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  jpgtopdf: `<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><rect x="3" y="3" width="8" height="6" rx="1"/></svg>`,
  compress: `<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  repair: `<svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
  metadata: `<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><rect x="8" y="16" width="4" height="2" rx="1"/></svg>`,
  ocrpdf: `<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="2" ry="2"/><line x1="7" y1="7" x2="17" y2="7"/><line x1="7" y1="11" x2="17" y2="11"/><line x1="7" y1="15" x2="13" y2="15"/></svg>`,

  // IMAGE
  imgcompress: `<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  imgresize: `<svg viewBox="0 0 24 24"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
  imgconvert: `<svg viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>`,
  bgremove: `<svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`,
  imgfilter: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`,
  imgflip: `<svg viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`,
  watermarkimg: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>`,
  imgtotext: `<svg viewBox="0 0 24 24"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="8" x2="12" y2="16"/></svg>`,
  colorpicker: `<svg viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/><circle cx="8" cy="10" r="1"/><circle cx="12" cy="7" r="1"/><circle cx="16" cy="10" r="1"/></svg>`,
  meme: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`,

  // CONVERT
  wordtopdf: `<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13h6"/><path d="M9 17h6"/><path d="M9 9h1"/></svg>`,
  pptopdf: `<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
  exceltopdf: `<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="12" y1="9" x2="12" y2="21"/></svg>`,
  htmltopdf: `<svg viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  pngtojpg: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  jpgtopng: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  pngtowebp: `<svg viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>`,
  webptopng: `<svg viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>`,
  svgtopng: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  imgtopdf2: `<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><rect x="3" y="3" width="8" height="5" rx="1"/></svg>`,
  mp4tomp3: `<svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
  mp3towav: `<svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,

  // VIDEO
  vidcompress: `<svg viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`,
  vidconvert: `<svg viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/><polyline points="1 4 1 10 7 10"/></svg>`,
  vidtrim: `<svg viewBox="0 0 24 24"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>`,
  vidtogif: `<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>`,
  screenshot: `<svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`,
  vidaudio: `<svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,

  // AUDIO
  audioconvert: `<svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  audiotrim: `<svg viewBox="0 0 24 24"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/></svg>`,
  audiovolume: `<svg viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`,
  audiomerge: `<svg viewBox="0 0 24 24"><path d="M8 6H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"/><path d="M16 6h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3"/><line x1="12" y1="3" x2="12" y2="21"/></svg>`,

  // TEXT & SECURITY
  wordcount: `<svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="15" y2="18"/></svg>`,
  caseconv: `<svg viewBox="0 0 24 24"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>`,
  removeextraspaces: `<svg viewBox="0 0 24 24"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>`,
  lorem: `<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="8" y1="9" x2="10" y2="9"/></svg>`,
  textdiff: `<svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  passgen: `<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  qrgen: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/><rect x="4" y="4" width="3" height="3"/><rect x="17" y="4" width="3" height="3"/><rect x="4" y="17" width="3" height="3"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><line x1="21" y1="21" x2="21" y2="21"/><path d="M11 3H9v2h2V3z"/><path d="M11 7H9v2h2V7z"/><path d="M11 11H9v2h2v-2z"/><path d="M11 15H9v2h2v-2z"/></svg>`,
  hashgen: `<svg viewBox="0 0 24 24"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>`,
  base64: `<svg viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  urlenc: `<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`
};

/* ============================================================
   TOOLS DATA ARRAY (24 PDF Tools with subcategories mapped)
   ============================================================ */
const TOOLS_DATA = [
  // 🎯 SLOT #1 LOCK: EDIT PDF ONLINE ALWAYS FIRST
  { id: 'pdf-edit', name: 'Edit PDF Online', icon: 'editpdf', cat: 'pdf', subcat: 'convert', url: '/tools/pdf/edit/', color: '#f5a623', bg: 'rgba(245,166,35,0.04)', isNew: true },
  
  // PDF - Creation & Convert Subcategory
  { id: 'pdf-to-word-ppt', name: 'PDF to Word & PPT', icon: 'pdftoword', cat: 'pdf', subcat: 'convert', url: '/tools/pdf/to-word-ppt/', color: '#f5a623', bg: 'rgba(245,166,35,0.04)' },
  { id: 'scan-to-doc', name: 'Scan to Document', icon: 'scandoc', cat: 'pdf', subcat: 'convert', url: '/tools/pdf/scan-to-document/', color: '#f5a623', bg: 'rgba(245,166,35,0.04)', isNew: true },
  { id: 'create-pdf', name: 'Create PDF Online', icon: 'createpdf', cat: 'pdf', subcat: 'convert', url: '/tools/pdf/create/', color: '#f5a623', bg: 'rgba(245,166,35,0.04)', isNew: true },
  { id: 'pdf-ocr', name: 'OCR PDF Online', icon: 'ocrpdf', cat: 'pdf', subcat: 'convert', url: '/tools/pdf/ocr-pdf/', color: '#f5a623', bg: 'rgba(245,166,35,0.04)', isNew: true },

  // PDF - Security, Privacy & Overlays Subcategory
  { id: 'pdf-redact', name: 'Search & Redact PDF', icon: 'redact', cat: 'pdf', subcat: 'security', url: '/tools/pdf/redact/', color: '#f5a623', bg: 'rgba(245,166,35,0.04)', isNew: true },
  { id: 'pdf-signature-stamp', name: 'Signature & Stamp PDF', icon: 'signature', cat: 'pdf', subcat: 'security', url: '/tools/pdf/signature-stamp/', color: '#f5a623', bg: 'rgba(245,166,35,0.04)', isNew: true },
  { id: 'pdf-protect', name: 'Protect PDF with Password', icon: 'protect', cat: 'pdf', subcat: 'security', url: '/tools/pdf/protect/', color: '#f5a623', bg: 'rgba(245,166,35,0.04)' },
  { id: 'pdf-unlock', name: 'Unlock Password Protected PDF', icon: 'unlock', cat: 'pdf', subcat: 'security', url: '/tools/pdf/unlock/', color: '#f5a623', bg: 'rgba(245,166,35,0.04)' },
  { id: 'pdf-watermark', name: 'Add Watermark to PDF', icon: 'watermark', cat: 'pdf', subcat: 'security', url: '/tools/pdf/watermark/', color: '#f5a623', bg: 'rgba(245,166,35,0.04)' },
  { id: 'pdf-grayscale', name: 'Convert PDF to Grayscale', icon: 'grayscale', cat: 'pdf', subcat: 'security', url: '/tools/pdf/grayscale/', color: '#f5a623', bg: 'rgba(245,166,35,0.04)' },

  // PDF - Page Manipulation & Organizing Subcategory
  { id: 'pdf-merge', name: 'Merge PDF Files', icon: 'merge', cat: 'pdf', subcat: 'organize', url: '/tools/pdf/merge/', color: '#f5a623', bg: 'rgba(245,166,35,0.04)' },
  { id: 'pdf-split', name: 'Split PDF Pages', icon: 'split', cat: 'pdf', subcat: 'organize', url: '/tools/pdf/split/', color: '#f5a623', bg: 'rgba(245,166,35,0.04)' },
  { id: 'pdf-remove-pg', name: 'Remove PDF Pages', icon: 'removepage', cat: 'pdf', subcat: 'organize', url: '/tools/pdf/remove-pages/', color: '#f5a623', bg: 'rgba(245,166,35,0.04)' },
  { id: 'pdf-reorder', name: 'Reorder PDF Pages', icon: 'reorder', cat: 'pdf', subcat: 'organize', url: '/tools/pdf/reorder-pages/', color: '#f5a623', bg: 'rgba(245,166,35,0.04)' },
  { id: 'pdf-extract-pg', name: 'Extract Pages from PDF', icon: 'extractpage', cat: 'pdf', subcat: 'organize', url: '/tools/pdf/extract-pages/', color: '#f5a623', bg: 'rgba(245,166,35,0.04)' },
  { id: 'pdf-crop', name: 'Crop PDF Pages Online', icon: 'imgcrop', cat: 'pdf', subcat: 'organize', url: '/tools/pdf/crop/', color: '#f5a623', bg: 'rgba(245,166,35,0.04)', isNew: true },
  { id: 'pdf-header-footer', name: 'Add Header & Footer to PDF', icon: 'headerfooter', cat: 'pdf', subcat: 'organize', url: '/tools/pdf/header-footer/', color: '#f5a623', bg: 'rgba(245,166,35,0.04)', isNew: true },
  { id: 'pdf-rotate', name: 'Rotate PDF Pages Online', icon: 'rotate', cat: 'pdf', subcat: 'organize', url: '/tools/pdf/rotate/', color: '#f5a623', bg: 'rgba(245,166,35,0.04)' },

  // PDF - Conversion & Optimization Diagnostics Subcategory
  { id: 'pdf-to-image', name: 'Convert PDF to Image', icon: 'pdftojpg', cat: 'pdf', subcat: 'optimize', url: '/tools/pdf/to-image/', color: '#f5a623', bg: 'rgba(245,166,35,0.04)' },
  { id: 'img-to-pdf', name: 'Convert Image to PDF (OCR)', icon: 'jpgtopdf', cat: 'pdf', subcat: 'optimize', url: '/tools/pdf/image-to-pdf/', color: '#f5a623', bg: 'rgba(245,166,35,0.04)' },
  { id: 'pdf-compress', name: 'Compress PDF Online', icon: 'compress', cat: 'pdf', subcat: 'optimize', url: '/tools/pdf/compress/', color: '#f5a623', bg: 'rgba(245,166,35,0.04)' },
  { id: 'pdf-repair', name: 'Repair Corrupted PDF File', icon: 'repair', cat: 'pdf', subcat: 'optimize', url: '/tools/pdf/repair/', color: '#f5a623', bg: 'rgba(245,166,35,0.04)', isNew: true },
  { id: 'pdf-metadata', name: 'Edit PDF Metadata Properties', icon: 'metadata', cat: 'pdf', subcat: 'optimize', url: '/tools/pdf/metadata/', color: '#f5a623', bg: 'rgba(245,166,35,0.04)', isNew: true },

  // IMAGE
  { id: 'img-bg-remove', name: 'Remove Background', icon: 'bgremove', cat: 'image', url: '/tools/image/remove-background/', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', isNew: true },
  { id: 'img-compress', name: 'Compress Image', icon: 'imgcompress', cat: 'image', url: '/tools/image/compress/', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  { id: 'img-convert', name: 'Convert Image', icon: 'imgconvert', cat: 'image', url: '/tools/image/convert/', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  { id: 'img-editor', name: 'Image Editor', icon: 'imgfilter', cat: 'image', url: '/tools/image/editor/', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', isNew: true },
  { id: 'img-to-text', name: 'Image to Text', icon: 'imgtotext', cat: 'image', url: '/tools/image/image-to-text/', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', isNew: true },
  { id: 'img-watermark', name: 'Add Watermark', icon: 'watermarkimg', cat: 'image', url: '/tools/image/watermark/', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  { id: 'meme-maker', name: 'Meme Maker', icon: 'meme', cat: 'image', url: '/tools/image/meme-maker/', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', isNew: true },
  { id: 'thumbnail-maker', name: 'Thumbnail Maker', icon: 'meme', cat: 'image', url: '/tools/image/thumbnail-maker/', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', isNew: true },
  { id: 'passport-photo', name: 'Passport Photo Maker', icon: 'imgcrop', cat: 'image', url: '/tools/image/passport-photo-maker/', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', isNew: true },
  { id: 'ai-image', name: 'AI Image Tools', icon: 'imgfilter', cat: 'image', url: '/tools/image/ai-tools/', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', isNew: true },

  // CONVERT
  { id: 'img-convert', name: 'Image convert', icon: 'pngtojpg', cat: 'convert', url: '/tools/convert/image-convert/', color: '#3ecfcf', bg: 'rgba(62,207,207,0.1)' },
  { id: 'audio-convert', name: 'Audio convert', icon: 'mp3towav', cat: 'convert', url: '/tools/convert/audio-convert/', color: '#3ecfcf', bg: 'rgba(62,207,207,0.1)' },
  { id: 'video-convert', name: 'Video convert', icon: 'mp4tomp3', cat: 'convert', url: '/tools/convert/video-convert/', color: '#3ecfcf', bg: 'rgba(62,207,207,0.1)' },
  { id: 'unit-convert', name: 'Unit convert', icon: 'jpgtopng', cat: 'convert', url: '/tools/convert/unit-convert/', color: '#3ecfcf', bg: 'rgba(62,207,207,0.1)' },
  { id: 'text-convert', name: 'Text convert', icon: 'textdiff', cat: 'convert', url: '/tools/convert/text/', color: '#3ecfcf', bg: 'rgba(62,207,207,0.1)' },
  
  // VIDEO
  { id: 'create-video', name: 'Create Video', icon: 'vidconvert', cat: 'video', url: '/tools/video/create-video/', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', isNew: true },
  { id: 'vid-editor', name: 'Video Editor', icon: 'vidtrim', cat: 'video', url: '/tools/video/editor/', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', isNew: true },
  { id: 'vid-compress', name: 'Compress Video', icon: 'vidcompress', cat: 'video', url: '/tools/video/compress/', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  { id: 'vid-convert', name: 'Convert Video', icon: 'vidconvert', cat: 'video', url: '/tools/video/convert/', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  { id: 'vid-to-gif', name: 'Video to GIF', icon: 'vidtogif', cat: 'video', url: '/tools/video/video-to-gif/', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', isNew: true },
  { id: 'vid-audio', name: 'Extract Audio', icon: 'vidaudio', cat: 'video', url: '/tools/video/extract-audio/', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },

  // AUDIO
  { id: 'audio-editor', name: 'Audio Editor', icon: 'audiotrim', cat: 'audio', url: '/tools/audio/editor/', color: '#34d399', bg: 'rgba(52,211,153,0.1)', isNew: true },
  { id: 'audio-convert', name: 'Convert Audio', icon: 'audioconvert', cat: 'audio', url: '/tools/audio/convert/', color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
  { id: 'audio-merge', name: 'Merge Audio', icon: 'audiomerge', cat: 'audio', url: '/tools/audio/merge/', color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
  { id: 'audio-recorder', name: 'Voice Recorder', icon: 'audiovolume', cat: 'audio', url: '/tools/audio/voice-recorder/', color: '#34d399', bg: 'rgba(52,211,153,0.1)', isNew: true },
  { id: 'audio-remove-noise', name: 'Remove Noise', icon: 'audiovolume', cat: 'audio', url: '/tools/audio/remove-noise/', color: '#34d399', bg: 'rgba(52,211,153,0.1)', isNew: true },
  { id: 'audio-extract', name: 'Extract Audio', icon: 'audioconvert', cat: 'audio', url: '/tools/audio/extract-audio/', color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
  { id: 'text-to-audio', name: 'Text to Audio', icon: 'audioconvert', cat: 'audio', url: '/tools/audio/text-to-audio/', color: '#34d399', bg: 'rgba(52,211,153,0.1)', isNew: true },
  { id: 'audio-to-text', name: 'Audio to Text', icon: 'audioconvert', cat: 'audio', url: '/tools/audio/audio-to-text/', color: '#34d399', bg: 'rgba(52,211,153,0.1)', isNew: true },
  { id: 'audio-effects', name: 'Audio Effects', icon: 'audiovolume', cat: 'audio', url: '/tools/audio/audio-effects/', color: '#34d399', bg: 'rgba(52,211,153,0.1)', isNew: true },

  // TEXT
  { id: 'word-counter', name: 'Word Counter', icon: 'wordcount', cat: 'text', url: '/tools/text/word-counter/', color: '#fb923c', bg: 'rgba(251,146,60,0.1)' },
  { id: 'case-convert', name: 'Case convert', icon: 'caseconv', cat: 'text', url: '/tools/text/case-convert', color: '#fb923c', bg: 'rgba(251,146,60,0.1)' },
  { id: 'remove-extra-spaces', name: 'Remove Extra Spaces', icon: 'removeextraspaces', cat: 'text', url: '/tools/text/remove-extra-spaces/', color: '#fb923c', bg: 'rgba(251,146,60,0.1)' },
  { id: 'text-diff', name: 'Text Compare', icon: 'textdiff', cat: 'text', url: '/tools/text/text-compare', color: '#fb923c', bg: 'rgba(251,146,60,0.1)' },

  // SECURITY & UTILITIES
  { id: 'pass-gen', name: 'Password Gen', icon: 'passgen', cat: 'security', url: '/tools/security/password-generator/', color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  { id: 'hash-gen', name: 'Hash Generator', icon: 'hashgen', cat: 'security', url: '/tools/security/hash-generator/', color: '#f87171', bg: 'rgba(248,113,113,0.1)', isNew: true },
  { id: 'url-encode', name: 'URL Encoder', icon: 'urlenc', cat: 'utilities', url: '/tools/utilities/url-encoder-decoder/', color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  { id: 'base64', name: 'Base64 Tool', icon: 'base64', cat: 'utilities', url: '/tools/utilities/base64-encoder-decoder/', color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  { id: 'qr-gen', name: 'QR Generator', icon: 'qrgen', cat: 'utilities', url: '/tools/utilities/qr-generator/', color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
];

/* ============================================================
   STATE MANAGEMENT
   ============================================================ */
const FAVORITES_KEY = 'th-tool-favorites';
let favorites = new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'));
let pageContext = document.querySelector('.tools-page')?.dataset.page || 'all';
let searchQuery = '';

const CAT_CONFIG = [
  { key: 'pdf', label: 'PDF Tools', svgKey: 'createpdf', color: '#f5a623' },
  { key: 'image', label: 'Image Tools', svgKey: 'imgcompress', color: '#a78bfa' },
  { key: 'convert', label: 'Convert', svgKey: 'imgconvert', color: '#3ecfcf' },
  { key: 'video', label: 'Video Tools', svgKey: 'vidcompress', color: '#60a5fa' },
  { key: 'audio', label: 'Audio Tools', svgKey: 'audioconvert', color: '#34d399' },
  { key: 'text', label: 'Text Tools', svgKey: 'wordcount', color: '#fb923c' },
  { key: 'security', label: 'Security & Utils', svgKey: 'passgen', color: '#f87171' },
  { key: 'utilities', label: 'Utilities', svgKey: 'qrgen', color: '#f87171' },
];

// PDF Subsections Schema Definition Matrix Map (Used strictly on dedicated PDF catalog view)
const PDF_SUB_SECTIONS = [
  { key: 'convert', label: 'Creation & Direct Conversion' },
  { key: 'security', label: 'Security, Privacy & Overlays' },
  { key: 'organize', label: 'Page Manipulation & Organizing' },
  { key: 'optimize', label: 'Conversion & Optimization Diagnostics' }
];

const openSections = new Set(CAT_CONFIG.map(c => c.key));

/* ============================================================
   RENDER HELPERS
   ============================================================ */
function getFiltered() {
  return TOOLS_DATA.filter(t => {
    const matchCat = pageContext === 'all' || t.cat === pageContext;
    const q = searchQuery.toLowerCase();
    const matchQ = !q || t.name.toLowerCase().includes(q) || t.cat.includes(q) || t.id.includes(q);
    return matchCat && matchQ;
  });
}

function renderToolItem(t) {
  const isStarred = favorites.has(t.id);
  const svg = ICONS[t.icon] || ICONS['createpdf'];
  const coloredSvg = svg.replace('<svg', `<svg stroke="${t.color}"`);
  return `
    <a href="${t.url}" class="tool-item"
       style="--tool-color:${t.color}; --tool-icon-bg:${t.bg};"
       title="${t.name}">
      ${t.isNew ? '<span class="tool-item__new">New</span>' : ''}
      <button class="tool-item__star ${isStarred ? 'starred' : ''}"
              data-id="${t.id}"
              onclick="toggleStar(event,'${t.id}')">
        ${isStarred ? '⭐' : '☆'}
      </button>
      <div class="tool-item__icon">${coloredSvg}</div>
      <span class="tool-item__name">${t.name}</span>
    </a>
  `;
}

/* ============================================================
   INTELLIGENT DUAL-ROUTER RENDER ENGINE
   ============================================================ */
function renderByCategory(container, tools) {
  const isGlobalView = pageContext === 'all';
  const isMobile = window.innerWidth <= 768;

  container.innerHTML = CAT_CONFIG.map(cat => {
    const catTools = tools.filter(t => t.cat === cat.key);
    if (!catTools.length) return '';

    const headerSvg = (ICONS[cat.svgKey] || '').replace('<svg', `<svg stroke="${cat.color}"`);
    const isOpen = openSections.has(cat.key);

    // Laptop index line constraint = 6 cards. Mobile index line constraint = 4 cards.
    let displayLimit = catTools.length;
    if (isGlobalView) {
      displayLimit = isMobile ? 6 : 6;
    }

    const choppedTools = catTools.slice(0, displayLimit);
    const shouldDisplayViewAll = isMobile || catTools.length > 6;

    return `
      <div class="tools-section tools-accordion" data-cat="${cat.key}">
        <div class="tools-section-header tools-accordion__header"
             role="button"
             tabindex="0"
             aria-expanded="${isOpen}"
             data-acc-key="${cat.key}"
             onclick="toggleAccordion('${cat.key}')">
          <div class="tools-section-title">
            ${headerSvg}
            ${cat.label}
            <span class="tools-section-count">${catTools.length}</span>
          </div>
          <div class="tools-accordion__right">
            ${(isGlobalView && shouldDisplayViewAll) ? `<a href="/tools/${cat.key}/" class="tools-section-viewall" onclick="event.stopPropagation()">View all →</a>` : ''}
            <span class="tools-accordion__chevron ${isOpen ? 'open' : ''}">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </span>
          </div>
        </div>
        <div class="tools-accordion__body ${isOpen ? 'open' : ''}" id="acc-body-${cat.key}">
          <div class="tools-grid">
            ${choppedTools.map(t => renderToolItem(t)).join('')}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/* ============================================================
   FLAT MULTI-SUBSECTION EXPANSION LAYER (Strictly for Dedicated Pages)
   ============================================================ */
function renderFlat(container, tools) {
  let innerStructureMarkup = '';

  // 🎯 PDF Page Only Condition mapping: Split all 24 tools into 4 clean subsection layouts!
  if (pageContext === 'pdf' && !searchQuery) {
    innerStructureMarkup = PDF_SUB_SECTIONS.map(sub => {
      const subTools = tools.filter(t => t.subcat === sub.key);
      if (!subTools.length) return '';
      return `
        <div class="tools-subsection-group" style="margin-bottom: 30px; text-align: left; width: 100%;">
          <h4 style="font-size: 13.5px; font-weight: 800; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.05em; border-left: 3px solid #4f46e5; padding-left: 8px; margin: 24px 0 14px 0; font-family:var(--font-sans);">${sub.label}</h4>
          <div class="tools-grid">
            ${subTools.map(t => renderToolItem(t)).join('')}
          </div>
        </div>
      `;
    }).join('');
  } else {
    // Alternate category catalog listing flats grids maps
    innerStructureMarkup = `
      <div class="tools-grid">
        ${tools.map(t => renderToolItem(t)).join('')}
      </div>
    `;
  }

  container.innerHTML = `
    <div class="tools-section">
      <div class="tools-section-header">
        <div class="tools-section-title">
          ${searchQuery ? `Search Results for "${searchQuery}"` : pageContext.toUpperCase() + ' Tools Workspace'}
          <span class="tools-section-count">${tools.length}</span>
        </div>
      </div>
      ${innerStructureMarkup}
    </div>
  `;
}

/* Toggle element accordion states functions */
window.toggleAccordion = function (key) {
  const body = document.getElementById(`acc-body-${key}`);
  const header = document.querySelector(`[data-acc-key="${key}"]`);
  const chevron = header?.querySelector('.tools-accordion__chevron');

  if (!body) return;

  if (body.classList.contains('open')) {
    body.classList.remove('open');
    chevron?.classList.remove('open');
    header?.setAttribute('aria-expanded', 'false');
  } else {
    body.classList.add('open');
    chevron?.classList.add('open');
    header?.setAttribute('aria-expanded', 'true');
  }
};

/* Master controller triggers rendering loop */
function renderTools() {
  const container = document.getElementById('tools-container');
  const emptyEl = document.getElementById('tools-empty');
  if (!container) return;

  const filtered = getFiltered();

  if (filtered.length === 0) {
    container.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';

  if (pageContext === 'all' && !searchQuery) {
    renderByCategory(container, filtered);
  } else {
    renderFlat(container, filtered);
  }
}

window.toggleStar = function (e, id) {
  e.preventDefault(); e.stopPropagation();
  const btn = e.currentTarget;
  if (favorites.has(id)) {
    favorites.delete(id); btn.textContent = '☆'; btn.classList.remove('starred');
  } else {
    favorites.add(id); btn.textContent = '⭐'; btn.classList.add('starred');
  }
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
};

window.addEventListener('resize', () => {
  if (pageContext === 'all' && !searchQuery) renderTools();
});

document.addEventListener('DOMContentLoaded', () => {
  const mainPageNode = document.querySelector('.tools-page');
  if (mainPageNode && mainPageNode.dataset.page) {
    pageContext = mainPageNode.dataset.page;
  }

  if (!document.getElementById('tools-container')) return;

  renderTools();

  document.querySelectorAll('.tools-catstrip__btn').forEach(btn => {
    btn.classList.remove('active');
    if ((btn.dataset.cat || 'all') === pageContext) btn.classList.add('active');
  });

  let timer;
  document.getElementById('tools-search-input')?.addEventListener('input', e => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      searchQuery = e.target.value.trim();
      renderTools();
    }, 250);
  });
});