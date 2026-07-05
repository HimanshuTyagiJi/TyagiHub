import React, { useState, useEffect, useRef } from "react";
import { jsPDF } from "jspdf";
import { 
  Lock, 
  FileText, 
  FileArchive, 
  Video, 
  Image as ImageIcon, 
  AlertTriangle 
} from "lucide-react";
import { 
  deobfuscateSVG, 
  addSvgWatermark, 
  isSvgContent, 
  stripHtml 
} from "../utils/drm";
import { 
  defaultPdfPages, 
  realInvoicePages, 
  realResumePages 
} from "../data/templates";

/**
 * Custom Canvas-based SVG Renderer to prevent users from inspecting 
 * and grabbing raw SVG paths from the DOM.
 */
export const SvgCanvasRenderer = ({ svgContent, isFree, className }) => {
  const canvasRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    if (!svgContent) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let preparedSvg = svgContent;
    if (preparedSvg && !preparedSvg.includes("xmlns=")) {
      preparedSvg = preparedSvg.replace(/<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    const blob = new Blob([preparedSvg], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.src = url;

    img.onload = () => {
      if (!active) {
        URL.revokeObjectURL(url);
        return;
      }

      let width = 600;
      let height = 600;

      const viewBoxMatch = svgContent.match(
        /viewBox=["\x27]\s*([0-9.-]+)\s+([0-9.-]+)\s+([0-9.-]+)\s+([0-9.-]+)/i
      );
      if (viewBoxMatch) {
        width = parseFloat(viewBoxMatch[3]);
        height = parseFloat(viewBoxMatch[4]);
      } else {
        const wMatch = svgContent.match(/width=["\x27]\s*([0-9%px\s.-]+)/i);
        const hMatch = svgContent.match(/height=["\x27]\s*([0-9%px\s.-]+)/i);
        if (wMatch && hMatch) {
          const wVal = parseFloat(wMatch[1]);
          const hVal = parseFloat(hMatch[1]);
          if (!isNaN(wVal) && !isNaN(hVal)) {
            width = wVal;
            height = hVal;
          }
        }
      }

      if (isNaN(width) || width <= 0) width = 600;
      if (isNaN(height) || height <= 0) height = 600;

      canvas.width = width;
      canvas.height = height;

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Render DRM watermark directly on the canvas to ensure perfect compatibility
      if (!isFree) {
        // Draw diagonal watermark lines
        ctx.strokeStyle = "rgba(239, 68, 68, 0.18)";
        ctx.lineWidth = Math.max(1.5, width / 200);
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(width, height);
        ctx.moveTo(width, 0);
        ctx.lineTo(0, height);
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash

        // Draw watermark text
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.rotate(-Math.PI / 10); // Rotate slightly (-18 degrees)
        
        const fontSize1 = Math.max(12, Math.floor(width / 18));
        ctx.font = `900 ${fontSize1}px "Plus Jakarta Sans", sans-serif`;
        ctx.fillStyle = "rgba(239, 68, 68, 0.55)";
        ctx.textAlign = "center";
        ctx.fillText("TyagiHub Secure DRM", 0, -fontSize1 / 2);

        const fontSize2 = Math.max(9, Math.floor(width / 26));
        ctx.font = `800 ${fontSize2}px "Plus Jakarta Sans", sans-serif`;
        ctx.fillStyle = "rgba(239, 68, 68, 0.45)";
        ctx.fillText("DO NOT ALTER OR REUSE", 0, fontSize2 * 1.2 - fontSize1 / 2);
        ctx.restore();

        // Draw warning footer banner at the bottom
        const bannerHeight = Math.max(25, height * 0.15);
        ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
        ctx.fillRect(0, height - bannerHeight, width, bannerHeight);

        const bannerFontSize = Math.max(8, Math.floor(width / 45));
        ctx.font = `bold ${bannerFontSize}px "JetBrains Mono", monospace`;
        ctx.fillStyle = "#fca5a5";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          "SECURED SVG PREVIEW",
          width / 2,
          height - bannerHeight / 2
        );
      }

      URL.revokeObjectURL(url);
    };

    img.onerror = (e) => {
      console.error("Canvas SVG Rendering Error:", e);
      if (active) setError(true);
      URL.revokeObjectURL(url);
    };

    return () => {
      active = false;
      URL.revokeObjectURL(url);
    };
  }, [svgContent, isFree]);

  if (error) {
    return (
      <div className="text-slate-500 text-xs text-center py-4">
        Preview restricted or unrenderable.
      </div>
    );
  }

  return (
    <div 
      className={`relative w-full h-full flex items-center justify-center p-3 bg-slate-950/80 rounded-xl overflow-hidden select-none ${className}`}
      style={{ minHeight: "180px" }}
      onContextMenu={(e) => e.preventDefault()}
      draggable="false"
    >
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full w-auto h-auto object-contain pointer-events-none"
        style={{ userSelect: "none", pointerEvents: "none" }}
        onContextMenu={(e) => e.preventDefault()}
        draggable="false"
      />
      <div
        className="absolute inset-0 z-30 bg-transparent cursor-default select-none"
        onContextMenu={(e) => e.preventDefault()}
        draggable="false"
        style={{ userSelect: "none", WebkitUserSelect: "none" }}
      />
    </div>
  );
};

/**
 * Secure PDF Download Generator
 */
export const downloadAsPdf = (title, content) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  const drawHeaderFooter = (pageNum, totalPages) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text("TYAGIHUB SECURE DOCUMENT PROTOCOL", margin, 12);
    doc.setFont("helvetica", "normal");
    doc.text("VERIFIED ORIGINAL (ORIGINAL CERTIFIED)", pageWidth - margin, 12, { align: "right" });
    
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(margin, 14, pageWidth - margin, 14);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    doc.setFontSize(7.5);
    doc.setTextColor(156, 163, 175);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: "right" });
    doc.text("Securely distributed by TyagiHub Store (golutyagi9710@gmail.com)", margin, pageHeight - 10);
  };

  let pagesList = content
    .split(/\[PAGE\]|---|—/i)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (pagesList.length === 0) {
    pagesList = [content];
  }

  const totalPDFPages = pagesList.length;

  for (let pIdx = 0; pIdx < totalPDFPages; pIdx++) {
    if (pIdx > 0) {
      doc.addPage();
    }

    let yPos = 22;
    if (pIdx === 0) {
      yPos = 28;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(17, 24, 39);
      doc.splitTextToSize(title.toUpperCase(), contentWidth).forEach((line) => {
        doc.text(line, pageWidth / 2, yPos, { align: "center" });
        yPos += 8;
      });
      yPos += 2;
      doc.setDrawColor(79, 70, 229);
      doc.setLineWidth(1.2);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 12;
    }

    drawHeaderFooter(pIdx + 1, totalPDFPages);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(55, 65, 81);

    const cleanPageText = pagesList[pIdx].replace(/\r\n/g, "\n");
    const lines = doc.splitTextToSize(cleanPageText, contentWidth);
    const lineHeight = 6.8;

    for (let lIdx = 0; lIdx < lines.length; lIdx++) {
      if (yPos > pageHeight - 25) {
        doc.addPage();
        yPos = 22;
        drawHeaderFooter(pIdx + 1, totalPDFPages);
      }
      doc.text(lines[lIdx], margin, yPos);
      yPos += lineHeight;
    }
  }

  const filename = `${title.toLowerCase().replace(/[^a-z0-9]/g, "_").substring(0, 40)}_unlocked_tyagihub.pdf`;
  doc.save(filename);
};

/**
 * Secure MS Word DOC Download Generator
 */
export const downloadAsDoc = (title, content) => {
  const cleanContent = content.replace(/\[PAGE\]|---|—/gi, "\n\n");
  const paragraphsHtml = cleanContent
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((u) => u.trim())
    .filter((u) => u.length > 0)
    .map(
      (u) => `<p style="margin-bottom: 12pt; text-align: justify; font-size: 11pt; line-height: 150%; font-family: 'Calibri', 'Arial', sans-serif; color: #2D3748;">${u}</p>`
    )
    .join("");

  const docHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page {
          size: 8.5in 11in;
          margin: 1.0in 1.0in 1.0in 1.0in;
          mso-header-margin: 0.5in;
          mso-footer-margin: 0.5in;
        }
        body {
          font-family: 'Calibri', 'Arial', sans-serif;
        }
        .header-title {
          font-size: 20pt;
          font-weight: bold;
          color: #1A202C;
          text-align: center;
          margin-bottom: 4pt;
          text-transform: uppercase;
        }
        .subtitle {
          font-size: 8.5pt;
          font-family: 'Courier New', monospace;
          color: #4F46E5;
          text-align: center;
          font-weight: bold;
          margin-bottom: 15pt;
          letter-spacing: 1.5px;
        }
        .divider {
          border-bottom: 2px solid #4F46E5;
          margin-bottom: 20pt;
        }
        .footer {
          margin-top: 40pt;
          border-top: 1px solid #E2E8F0;
          padding-top: 10pt;
          font-size: 8pt;
          color: #A0AEC0;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="header-title">${title}</div>
      <div class="subtitle">SECURE DOCUMENT PROTOCOL • TYAGIHUB VERIFIED ORIGINAL</div>
      <div class="divider"></div>
      
      <div class="content-body">
        ${paragraphsHtml}
      </div>

      <div class="footer">
        <p>Securely downloaded via TyagiHub Store (golutyagi9710@gmail.com) • Verified Original Solutions Document</p>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(["\uFEFF" + docHtml], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "_").substring(0, 40);
  a.download = `${cleanTitle}_unlocked_tyagihub.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * SecurePreview (Vx) - Displays document sheets or watermarked vectors under secure DRM constraint
 */
export default function SecurePreview({
  src,
  alt,
  isFree,
  className = "",
  type = "image",
  pdfContent = "",
  assetId = ""
}) {
  const [imageSrc, setImageSrc] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [currentPageIdx, setCurrentPageIdx] = useState(0);

  useEffect(() => {
    let active = true;
    setError(false);
    setUseFallback(false);

    if (!src || src.trim() === "" || src.includes("placeholder")) {
      setError(true);
      setLoading(false);
      return;
    }

    if (type === "zip" || isSvgContent(src) || (typeof src === "string" && src.startsWith("DRM_SECURE_V1_"))) {
      setLoading(false);
      return;
    }

    if (isFree) {
      setImageSrc(src);
      setLoading(false);
      return;
    }

    // Load image and render watermark on client canvas
    const imgObj = new Image();
    imgObj.crossOrigin = "anonymous";
    imgObj.src = src;

    imgObj.onload = () => {
      if (!active) return;
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas context failed");

        canvas.width = imgObj.naturalWidth || 800;
        canvas.height = imgObj.naturalHeight || 500;
        
        ctx.drawImage(imgObj, 0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 8);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);

        const fontSize = Math.max(14, Math.floor(canvas.width / 25));
        ctx.font = `900 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
        ctx.fillStyle = "rgba(239, 68, 68, 0.6)";
        ctx.textAlign = "center";

        const rowStep = canvas.height / 4;
        const colStep = canvas.width / 2;

        for (let r = -1; r <= 5; r++) {
          for (let c = -1; c <= 3; c++) {
            ctx.fillText(
              "TyagiHub Secure DRM Protected • DO NOT ALTER",
              c * colStep,
              r * rowStep
            );
          }
        }

        ctx.restore();
        ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
        ctx.fillRect(0, canvas.height - 40, canvas.width, 40);

        const bannerTextSize = Math.max(11, Math.floor(canvas.width / 55));
        ctx.font = `bold ${bannerTextSize}px "JetBrains Mono", monospace`;
        ctx.fillStyle = "#fca5a5";
        ctx.textAlign = "center";
        ctx.fillText(
          "TYAGIHUB SECURED DRM STORE • UNAUTHORIZED DOWNLOAD BLOCKED",
          canvas.width / 2,
          canvas.height - 15
        );

        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setImageSrc(dataUrl);
        setUseFallback(false);
        setError(false);
        setLoading(false);
      } catch (err) {
        triggerFallback();
      }
    };

    imgObj.onerror = () => {
      if (active) triggerFallback();
    };

    function triggerFallback() {
      const fallbackImg = new Image();
      fallbackImg.src = src;
      fallbackImg.onload = () => {
        if (active) {
          setImageSrc(src);
          setUseFallback(true);
          setError(false);
          setLoading(false);
        }
      };
      fallbackImg.onerror = () => {
        if (active) {
          setError(true);
          setLoading(false);
        }
      };
    }

    return () => {
      active = false;
      imgObj.onload = null;
      imgObj.onerror = null;
    };
  }, [src, isFree, type]);

  // Handle SVG DRM Preview
  if (isSvgContent(src) || (typeof src === "string" && src.startsWith("DRM_SECURE_V1_"))) {
    const rawSvg = src.startsWith("DRM_SECURE_V1_") ? deobfuscateSVG(src) : src;
    return <SvgCanvasRenderer svgContent={rawSvg} isFree={isFree} className={className} />;
  }

  // Handle Multi-page PDF/Document Preview
  if (type === "pdf" || type === "document" || type === "doc" || type === "docx") {
    let pagesList = [];
    let rawContent = pdfContent;

    if (!rawContent || rawContent.trim().length < 20) {
      if (assetId === "PROD-DOC-INV" || (alt && alt.toLowerCase().includes("invoice"))) {
        rawContent = realInvoicePages.join("\n\n[PAGE]\n\n");
      } else if (
        assetId === "PROD-DOC-RES" ||
        (alt && alt.toLowerCase().includes("resume")) ||
        (alt && alt.toLowerCase().includes("cv"))
      ) {
        rawContent = realResumePages.join("\n\n[PAGE]\n\n");
      } else {
        rawContent = "Complete syllabus preparation guide and verified answers.";
      }
    }

    if (rawContent && (rawContent.trim().startsWith("<!DOCTYPE html>") || rawContent.trim().startsWith("<html") || /<[a-z][\s\S]*>/i.test(rawContent))) {
      rawContent = stripHtml(rawContent);
    }

    if (rawContent && rawContent.trim().length > 10) {
      pagesList = rawContent
        .split(/\[PAGE\]|---|—/i)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
      
      if (pagesList.length <= 1) {
        const paragraphs = rawContent.split("\n").filter((p) => p.trim().length > 0);
        pagesList = [];
        let currentPage = "";
        for (const p of paragraphs) {
          if (currentPage.length + p.length > 500) {
            pagesList.push(currentPage);
            currentPage = p;
          } else {
            currentPage += (currentPage ? "\n\n" : "") + p;
          }
        }
        if (currentPage) pagesList.push(currentPage);
      }
    }

    if (pagesList.length === 0) {
      pagesList = defaultPdfPages;
    }

    const totalPages = pagesList.length;
    let maxAllowedPages = 1;
    if (totalPages > 10) {
      maxAllowedPages = 4;
    } else if (totalPages === 2) {
      maxAllowedPages = 1;
    } else if (totalPages >= 3 && totalPages <= 10) {
      maxAllowedPages = 2;
    }

    const allowedCount = isFree ? totalPages : maxAllowedPages;
    const isPageLocked = currentPageIdx >= allowedCount;

    const handlePrevPage = () => {
      setCurrentPageIdx((prev) => Math.max(0, prev - 1));
    };

    const handleNextPage = () => {
      setCurrentPageIdx((prev) => Math.min(totalPages - 1, prev + 1));
    };

    const handleUnlockClick = () => {
      const checkoutEl =
        document.getElementById("checkout-panel") ||
        document.getElementById("paytm-upi-ref") ||
        document.querySelector("form");
      if (checkoutEl) {
        checkoutEl.scrollIntoView({ behavior: "smooth" });
      } else {
        alert("Please claim/unlock this premium file using the UPI checkout form below!");
      }
    };

    return (
      <div
        className={`relative w-full aspect-[1/1.414] min-h-[380px] max-h-[460px] rounded-xl shadow-2xl p-5 select-none overflow-hidden transition-all flex flex-col justify-between border text-left ${
          isFree 
            ? "bg-white border-emerald-300 text-slate-800" 
            : "bg-white border-slate-200 text-slate-800"
        }`}
        style={{ fontFamily: "'Calibri', 'Arial', sans-serif" }}
        onContextMenu={(e) => e.preventDefault()}
        draggable="false"
      >
        <div
          className="absolute inset-0 z-30 bg-transparent cursor-default"
          onContextMenu={(e) => e.preventDefault()}
          draggable="false"
        />

        {!isFree && !isPageLocked && (
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden flex flex-col justify-around py-4 rotate-[-15deg] scale-110 opacity-[0.07] z-10">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={idx}
                className="flex justify-around gap-2 text-[9px] font-mono font-black text-rose-600 uppercase tracking-widest whitespace-nowrap"
              >
                <span>PREVIEW • TYAGIHUB SECURE • PAY TO UNLOCK</span>
                <span>PREVIEW • TYAGIHUB SECURE • PAY TO UNLOCK</span>
              </div>
            ))}
          </div>
        )}

        <div className="border-b-2 border-indigo-500 pb-1.5 mb-3 relative z-20 text-left">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-mono font-bold text-indigo-600 tracking-wider">
              {isFree ? "✓ TYAGIHUB UNLOCKED PDF" : "🔒 TYAGIHUB SECURE DRM PREVIEW"}
            </span>
            <span className="text-[9px] font-mono font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
              PAGE {currentPageIdx + 1} / {totalPages}
            </span>
          </div>
          <h3 className="text-[11px] font-extrabold text-slate-900 mt-1 uppercase tracking-tight line-clamp-1">
            {alt}
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 text-[11px] leading-relaxed text-slate-700 text-justify relative z-20 scrollbar-none">
          {isPageLocked ? (
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white z-40 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-12 h-12 bg-rose-950 border border-rose-800 text-rose-400 rounded-full flex items-center justify-center text-xl shadow-lg mb-3 animate-bounce">
                🔒
              </div>
              <h4 className="text-xs font-black uppercase tracking-wider text-rose-400">
                Page Locked (DRM Protected)
              </h4>
              <p className="text-[10px] text-slate-300 mt-2 leading-relaxed max-w-xs mx-auto">
                This document contains {totalPages} pages of premium educational study notes. 
                You have viewed the free preview of {maxAllowedPages} page{maxAllowedPages > 1 ? "s" : ""}.
                <span className="block mt-1.5 text-indigo-400 font-semibold">
                  Please unlock the document to instantly read the remaining pages and download the pristine PDF/Word files.
                </span>
              </p>
              <button
                onClick={handleUnlockClick}
                className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 px-3 rounded-lg text-[9px] uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shadow-md shadow-indigo-950/40"
              >
                <Lock className="w-3 h-3" />
                Unlock Full PDF Now
              </button>
            </div>
          ) : (
            <div className="space-y-3 text-left whitespace-pre-line text-[10.5px]">
              {isFree ? (
                <p className="text-[9px] font-mono font-black text-emerald-600 tracking-wider border-b border-emerald-100 pb-0.5 flex items-center gap-1">
                  <span>✓ SECURED ORIGINAL STUDENT COPY</span>
                </p>
              ) : (
                <p className="text-[9px] font-mono font-black text-indigo-600 tracking-wider border-b border-slate-100 pb-0.5 flex items-center justify-between">
                  <span>📄 FREE PREVIEW EXTRACT</span>
                  <span className="text-[7.5px] bg-rose-100 text-rose-700 px-1 py-0.2 rounded font-black uppercase">
                    SECURED
                  </span>
                </p>
              )}
              <p className="text-slate-800 leading-relaxed font-serif text-left">
                {pagesList[currentPageIdx]}
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 pt-2 mt-3 flex items-center justify-between relative z-20">
          <div className="flex gap-1.5">
            <button
              onClick={handlePrevPage}
              disabled={currentPageIdx === 0}
              className="px-2.5 py-1 text-[9px] font-extrabold uppercase rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 transition-colors cursor-pointer"
            >
              ← Prev
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPageIdx === totalPages - 1}
              className="px-2.5 py-1 text-[9px] font-extrabold uppercase rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-40 transition-colors cursor-pointer"
            >
              Next →
            </button>
          </div>
          <span className="text-[7.5px] font-mono text-slate-400 uppercase tracking-wider">
            {isFree ? "VERIFIED DOWNLOAD UNLOCKED" : "🔒 DRM PREVIEW ACTIVE"}
          </span>
        </div>
      </div>
    );
  }

  // Handle ZIP, Video, other downloads pre-preview wrapper
  if (type === "zip" || error) {
    let theme = {
      bg: "from-rose-950/30 to-slate-950",
      border: "border-rose-900/40",
      iconColor: "text-rose-400",
      glow: "shadow-rose-950/15",
      badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    };

    if (type === "zip") {
      theme = {
        bg: "from-amber-950/30 to-slate-950",
        border: "border-amber-900/40",
        iconColor: "text-amber-400",
        glow: "shadow-amber-950/15",
        badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      };
    } else if (type === "video") {
      theme = {
        bg: "from-purple-950/30 to-slate-950",
        border: "border-purple-900/40",
        iconColor: "text-purple-400",
        glow: "shadow-purple-950/15",
        badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      };
    } else if (type === "image") {
      theme = {
        bg: "from-blue-950/30 to-slate-950",
        border: "border-blue-900/40",
        iconColor: "text-blue-400",
        glow: "shadow-blue-950/15",
        badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      };
    }

    return (
      <div className={`relative w-full h-full bg-gradient-to-br ${theme.bg} border ${theme.border} ${theme.glow} shadow-2xl flex flex-col items-center justify-center p-6 select-none overflow-hidden min-h-[160px]`}>
        {!isFree && (
          <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center overflow-hidden opacity-10">
            <div className="absolute inset-0 flex flex-wrap gap-4 p-2 justify-around content-around rotate-[-15deg] scale-125 text-[8px] font-mono font-bold tracking-widest text-rose-500 uppercase">
              {Array.from({ length: 6 }).map((_, i) => (
                <span key={i} className="whitespace-nowrap">TYAGIHUB DRM PROTECTED</span>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-col items-center text-center space-y-3 z-10">
          <div className={`p-4 rounded-2xl bg-slate-950/80 border ${theme.border} shadow-lg flex items-center justify-center relative`}>
            {type === "pdf" && <FileText className={`w-8 h-8 ${theme.iconColor}`} />}
            {type === "zip" && <FileArchive className={`w-8 h-8 ${theme.iconColor}`} />}
            {type === "video" && <Video className={`w-8 h-8 ${theme.iconColor}`} />}
            {type === "image" && <ImageIcon className={`w-8 h-8 ${theme.iconColor}`} />}
            {type !== "pdf" && type !== "zip" && type !== "video" && type !== "image" && (
              <FileText className="w-8 h-8 text-indigo-400" />
            )}
            <div className="absolute -bottom-1 -right-1 bg-slate-900 border border-slate-800 rounded-full p-1 shadow-md">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
            </div>
          </div>
          <div className="space-y-1">
            <span className={`inline-block px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded border ${theme.badge}`}>
              Secure Preview
            </span>
            <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">
              Premium {type} File
            </h4>
            <p className="text-[10px] text-slate-400 max-w-[240px] leading-relaxed">
              Secure GitHub Cloud verification active. Purchase to unlock permanent downloads.
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 inset-x-0 bg-slate-950/90 py-1.5 border-t border-slate-900 flex items-center justify-center gap-1.5 px-3 z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-[8px] font-mono font-semibold text-slate-400 uppercase tracking-widest">
            TYAGIHUB AUTOMATED PRE-DOWNLOAD DRM GATEWAY
          </span>
        </div>
      </div>
    );
  }

  // Handle standard images with client-side canvas watermarking
  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {loading && (
        <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-1.5 z-30">
          <div className="w-6 h-6 rounded-full border border-slate-850 border-t-indigo-500 animate-spin" />
          <span className="text-[9px] font-mono text-slate-500 tracking-wider">
            DRM SECURING...
          </span>
        </div>
      )}
      <img
        src={imageSrc || src}
        alt={alt}
        referrerPolicy="no-referrer"
        className={`${className} select-none pointer-events-none`}
        draggable="false"
      />
      {useFallback && !isFree && (
        <>
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-10 flex flex-col justify-around py-4 scale-110">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex justify-around gap-2 whitespace-nowrap text-[9px] font-mono font-black text-rose-500 uppercase tracking-widest select-none pointer-events-none rotate-[-18deg]"
                style={{ mixBlendMode: "difference", opacity: 0.4 }}
              >
                <span>TyagiHub Secure DRM • DO NOT ALTER</span>
                <span>TyagiHub Secure DRM • DO NOT ALTER</span>
              </div>
            ))}
          </div>
          <div className="absolute bottom-0 inset-x-0 bg-slate-950/90 py-1.5 text-[8px] font-mono font-bold text-red-300 text-center uppercase tracking-widest border-t border-slate-900/60 z-15 select-none pointer-events-none">
            TYAGIHUB SECURE DRM PROTECTED • PRE-DOWNLOAD PREVIEW
          </div>
        </>
      )}
      {!isFree && (
        <div className="absolute inset-0 z-20 bg-slate-950/20 backdrop-blur-[0.5px]" />
      )}
    </div>
  );
}
