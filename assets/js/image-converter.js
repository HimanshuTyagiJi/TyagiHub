/**
 * TyagiHub Tools — Image Converter Logic Core Framework
 * Tyagi MultiTech
 * ============================================================
 * File: assets/js/image-converter.js
 * Capability: Batch processing, client-side ZIP parsing, in-memory 
 * Canvas decoding rendering streams, and multiple bulk download exports.
 * ============================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // Core state management store dictionaries matrix elements arrays arrays 
    let fileQueue = [];
    const MAX_FILES_LIMIT = 100;

    // DOM Caches references components mapping elements structures pointers
    const dropzone = document.getElementById('img-master-dropzone');
    const rawFileInput = document.getElementById('img-raw-file-input');
    const zipFileInput = document.getElementById('img-zip-file-input');
    const browseRawBtn = document.getElementById('img-browse-trigger-btn');
    const browseZipBtn = document.getElementById('img-zip-trigger-btn');
    const workspace = document.getElementById('img-converter-workspace');
    const singlePanel = document.getElementById('img-single-viewer-panel');
    const bulkPanel = document.getElementById('img-bulk-viewer-panel');
    const tableBody = document.getElementById('img-bulk-table-body-target');
    const singleImgNode = document.getElementById('single-image-preview-node');
    const singleMetaLbl = document.getElementById('single-image-metadata-lbl');
    
    // Config controls targets inputs
    const globalFormat = document.getElementById('global-target-format');
    const globalQuality = document.getElementById('global-image-quality');
    const globalQualityBadge = document.getElementById('global-quality-badge');
    const globalWidth = document.getElementById('global-max-width');
    const globalHeight = document.getElementById('global-max-height');
    const qualityContainer = document.getElementById('global-quality-container');

    // Progress and actions triggers anchors
    const progressCard = document.getElementById('img-compiler-progress-card');
    const progressFill = document.getElementById('img-compiler-progress-bar-fill');
    const statusTxt = document.getElementById('img-compiler-status-txt');
    const pctLbl = document.getElementById('img-compiler-pct-lbl');
    const resetBtn = document.getElementById('img-reset-workspace-btn');
    const masterCompileBtn = document.getElementById('img-master-compile-btn');

    // Toast configuration logic trigger helper wrapper
    window.showToastMessageAlert = function(msg) {
        const toast = document.getElementById('img-toast-notif-alert');
        const lbl = document.getElementById('img-toast-text-lbl');
        if (lbl) lbl.innerText = msg;
        if (toast) {
            toast.style.display = 'flex';
            setTimeout(() => { toast.style.display = 'none'; }, 3000);
        }
    };

    // Click triggers bindings pointers redirections targets element hooks
    if(browseRawBtn) browseRawBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); rawFileInput.click(); };
    if(browseZipBtn) browseZipBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); zipFileInput.click(); };

    if(rawFileInput) rawFileInput.onchange = (e) => { handleIngestedFiles(e.target.files, 'raw'); };
    if(zipFileInput) zipFileInput.onchange = (e) => { handleIngestedFiles(e.target.files, 'zip'); };

    // Drag and drop event wrappers interceptors bounds setup parameters mappings
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone?.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); dropzone.classList.add('highlight'); }, false);
    });
    ['dragleave', 'drop'].forEach(eventName => {
        dropzone?.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); dropzone.classList.remove('highlight'); }, false);
    });
    dropzone?.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files.length > 0) {
            const firstFile = files[0];
            if (firstFile.name.endsWith('.zip') || firstFile.type === 'application/zip') {
                handleIngestedFiles(files, 'zip');
            } else {
                handleIngestedFiles(files, 'raw');
            }
        }
    }, false);

    // Dynamic quality badge value slider update listener sync arrays metric
    globalQuality?.addEventListener('input', (e) => {
        if(globalQualityBadge) globalQualityBadge.innerText = e.target.value + '%';
        syncGlobalSettingsToQueueItems();
    });
    globalFormat?.addEventListener('change', () => {
        const fmt = globalFormat.value;
        if (fmt === 'png' || fmt === 'svg' || fmt === 'xml') {
            if(qualityContainer) qualityContainer.style.opacity = '0.4';
        } else {
            if(qualityContainer) qualityContainer.style.opacity = '1';
        }
        syncGlobalSettingsToQueueItems();
    });
    [globalWidth, globalHeight].forEach(el => el?.addEventListener('input', syncGlobalSettingsToQueueItems));

    /* ============================================================
       FILE INGESTION LAYER (ZIP extraction logic vs direct image loads)
       ============================================================ */
    async function handleIngestedFiles(files, mode) {
        if (!files || files.length === 0) return;
        
        if (fileQueue.length >= MAX_FILES_LIMIT) {
            alert(`TyagiHub Sandbox Limit! Maximum allowed elements is ${MAX_FILES_LIMIT} files.`);
            return;
        }

        if (mode === 'zip') {
            const zipFile = files[0];
            if (!zipFile.name.endsWith('.zip') && zipFile.type !== 'application/zip') return;
            window.showToastMessageAlert("Unzipping processing archive streams client-side...");
            try {
                const zip = await window.JSZip.loadAsync(zipFile);
                const extractedPromises = [];
                
                zip.forEach((relativePath, zipEntry) => {
                    if (!zipEntry.dir && isSupportedFileNameExtension(zipEntry.name)) {
                        const p = zipEntry.async('blob').then(blob => {
                            const virtualFileObj = new File([blob], zipEntry.name, { type: getMimeTypeFromExtension(zipEntry.name) });
                            return registerSingleFileIntoMemoryObject(virtualFileObj);
                        });
                        extractedPromises.push(p);
                    }
                });
                await Promise.all(extractedPromises);
            } catch (err) {
                alert("ZIP Stream execution unzipping crashed failed: " + err.message);
            }
        } else {
            const promises = Array.from(files).map(f => registerSingleFileIntoMemoryObject(f));
            await Promise.all(promises);
        }

        renderConverterWorkspaceInterface();
    }

    function isSupportedFileNameExtension(name) {
        const ext = name.split('.').pop().toLowerCase();
        return ['png','jpg','jpeg','webp','svg','xml','json','txt','ico','icns','bmp','gif'].includes(ext);
    }

    function getMimeTypeFromExtension(name) {
        const ext = name.split('.').pop().toLowerCase();
        if(ext === 'svg') return 'image/svg+xml';
        if(ext === 'xml') return 'text/xml';
        if(ext === 'json') return 'application/json';
        if(ext === 'webp') return 'image/webp';
        if(ext === 'png') return 'image/png';
        return 'image/jpeg';
    }

    function registerSingleFileIntoMemoryObject(file) {
        return new Promise((resolve) => {
            if (fileQueue.length >= MAX_FILES_LIMIT) { resolve(); return; }
            const reader = new FileReader();
            reader.onload = function(evt) {
                const uniqueId = "th-img-" + Math.random().toString(36).substring(2, 6) + "-" + Date.now().toString().substring(10);
                
                // Construct master item tracking metrics parameters records references
                const item = {
                    id: uniqueId,
                    name: file.name,
                    size: (file.size / 1024).toFixed(1) + " KB",
                    originalExtension: file.name.split('.').pop().toLowerCase(),
                    dataUrl: evt.target.result,
                    targetFormat: globalFormat.value,
                    targetQuality: parseInt(globalQuality.value),
                    targetWidth: globalWidth.value ? parseInt(globalWidth.value) : null,
                    targetHeight: globalHeight.value ? parseInt(globalHeight.value) : null,
                    status: 'standby' // standby | success | failed
                };

                fileQueue.push(item);
                resolve();
            };
            reader.readAsDataURL(file);
        });
    }

    function syncGlobalSettingsToQueueItems() {
        fileQueue.forEach(item => {
            item.targetFormat = globalFormat.value;
            item.targetQuality = parseInt(globalQuality.value);
            item.targetWidth = globalWidth.value ? parseInt(globalWidth.value) : null;
            item.targetHeight = globalHeight.value ? parseInt(globalHeight.value) : null;
            
            // Sync dynamic rows layout values live updates inline selectors targets
            const rowFmt = document.getElementById(`fmt-select-${item.id}`);
            if (rowFmt) rowFmt.value = globalFormat.value;
        });
    }

    /* ============================================================
       WORKSPACE DRAW INTERFACE SYSTEMS (Anti-khichdi grid mappings)
       ============================================================ */
    function renderConverterWorkspaceInterface() {
        if (fileQueue.length === 0) {
            if(workspace) workspace.hidden = true;
            return;
        }

        if(workspace) workspace.hidden = false;

        if (fileQueue.length === 1) {
            if(bulkPanel) bulkPanel.style.display = 'none';
            if(singlePanel) singlePanel.style.display = 'block';
            
            const singleItem = fileQueue[0];
            if(singleImgNode) singleImgNode.src = singleItem.dataUrl;
            if(singleMetaLbl) singleMetaLbl.innerHTML = `<strong>File Name:</strong> ${singleItem.name} <br> <strong>Source Weight Grid:</strong> ${singleItem.size} · <strong>Format Ext:</strong> .${singleItem.originalExtension.toUpperCase()}`;
        } else {
            if(singlePanel) singlePanel.style.display = 'none';
            if(bulkPanel) bulkPanel.style.display = 'block';
            if(tableBody) tableBody.innerHTML = '';

            fileQueue.forEach(item => {
                const tr = document.createElement('tr');
                tr.id = `row-item-${item.id}`;
                
                // Setup dynamic inner html spreadsheet columns layout structure mapping parameters
                tr.innerHTML = `
                    <td>
                        <div class="img-bulk-table__thumb-box">
                            <img src="${item.dataUrl.startsWith('data:image/') ? item.dataUrl : '/assets/img/placeholder-code.png'}" alt="Thumb indicator">
                        </div>
                    </td>
                    <td>
                        <span class="img-bulk-table__name-lbl">${item.name}</span>
                        <small style="color:var(--clr-slate-medium); font-size:10.5px;">Size weight: ${item.size}</small>
                    </td>
                    <td>
                        <span class="img-ui-badge" style="background:#f1f5f9; color:#475569; font-family:monospace;">.${item.originalExtension.toUpperCase()}</span>
                    </td>
                    <td>
                        <select id="fmt-select-${item.id}" class="img-ui-select" style="height:34px; padding:0 6px; font-size:11.5px;" onchange="window.updateIndividualItemFormat('${item.id}', this.value)">
                            <option value="png" ${item.targetFormat === 'png' ? 'selected' : ''}>PNG (Lossless Transparent)</option>
                            <option value="jpeg" ${item.targetFormat === 'jpeg' ? 'selected' : ''}>JPG (Photorealistic)</option>
                            <option value="webp" ${item.targetFormat === 'webp' ? 'selected' : ''}>WebP (Next-Gen Optimized)</option>
                            <option value="ico" ${item.targetFormat === 'ico' ? 'selected' : ''}>ICO App Icon Pack</option>
                            <option value="svg" ${item.targetFormat === 'svg' ? 'selected' : ''}>SVG Vector Code</option>
                            <option value="xml" ${item.targetFormat === 'xml' ? 'selected' : ''}>XML Android Layout</option>
                            <option value="base64_json" ${item.targetFormat === 'base64_json' ? 'selected' : ''}>JSON Payload String</option>
                        </select>
                    </td>
                    <td>
                        <div style="display:flex; align-items:center; gap:8px;" id="action-cell-wrapper-${item.id}">
                            <button type="button" class="img-ui-btn img-ui-btn--outline" style="padding:6px 12px; font-size:11px;" onclick="window.compileAndDownloadSingleItem('${item.id}')">Convert 🚀</button>
                        </div>
                    </td>
                `;
                tableBody?.appendChild(tr);
            });
        }
    }

    window.updateIndividualItemFormat = function(id, val) {
        const item = fileQueue.find(el => el.id === id);
        if (item) item.targetFormat = val;
    };

    /* ============================================================
       CORE COMPILATION DRIVER LAYER (Canvas conversions algorithms)
       ============================================================ */
    function processImageToTargetBytesBlob(item) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = function() {
                try {
                    // Initialize clean isolated canvas element arrays tracking mapping values references
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    let w = img.width;
                    let h = img.height;

                    // Calculate bounding scale parameters factors coordinates checks variables ratios
                    if (item.targetWidth && item.targetHeight) {
                        w = item.targetWidth; h = item.targetHeight;
                    } else if (item.targetWidth && !item.targetHeight) {
                        h = Math.round((item.targetWidth / img.width) * img.height); w = item.targetWidth;
                    } else if (!item.targetWidth && item.targetHeight) {
                        w = Math.round((item.targetHeight / img.height) * img.width); h = item.targetHeight;
                    }

                    canvas.width = w;
                    canvas.height = h;

                    // Shading adjustments parameters fields elements loops references checkmarks background
                    if (item.targetFormat === 'jpeg') {
                        ctx.fillStyle = '#ffffff'; // White solid matte overlay tracking background
                        ctx.fillRect(0, 0, w, h);
                    }

                    ctx.drawImage(img, 0, 0, w, h);

                    const q = item.targetQuality / 100;
                    let dataUrl = '';

                    // Cross-routing string translations elements frameworks allocations keys array data streams
                    if (item.targetFormat === 'jpeg') dataUrl = canvas.toDataURL('image/jpeg', q);
                    else if (item.targetFormat === 'webp') dataUrl = canvas.toDataURL('image/webp', q);
                    else if (item.targetFormat === 'png') dataUrl = canvas.toDataURL('image/png');
                    else if (item.targetFormat === 'ico') dataUrl = canvas.toDataURL('image/x-icon');
                    else if (item.targetFormat === 'svg') {
                        // Text fallback coordinates map wrappers arrays dictionary code elements
                        dataUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><image href="${item.dataUrl}" width="${w}" height="${h}"/></svg>`;
                    } else if (item.targetFormat === 'xml') {
                        dataUrl = `data:text/xml;utf8,<?xml version="1.0" encoding="utf-8"?><vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="${w}dp" android:height="${h}dp" android:viewportWidth="${w}" android:viewportHeight="${h}"><path android:fillColor="#FF0000" android:pathData="M0,0h${w}v${h}H0z"/></vector>`;
                    } else {
                        // Default base64 data payloads structure mappings json strings code fields object arrays
                        const cleanBase = item.dataUrl.split(',')[1] || '';
                        dataUrl = `data:application/json;utf8,{"asset":"${item.name}","bytes":"${cleanBase}"}`;
                    }

                    item.status = 'success';
                    resolve({ success: true, dataUrl: dataUrl, name: item.name, format: item.targetFormat });
                } catch (err) {
                    item.status = 'failed';
                    resolve({ success: false, error: err.message, name: item.name });
                }
            };
            img.onerror = () => {
                item.status = 'failed';
                resolve({ success: false, error: "Canvas decode failed source formats unreadable.", name: item.name });
            };
            img.src = item.dataUrl;
        });
    }

    window.compileAndDownloadSingleItem = async function(id) {
        const item = fileQueue.find(el => el.id === id);
        if (!item) return;
        window.showToastMessageAlert("Compiling image block parameters locally...");
        
        const res = await processImageToTargetBytesBlob(item);
        if (res.success) {
            const downloadLink = document.createElement('a');
            downloadLink.href = res.dataUrl;
            
            const cleanName = res.name.substring(0, res.name.lastIndexOf('.')) || res.name;
            const targetExt = res.format === 'base64_json' ? 'json' : res.format === 'base64_txt' ? 'txt' : res.format;
            downloadLink.download = `${cleanName}_converted.${targetExt}`;
            
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            // Inline elements status updates templates check indications markers
            const cellWrapper = document.getElementById(`action-cell-wrapper-${id}`);
            if (cellWrapper) cellWrapper.innerHTML = `<span style="color:#16a34a; font-weight:bold; font-size:12px;">Completed Verified 🗸</span>`;
            window.showToastMessageAlert("File successfully converted and saved!");
        } else {
            alert("Error converting this item track record bounds: " + res.error);
        }
    };

    /* ============================================================
       BATCH PACKAGING DRIVER (Master zip download compilation)
       ============================================================ */
    if(masterCompileBtn) masterCompileBtn.onclick = async function() {
        if (fileQueue.length === 0) return;

        if(masterCompileBtn) masterCompileBtn.disabled = true;
        if(progressCard) progressCard.hidden = false;
        if(progressFill) progressFill.style.width = '10%';
        if(statusTxt) statusTxt.innerText = "Parsing batch arrays sequence buffers...";
        if(pctLbl) pctLbl.innerText = "10%;";

        try {
            const zip = new window.JSZip();
            let operationsCompleted = 0;

            for (let i = 0; i < fileQueue.length; i++) {
                const item = fileQueue[i];
                if(statusTxt) statusTxt.innerText = `Processing element [${i+1}/${fileQueue.length}]: ${item.name}`;
                
                const res = await processImageToTargetBytesBlob(item);
                if (res.success) {
                    const rawBase64 = res.dataUrl.split(',')[1] || '';
                    const cleanName = res.name.substring(0, res.name.lastIndexOf('.')) || res.name;
                    const targetExt = res.format === 'base64_json' ? 'json' : res.format === 'base64_txt' ? 'txt' : res.format;
                    
                    // Inject directly inside the in-memory virtual tracking system package stream archive
                    zip.file(`${cleanName}_converted.${targetExt}`, rawBase64, { base64: true });
                }
                
                operationsCompleted++;
                const pct = Math.round((operationsCompleted / fileQueue.length) * 80) + 10;
                if(progressFill) progressFill.style.width = pct + '%';
                if(pctLbl) pctLbl.innerText = pct + '%';
            }

            if(statusTxt) statusTxt.innerText = "Encoding stream data packets into master bundle .zip archive package...";
            if(progressFill) progressFill.style.width = '95%';
            if(pctLbl) pctLbl.innerText = '95%';

            const archiveBlob = await zip.generateAsync({ type: 'blob' });
            
            const downloadAnchor = document.createElement('a');
            downloadAnchor.href = URL.createObjectURL(archiveBlob);
            downloadAnchor.download = `tyagihub_batch_converted_${Date.now()}.zip`;
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            document.body.removeChild(downloadAnchor);

            if(progressFill) progressFill.style.width = '100%';
            if(statusTxt) statusTxt.innerText = "Batch package writing compiled natively!";
            if(pctLbl) pctLbl.innerText = '100%';

            window.showToastMessageAlert("Master batch bundle ZIP generated successfully!");
            setTimeout(() => { if(progressCard) progressCard.hidden = true; }, 2000);

        } catch (err) {
            alert("Master batch processing engine failure exception: " + err.message);
            if(progressCard) progressCard.hidden = true;
        } finally {
            if(masterCompileBtn) masterCompileBtn.disabled = false;
            window.loadIndividualViewStatusSyncAfterBatchRun();
        }
    };

    window.loadIndividualViewStatusSyncAfterBatchRun = function() {
        fileQueue.forEach(item => {
            const cellWrapper = document.getElementById(`action-cell-wrapper-${item.id}`);
            if (cellWrapper) {
                if (item.status === 'success') {
                    cellWrapper.innerHTML = `<span style="color:#16a34a; font-weight:bold; font-size:12px;">Completed 🗸</span>`;
                } else if (item.status === 'failed') {
                    cellWrapper.innerHTML = `<span style="color:#ef4444; font-weight:bold; font-size:12px;">Failed ✕</span>`;
                }
            }
        });
    };

    /* ============================================================
       RESET SANDBOX PIPELINE WIPE CLEAN OPERATIONS
       ============================================================ */
    if(resetBtn) resetBtn.onclick = function() {
        const check = confirm("Are you sure you want to clean up current conversion queue and wipe sandbox memories?");
        if (!check) return;

        fileQueue = [];
        selectedBlockId = null;
        if(rawFileInput) rawFileInput.value = '';
        if(zipFileInput) zipFileInput.value = '';
        if(globalWidth) globalWidth.value = '';
        if(globalHeight) globalHeight.value = '';
        if(workspace) workspace.hidden = true;
        if(progressCard) progressCard.hidden = true;

        window.showToastMessageAlert("Sandbox memory structures successfully wiped clean.");
    };
});