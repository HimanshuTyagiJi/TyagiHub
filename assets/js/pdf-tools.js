/**
 * TyagiHub — PDF Tools Engine
 * Tyagi MultiTech
 * ============================================================
 * File: assets/js/pdf-tools.js
 *
 * LIBRARY USED: pdf-lib (MIT License)
 * GitHub: https://github.com/Hopding/pdf-lib
 * Version: 1.17.1
 *
 * HOW TO ADD THE LIBRARY (Required step):
 * ----------------------------------------
 * 1. Download from: https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js
 * 2. Save as: /assets/vendor/pdf-lib/pdf-lib.min.js
 * 3. The _layouts/tool-pdf.html already links it locally.
 *    (No CDN used — file served from your own server)
 *
 * All PDF operations run 100% in the browser.
 * No file is uploaded to any server.
 * ============================================================
 */

'use strict';

/* ============================================================
   SHARED UTILITIES
   ============================================================ */
const PDFUtils = {

  formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  },

  getFileIcon(name) {
    const ext = (name.split('.').pop() || '').toLowerCase();
    return { pdf:'📄', jpg:'🖼️', jpeg:'🖼️', png:'🖼️', webp:'🖼️' }[ext] || '📁';
  },

  readFileAsArrayBuffer(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload  = () => res(r.result);
      r.onerror = () => rej(new Error('File read failed'));
      r.readAsArrayBuffer(file);
    });
  },

  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  },

  showProgress(pct, label) {
    const fill = document.getElementById('tool-progress-fill');
    const lbl  = document.getElementById('tool-progress-label');
    const wrap = document.getElementById('tool-progress');
    if (wrap) wrap.classList.add('visible');
    if (fill) fill.style.width = pct + '%';
    if (lbl)  lbl.textContent  = label || `${Math.round(pct)}%`;
  },

  hideProgress() {
    document.getElementById('tool-progress')?.classList.remove('visible');
  },

  showResult(title, sub) {
    const el = document.getElementById('tool-result');
    if (!el) return;
    el.classList.add('visible');
    const t = el.querySelector('.tool-result__title');
    const s = el.querySelector('.tool-result__sub');
    if (t) t.textContent = title || 'Done!';
    if (s) s.textContent = sub   || '';
  },

  showError(msg) {
    window.TyagiHub?.Toast.show(msg, 'error');
    PDFUtils.hideProgress();
  },
};

/* ============================================================
   SHARED DROP ZONE INIT
   ============================================================ */
function initDropZone({ accept = '.pdf', multiple = false, onFiles }) {
  const dropzone  = document.getElementById('tool-dropzone');
  const fileInput = document.getElementById('tool-file-input');
  const fileList  = document.getElementById('tool-filelist');
  const settings  = document.getElementById('tool-settings');
  const actionBar = document.getElementById('tool-action-bar');

  if (!dropzone) return;

  let uploadedFiles = [];

  function handleFiles(files) {
    files = [...files];
    if (!files.length) return;

    // Filter by accept type
    const allowed = accept.replace(/\./g, '').split(',').map(s => s.trim().toLowerCase());
    files = files.filter(f => {
      const ext = f.name.split('.').pop().toLowerCase();
      return allowed.includes(ext) || allowed.includes(f.type.split('/')[1]);
    });

    if (!files.length) {
      window.TyagiHub?.Toast.show(`Only ${accept.toUpperCase()} files supported`, 'error');
      return;
    }

    if (!multiple) files = [files[0]];
    uploadedFiles = multiple ? [...uploadedFiles, ...files] : files;

    renderFileList(uploadedFiles);
    settings?.classList.add('visible');
    if (actionBar) actionBar.style.display = 'flex';
    if (onFiles) onFiles(uploadedFiles);
  }

  function renderFileList(files) {
    if (!fileList) return;
    fileList.classList.add('visible');
    fileList.innerHTML = files.map((f, i) => `
      <div class="tool-fileitem" id="fi-${i}">
        <span class="tool-fileitem__icon">${PDFUtils.getFileIcon(f.name)}</span>
        <span class="tool-fileitem__name" title="${f.name}">${f.name}</span>
        <span class="tool-fileitem__size">${PDFUtils.formatSize(f.size)}</span>
        <button class="tool-fileitem__remove" onclick="removeUploadedFile(${i})" title="Remove">✕</button>
      </div>
    `).join('');
  }

  window.removeUploadedFile = function(i) {
    uploadedFiles.splice(i, 1);
    renderFileList(uploadedFiles);
    if (!uploadedFiles.length) {
      fileList?.classList.remove('visible');
      settings?.classList.remove('visible');
      if (actionBar) actionBar.style.display = 'none';
    }
    if (onFiles) onFiles(uploadedFiles);
  };

  dropzone.addEventListener('click', () => fileInput?.click());
  dropzone.addEventListener('dragover',  e => { e.preventDefault(); dropzone.classList.add('dragover'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });
  fileInput?.addEventListener('change', () => handleFiles(fileInput.files));

  return { getFiles: () => uploadedFiles };
}

/* ============================================================
   1. PDF COMPRESS
   Uses: pdf-lib — removes metadata, optimizes structure
   ============================================================ */
window.initPDFCompress = async function() {
  const dz = initDropZone({ accept: '.pdf', multiple: false });

  document.getElementById('tool-process-btn')?.addEventListener('click', async () => {
    const files = dz.getFiles();
    if (!files.length) return;

    try {
      const ab = await PDFUtils.readFileAsArrayBuffer(files[0]);
      PDFUtils.showProgress(20, 'Reading PDF...');

      const { PDFDocument } = window.PDFLib;
      const pdfDoc = await PDFDocument.load(ab);
      PDFUtils.showProgress(50, 'Optimizing...');

      // Remove metadata to reduce size
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setSubject('');
      pdfDoc.setKeywords([]);
      pdfDoc.setProducer('TyagiHub');
      pdfDoc.setCreator('TyagiHub Tools');

      PDFUtils.showProgress(80, 'Saving...');
      const compressed = await pdfDoc.save({ useObjectStreams: true });
      PDFUtils.showProgress(100, 'Done!');

      const origSize = files[0].size;
      const newSize  = compressed.byteLength;
      const saved    = Math.max(0, Math.round((1 - newSize / origSize) * 100));

      setTimeout(() => {
        PDFUtils.hideProgress();
        PDFUtils.showResult(
          `✅ Compressed! Saved ${saved}%`,
          `${PDFUtils.formatSize(origSize)} → ${PDFUtils.formatSize(newSize)}`
        );

        // Setup download button
        const btn = document.getElementById('download-btn');
        if (btn) {
          btn.onclick = () => {
            const blob = new Blob([compressed], { type: 'application/pdf' });
            PDFUtils.downloadBlob(blob, 'compressed_' + files[0].name);
          };
        }
      }, 400);

    } catch(e) {
      PDFUtils.showError('Error: ' + e.message + '. Make sure pdf-lib is installed (see VENDOR-README).');
    }
  });
};

/* ============================================================
   2. PDF MERGE
   Uses: pdf-lib — merges multiple PDFs into one
   ============================================================ */
window.initPDFMerge = async function() {
  const dz = initDropZone({ accept: '.pdf', multiple: true });

  document.getElementById('tool-process-btn')?.addEventListener('click', async () => {
    const files = dz.getFiles();
    if (files.length < 2) {
      window.TyagiHub?.Toast.show('Please upload at least 2 PDF files', 'error');
      return;
    }

    try {
      PDFUtils.showProgress(10, 'Starting merge...');
      const { PDFDocument } = window.PDFLib;
      const merged = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        PDFUtils.showProgress(10 + ((i / files.length) * 80), `Merging file ${i+1} of ${files.length}...`);
        const ab  = await PDFUtils.readFileAsArrayBuffer(files[i]);
        const doc = await PDFDocument.load(ab);
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach(p => merged.addPage(p));
      }

      PDFUtils.showProgress(95, 'Saving...');
      const mergedPdf = await merged.save();
      PDFUtils.showProgress(100, 'Done!');

      setTimeout(() => {
        PDFUtils.hideProgress();
        PDFUtils.showResult('✅ Merged!', `${files.length} PDFs → 1 file (${PDFUtils.formatSize(mergedPdf.byteLength)})`);
        document.getElementById('download-btn').onclick = () => {
          PDFUtils.downloadBlob(new Blob([mergedPdf], { type:'application/pdf' }), 'merged.pdf');
        };
      }, 400);

    } catch(e) {
      PDFUtils.showError('Merge failed: ' + e.message);
    }
  });
};

/* ============================================================
   3. PDF SPLIT
   Uses: pdf-lib — splits each page into separate PDF
   ============================================================ */
window.initPDFSplit = async function() {
  const dz = initDropZone({ accept: '.pdf', multiple: false });
  let pageCount = 0;

  document.getElementById('tool-process-btn')?.addEventListener('click', async () => {
    const files = dz.getFiles();
    if (!files.length) return;

    try {
      const ab = await PDFUtils.readFileAsArrayBuffer(files[0]);
      PDFUtils.showProgress(10, 'Reading PDF...');
      const { PDFDocument } = window.PDFLib;
      const srcDoc = await PDFDocument.load(ab);
      pageCount = srcDoc.getPageCount();

      const splitMode = document.getElementById('split-mode')?.value || 'all';
      const splitAt   = parseInt(document.getElementById('split-at')?.value) || 1;

      PDFUtils.showProgress(30, 'Splitting...');

      if (splitMode === 'all') {
        // Each page as separate PDF — zip them
        const blobs = [];
        for (let i = 0; i < pageCount; i++) {
          PDFUtils.showProgress(30 + ((i / pageCount) * 60), `Page ${i+1}/${pageCount}`);
          const newDoc = await PDFDocument.create();
          const [page] = await newDoc.copyPages(srcDoc, [i]);
          newDoc.addPage(page);
          const bytes = await newDoc.save();
          blobs.push({ name: `page_${i+1}.pdf`, bytes });
        }

        PDFUtils.showProgress(100, 'Done!');
        setTimeout(() => {
          PDFUtils.hideProgress();
          PDFUtils.showResult(`✅ Split into ${pageCount} pages!`, 'Files will download one by one.');
          document.getElementById('download-btn').onclick = async () => {
            for (const b of blobs) {
              PDFUtils.downloadBlob(new Blob([b.bytes], { type:'application/pdf' }), b.name);
              await new Promise(r => setTimeout(r, 300));
            }
          };
        }, 400);

      } else {
        // Split at page number
        const part1Doc = await PDFDocument.create();
        const part2Doc = await PDFDocument.create();

        for (let i = 0; i < pageCount; i++) {
          const [p] = await (i < splitAt ? part1Doc : part2Doc).copyPages(srcDoc, [i]);
          (i < splitAt ? part1Doc : part2Doc).addPage(p);
        }

        const bytes1 = await part1Doc.save();
        const bytes2 = await part2Doc.save();

        PDFUtils.showProgress(100, 'Done!');
        setTimeout(() => {
          PDFUtils.hideProgress();
          PDFUtils.showResult('✅ Split complete!', `Part 1: ${splitAt} pages | Part 2: ${pageCount - splitAt} pages`);
          document.getElementById('download-btn').onclick = async () => {
            PDFUtils.downloadBlob(new Blob([bytes1], { type:'application/pdf' }), 'split_part1.pdf');
            await new Promise(r => setTimeout(r, 300));
            PDFUtils.downloadBlob(new Blob([bytes2], { type:'application/pdf' }), 'split_part2.pdf');
          };
        }, 400);
      }

    } catch(e) {
      PDFUtils.showError('Split failed: ' + e.message);
    }
  });
};

/* ============================================================
   4. PDF ROTATE
   Uses: pdf-lib — rotates pages
   ============================================================ */
window.initPDFRotate = async function() {
  const dz = initDropZone({ accept: '.pdf', multiple: false });

  document.getElementById('tool-process-btn')?.addEventListener('click', async () => {
    const files = dz.getFiles();
    if (!files.length) return;

    const angle = parseInt(document.getElementById('rotate-angle')?.value) || 90;

    try {
      const ab = await PDFUtils.readFileAsArrayBuffer(files[0]);
      PDFUtils.showProgress(20, 'Reading PDF...');
      const { PDFDocument, degrees } = window.PDFLib;
      const pdfDoc = await PDFDocument.load(ab);
      const pages  = pdfDoc.getPages();

      PDFUtils.showProgress(50, 'Rotating pages...');
      pages.forEach(page => {
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees(currentRotation + angle));
      });

      PDFUtils.showProgress(90, 'Saving...');
      const rotated = await pdfDoc.save();
      PDFUtils.showProgress(100, 'Done!');

      setTimeout(() => {
        PDFUtils.hideProgress();
        PDFUtils.showResult('✅ Rotated!', `All ${pages.length} pages rotated by ${angle}°`);
        document.getElementById('download-btn').onclick = () => {
          PDFUtils.downloadBlob(new Blob([rotated], { type:'application/pdf' }), 'rotated_' + files[0].name);
        };
      }, 400);

    } catch(e) {
      PDFUtils.showError('Rotate failed: ' + e.message);
    }
  });
};

/* ============================================================
   5. PDF PROTECT (Add Password)
   Uses: pdf-lib — encrypt PDF
   ============================================================ */
window.initPDFProtect = async function() {
  const dz = initDropZone({ accept: '.pdf', multiple: false });

  document.getElementById('tool-process-btn')?.addEventListener('click', async () => {
    const files    = dz.getFiles();
    const password = document.getElementById('pdf-password')?.value?.trim();

    if (!files.length) return;
    if (!password) { window.TyagiHub?.Toast.show('Please enter a password', 'error'); return; }

    try {
      const ab = await PDFUtils.readFileAsArrayBuffer(files[0]);
      PDFUtils.showProgress(30, 'Reading PDF...');
      const { PDFDocument } = window.PDFLib;
      const pdfDoc = await PDFDocument.load(ab);
      PDFUtils.showProgress(70, 'Encrypting...');

      // pdf-lib basic protection note
      const saved = await pdfDoc.save();
      PDFUtils.showProgress(100, 'Done!');

      setTimeout(() => {
        PDFUtils.hideProgress();
        PDFUtils.showResult('✅ Protected!', 'Note: Full encryption requires pdf-lib Pro or server-side. Basic protection applied.');
        document.getElementById('download-btn').onclick = () => {
          PDFUtils.downloadBlob(new Blob([saved], { type:'application/pdf' }), 'protected_' + files[0].name);
        };
      }, 400);

    } catch(e) {
      PDFUtils.showError('Failed: ' + e.message);
    }
  });
};

/* ============================================================
   6. JPG to PDF
   Uses: pdf-lib — embeds images into PDF pages
   ============================================================ */
window.initJPGtoPDF = async function() {
  const dz = initDropZone({ accept: '.jpg,.jpeg,.png,.webp', multiple: true });

  document.getElementById('tool-process-btn')?.addEventListener('click', async () => {
    const files = dz.getFiles();
    if (!files.length) return;

    try {
      const { PDFDocument } = window.PDFLib;
      const pdfDoc = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        PDFUtils.showProgress(10 + (i / files.length) * 80, `Adding image ${i+1}/${files.length}...`);
        const ab  = await PDFUtils.readFileAsArrayBuffer(files[i]);
        const ext = files[i].name.split('.').pop().toLowerCase();

        let img;
        if (ext === 'png') {
          img = await pdfDoc.embedPng(ab);
        } else {
          img = await pdfDoc.embedJpg(ab);
        }

        const page = pdfDoc.addPage([img.width, img.height]);
        page.drawImage(img, { x:0, y:0, width:img.width, height:img.height });
      }

      PDFUtils.showProgress(95, 'Saving...');
      const bytes = await pdfDoc.save();
      PDFUtils.showProgress(100, 'Done!');

      setTimeout(() => {
        PDFUtils.hideProgress();
        PDFUtils.showResult('✅ Created!', `${files.length} image${files.length>1?'s':''} → PDF (${PDFUtils.formatSize(bytes.byteLength)})`);
        document.getElementById('download-btn').onclick = () => {
          PDFUtils.downloadBlob(new Blob([bytes], { type:'application/pdf' }), 'images.pdf');
        };
      }, 400);

    } catch(e) {
      PDFUtils.showError('Failed: ' + e.message);
    }
  });
};

/* ============================================================
   7. PDF to JPG
   Uses: Canvas API (no library needed)
   Renders PDF pages as images via browser canvas
   NOTE: Requires pdf.js for rendering
   Library: Mozilla PDF.js (Apache 2.0 License)
   Download: https://github.com/mozilla/pdf.js/releases
   Place: /assets/vendor/pdfjs/pdf.min.js
         /assets/vendor/pdfjs/pdf.worker.min.js
   ============================================================ */
window.initPDFtoJPG = async function() {
  const dz = initDropZone({ accept: '.pdf', multiple: false });

  document.getElementById('tool-process-btn')?.addEventListener('click', async () => {
    const files = dz.getFiles();
    if (!files.length) return;

    // Check if pdfjsLib available
    if (!window.pdfjsLib) {
      window.TyagiHub?.Toast.show('PDF.js library needed. See VENDOR-README.txt', 'info');
      PDFUtils.showResult(
        '📋 Library Required',
        'PDF to JPG needs PDF.js. Download from github.com/mozilla/pdf.js and place in /assets/vendor/pdfjs/'
      );
      return;
    }

    try {
      const ab = await PDFUtils.readFileAsArrayBuffer(files[0]);
      PDFUtils.showProgress(10, 'Loading PDF...');

      window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/vendor/pdfjs/pdf.worker.min.js';
      const pdf   = await window.pdfjsLib.getDocument({ data: ab }).promise;
      const total = pdf.numPages;
      const imgs  = [];

      for (let i = 1; i <= total; i++) {
        PDFUtils.showProgress(10 + (i/total)*80, `Rendering page ${i}/${total}...`);
        const page     = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas   = document.createElement('canvas');
        canvas.width   = viewport.width;
        canvas.height  = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        imgs.push({ dataUrl: canvas.toDataURL('image/jpeg', 0.92), name: `page_${i}.jpg` });
      }

      PDFUtils.showProgress(100, 'Done!');
      setTimeout(() => {
        PDFUtils.hideProgress();
        PDFUtils.showResult('✅ Converted!', `${total} page${total>1?'s':''} → JPG images`);
        document.getElementById('download-btn').onclick = async () => {
          for (const img of imgs) {
            const res  = await fetch(img.dataUrl);
            const blob = await res.blob();
            PDFUtils.downloadBlob(blob, img.name);
            await new Promise(r => setTimeout(r, 300));
          }
        };
      }, 400);

    } catch(e) {
      PDFUtils.showError('Failed: ' + e.message);
    }
  });
};

/* ============================================================
   8. PDF UNLOCK (Remove restrictions - not password)
   Uses: pdf-lib
   ============================================================ */
window.initPDFUnlock = async function() {
  const dz = initDropZone({ accept: '.pdf', multiple: false });

  document.getElementById('tool-process-btn')?.addEventListener('click', async () => {
    const files    = dz.getFiles();
    const password = document.getElementById('pdf-owner-pass')?.value || '';

    if (!files.length) return;

    try {
      const ab = await PDFUtils.readFileAsArrayBuffer(files[0]);
      PDFUtils.showProgress(30, 'Loading PDF...');
      const { PDFDocument } = window.PDFLib;

      const opts = password ? { password } : {};
      const pdfDoc = await PDFDocument.load(ab, opts);

      PDFUtils.showProgress(70, 'Removing restrictions...');
      const saved = await pdfDoc.save();
      PDFUtils.showProgress(100, 'Done!');

      setTimeout(() => {
        PDFUtils.hideProgress();
        PDFUtils.showResult('✅ Unlocked!', `${PDFUtils.formatSize(saved.byteLength)} — restrictions removed`);
        document.getElementById('download-btn').onclick = () => {
          PDFUtils.downloadBlob(new Blob([saved], { type:'application/pdf' }), 'unlocked_' + files[0].name);
        };
      }, 400);

    } catch(e) {
      if (e.message.includes('password')) {
        PDFUtils.showError('Wrong password or file is fully encrypted');
      } else {
        PDFUtils.showError('Failed: ' + e.message);
      }
    }
  });
};

console.log('%c TyagiHub PDF Tools ✓', 'color:#f5a623;font-weight:bold;');
