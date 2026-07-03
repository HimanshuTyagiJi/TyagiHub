"use strict"; 
import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Lock,
  QrCode,
  FileImage,
  FileText,
  Video as VideoIcon,
  Archive,
  PlusCircle,
  Download,
  AlertTriangle,
  Trash2,
  Search,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Inbox,
  Clock,
  ExternalLink,
  ChevronRight,
  X,
  CheckSquare,
  Square,
  SlidersHorizontal,
  User,
  UserCheck,
  Crown,
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { jsPDF } from "jspdf";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
export const extractDriveId = (input) => {
  if (!input) return "";
  const regExp = /(?:https?:\/\/)?(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|docs\.google\.com\/(?:file\/d\/))([a-zA-Z0-9_-]{25,100})/;
  const match = String(input).match(regExp);
  return match && match[1] ? match[1] : "";
};
export const getAssetPreviewUrl = (asset) => {
  const rawUrl = (asset.previewUrl || "").trim();
  const rawDriveUrl = (asset.driveId || "").trim();
  const driveIdFromPreview = extractDriveId(rawUrl);
  const driveIdFromSource = extractDriveId(rawDriveUrl);
  const targetDriveId = driveIdFromPreview || (rawUrl === "" || rawUrl.includes("images.unsplash.com") ? driveIdFromSource : "");
  if (targetDriveId) {
    return `https://drive.google.com/thumbnail?id=${targetDriveId}&sz=w800`;
  }
  return rawUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80";
};
export const getAssetCategory = (asset) => {
  const title = (asset.title || "").toLowerCase();
  const desc = (asset.description || "").toLowerCase();
  const type = (asset.type || "").toLowerCase();
  if (title.includes("icon") || desc.includes("icon") || title.includes("svg") || desc.includes("svg")) {
    return "icons";
  }
  if (title.includes("illustration") || desc.includes("illustration") || title.includes("draw") || desc.includes("draw")) {
    return "illustrations";
  }
  if (title.includes("background") || desc.includes("background") || title.includes("wallpaper") || desc.includes("wallpaper") || title.includes("wave") || desc.includes("wave")) {
    return "backgrounds";
  }
  if (title.includes("template") || desc.includes("template") || title.includes("pitch") || desc.includes("pitch") || type === "zip" && (title.includes("code") || desc.includes("code"))) {
    return "templates";
  }
  if (type === "pdf" || title.includes("document") || desc.includes("document") || title.includes("paper") || desc.includes("paper") || title.includes("book") || desc.includes("book") || title.includes("notes") || desc.includes("notes")) {
    return "documents";
  }
  if (type === "image" && (title.includes("photo") || desc.includes("photo") || title.includes("scenery") || desc.includes("scenery"))) {
    return "photos";
  }
  if (type === "video" || title.includes("video") || desc.includes("video") || title.includes("loop") || desc.includes("loop")) {
    return "videos";
  }
  if (title.includes("mockup") || desc.includes("mockup")) {
    return "mockups";
  }
  if (title.includes("font") || desc.includes("font") || title.includes("typography") || desc.includes("typography")) {
    return "fonts";
  }
  if (type === "pdf") return "documents";
  if (type === "video") return "videos";
  return "illustrations";
};
export const getAssetSidebarType = (asset) => {
  const type = (asset.type || "").toLowerCase();
  const title = (asset.title || "").toLowerCase();
  const desc = (asset.description || "").toLowerCase();
  if (title.includes("svg") || desc.includes("svg") || title.includes("icon") || desc.includes("icon")) {
    return "svg";
  }
  if (type === "pdf") return "pdf";
  if (type === "video") return "video";
  if (type === "zip" && (title.includes("ppt") || title.includes("template") || desc.includes("ppt") || desc.includes("template"))) {
    return "ppt";
  }
  if (type === "image") return "image";
  return "other";
};
export const isRawSvg = (input) => {
  if (!input) return false;
  const trimmed = input.trim();
  return trimmed.startsWith("<svg") || trimmed.includes("<svg") || trimmed.includes('xmlns="http://www.w3.org/2000/svg"');
};
export const getWatermarkedSVG = (rawSvg, isFree) => {
  if (isFree) return rawSvg;
  const watermarkGroup = `
    <g id="tyagihub-svg-drm-watermark" style="pointer-events: none; user-select: none;">
      <!-- Elegant diagonal dotted lines crossing the canvas -->
      <line x1="0" y1="0" x2="100%" y2="100%" stroke="rgba(239, 68, 68, 0.18)" stroke-width="3" stroke-dasharray="10,10" />
      <line x1="100%" y1="0" x2="0" y2="100%" stroke="rgba(239, 68, 68, 0.18)" stroke-width="3" stroke-dasharray="10,10" />
      
      <!-- Premium high-visibility DRM text watermarks -->
      <text x="50%" y="38%" fill="rgba(239, 68, 68, 0.55)" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="24" font-weight="900" text-anchor="middle" transform="rotate(-18, 150, 150)">TyagiHub Secure DRM</text>
      <text x="50%" y="62%" fill="rgba(239, 68, 68, 0.45)" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="16" font-weight="800" text-anchor="middle" transform="rotate(-18, 150, 150)">DO NOT ALTER OR REUSE</text>
      
      <!-- Solid warning footer banner for unauthorized views -->
      <rect x="0" y="85%" width="100%" height="15%" fill="rgba(15, 23, 42, 0.95)" rx="4" />
      <text x="50%" y="94%" fill="#fca5a5" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="bold" text-anchor="middle">\u{1F512} TYAGIHUB SECURED SVG PREVIEW</text>
    </g>
  `;
  const closeIndex = rawSvg.lastIndexOf("</svg>");
  if (closeIndex !== -1) {
    return rawSvg.substring(0, closeIndex) + watermarkGroup + rawSvg.substring(closeIndex);
  }
  return rawSvg;
};
export function SecurePreviewImage({ src, alt, isFree, className, type = "image", pdfContent }) {
  const [displaySrc, setDisplaySrc] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [useOverlayWatermark, setUseOverlayWatermark] = useState(false);
  useEffect(() => {
    let isMounted = true;
    setHasError(false);
    setUseOverlayWatermark(false);
    if (!src || src.trim() === "" || src.includes("placeholder")) {
      setHasError(true);
      setLoading(false);
      return;
    }
    if (type === "zip" || isRawSvg(src)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    if (isFree) {
      setDisplaySrc(src);
      setLoading(false);
      return;
    }
    const imgCORS = new Image();
    imgCORS.crossOrigin = "anonymous";
    imgCORS.src = src;
    imgCORS.onload = () => {
      if (!isMounted) return;
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Canvas 2D context unavailable");
        }
        canvas.width = imgCORS.naturalWidth || 800;
        canvas.height = imgCORS.naturalHeight || 500;
        ctx.drawImage(imgCORS, 0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 8);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        const fontSize = Math.max(14, Math.floor(canvas.width / 25));
        ctx.font = `900 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
        ctx.fillStyle = "rgba(239, 68, 68, 0.6)";
        ctx.textAlign = "center";
        const stepY = canvas.height / 4;
        const stepX = canvas.width / 2;
        for (let i = -1; i <= 5; i++) {
          for (let j = -1; j <= 3; j++) {
            ctx.fillText(
              "TyagiHub Secure DRM Protected \u2022 DO NOT ALTER",
              j * stepX,
              i * stepY
            );
          }
        }
        ctx.restore();
        ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
        ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
        ctx.font = `bold ${Math.max(11, Math.floor(canvas.width / 55))}px "JetBrains Mono", monospace`;
        ctx.fillStyle = "#fca5a5";
        ctx.textAlign = "center";
        ctx.fillText("TYAGIHUB SECURED DRM STORE \u2022 UNAUTHORIZED DOWNLOAD BLOCKED", canvas.width / 2, canvas.height - 15);
        const base64Watermarked = canvas.toDataURL("image/jpeg", 0.85);
        setDisplaySrc(base64Watermarked);
        setUseOverlayWatermark(false);
        setHasError(false);
        setLoading(false);
      } catch (err) {
        loadWithNoCORSFallback();
      }
    };
    imgCORS.onerror = () => {
      if (!isMounted) return;
      loadWithNoCORSFallback();
    };
    function loadWithNoCORSFallback() {
      const imgNoCORS = new Image();
      imgNoCORS.src = src;
      imgNoCORS.onload = () => {
        if (!isMounted) return;
        setDisplaySrc(src);
        setUseOverlayWatermark(true);
        setHasError(false);
        setLoading(false);
      };
      imgNoCORS.onerror = () => {
        if (!isMounted) return;
        setHasError(true);
        setLoading(false);
      };
    }
    return () => {
      isMounted = false;
      imgCORS.onload = null;
      imgCORS.onerror = null;
    };
  }, [src, isFree, type]);
  if (isRawSvg(src)) {
    const finalSvg = getWatermarkedSVG(src, isFree);
    return <div
      className={`relative w-full h-full flex items-center justify-center p-3 bg-slate-950/80 rounded-xl overflow-hidden select-none ${className}`}
      style={{ minHeight: "180px" }}
      onContextMenu={(e) => e.preventDefault()}
      draggable="false"
    >
        <div
      className="w-full h-full flex items-center justify-center svg-container [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto"
      dangerouslySetInnerHTML={{ __html: finalSvg }}
    />
        <div
      className="absolute inset-0 z-30 bg-transparent cursor-default"
      onContextMenu={(e) => e.preventDefault()}
      draggable="false"
    />
      </div>;
  }
  if (type === "pdf") {
    const fullContent = pdfContent || "Complete syllabus preparation guide and verified answers.";
    const previewLength = Math.max(100, Math.floor(fullContent.length * 0.2));
    const previewText = fullContent.substring(0, previewLength);
    return <div
      className={`relative w-full aspect-[1/1.414] min-h-[360px] max-h-[440px] rounded-xl shadow-2xl p-6 select-none overflow-hidden transition-all flex flex-col justify-between border text-left ${isFree ? "bg-white border-emerald-300 text-slate-800" : "bg-white border-slate-250 text-slate-800"}`}
      style={{ fontFamily: "'Calibri', 'Arial', sans-serif" }}
      onContextMenu={(e) => e.preventDefault()}
      draggable="false"
    >
        <div
      className="absolute inset-0 z-30 bg-transparent cursor-default"
      onContextMenu={(e) => e.preventDefault()}
      draggable="false"
    />

        {!isFree && <div className="absolute inset-0 pointer-events-none select-none overflow-hidden flex flex-col justify-around py-4 rotate-[-15deg] scale-110 opacity-[0.08] z-10">
            {Array.from({ length: 5 }).map((_, rIdx) => <div key={rIdx} className="flex justify-around gap-2 text-[10px] font-mono font-black text-rose-600 uppercase tracking-widest whitespace-nowrap">
                <span>PREVIEW • TYAGIHUB SECURE • PAY TO UNLOCK</span>
                <span>PREVIEW • TYAGIHUB SECURE • PAY TO UNLOCK</span>
              </div>)}
          </div>}

        <div className="border-b-2 border-indigo-500 pb-2 mb-4 relative z-20 text-left">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold text-indigo-600 tracking-wider">TYAGIHUB SECURE DOC</span>
            <span className="text-[9px] font-mono font-semibold text-slate-400">PAGE 1 / 15</span>
          </div>
          <h3 className="text-xs font-extrabold text-slate-900 mt-1 uppercase tracking-tight line-clamp-1">{alt}</h3>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 text-[11px] leading-relaxed text-slate-700 text-justify relative z-20 scrollbar-none">
          {isFree ? <div className="space-y-3 whitespace-pre-line text-left">
              <p className="text-[10px] font-mono font-black text-emerald-600 tracking-wider border-b border-emerald-100 pb-1 flex items-center gap-1">
                <span>✓ UNLOCKED ORIGINAL FULL TEXT</span>
              </p>
              <p className="text-slate-700 leading-relaxed text-left">{fullContent}</p>
            </div> : <div className="space-y-3 text-left">
              <p className="text-[9.5px] font-mono font-black text-indigo-600 tracking-wider border-b border-slate-100 pb-1 flex items-center justify-between">
                <span>📄 PREVIEW EXTRACT (FIRST 20%)</span>
                <span className="text-[8px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-black uppercase">DRM SECURED</span>
              </p>
              <p className="italic font-serif text-slate-600 whitespace-pre-line text-left">{previewText}...</p>
              
              <div className="pt-4 border-t border-dashed border-slate-200 space-y-2 opacity-35 blur-[1.2px] pointer-events-none select-none">
                <p className="font-mono text-[9px] text-slate-500">SECTION 2: METHODOLOGY & SOLUTIONS PREPARATIONS [LOCKED]</p>
                <div className="h-2 rounded w-11/12 bg-slate-300" />
                <div className="h-2 rounded w-full bg-slate-300" />
                <div className="h-2 rounded w-10/12 bg-slate-300" />
              </div>
            </div>}
        </div>

        <div className="border-t border-slate-200 pt-2 mt-4 flex items-center justify-between relative z-20">
          <span className="text-[8px] font-mono text-slate-400 uppercase tracking-wider">
            {isFree ? "VERIFIED ORIGINAL DOWNLOAD READY" : "\u{1F512} PAYMENT REQUIRED TO UNLOCK FULL FILE"}
          </span>
          <span className="text-[8px] font-mono font-bold text-slate-500">TYAGIHUB STORE</span>
        </div>
      </div>;
  }
  if (type === "zip" || hasError) {
    let cardTheme = {
      bg: "from-rose-950/30 to-slate-950",
      border: "border-rose-900/40",
      iconColor: "text-rose-400",
      glow: "shadow-rose-950/15",
      badge: "bg-rose-500/10 text-rose-400 border-rose-500/20"
    };
    if (type === "zip") {
      cardTheme = {
        bg: "from-amber-950/30 to-slate-950",
        border: "border-amber-900/40",
        iconColor: "text-amber-400",
        glow: "shadow-amber-950/15",
        badge: "bg-amber-500/10 text-amber-400 border-amber-500/20"
      };
    } else if (type === "video") {
      cardTheme = {
        bg: "from-purple-950/30 to-slate-950",
        border: "border-purple-900/40",
        iconColor: "text-purple-400",
        glow: "shadow-purple-950/15",
        badge: "bg-purple-500/10 text-purple-400 border-purple-500/20"
      };
    } else if (type === "image") {
      cardTheme = {
        bg: "from-blue-950/30 to-slate-950",
        border: "border-blue-900/40",
        iconColor: "text-blue-400",
        glow: "shadow-blue-950/15",
        badge: "bg-blue-500/10 text-blue-400 border-blue-500/20"
      };
    } else if (type === "pdf") {
      cardTheme = {
        bg: "from-red-950/30 to-slate-950",
        border: "border-red-900/40",
        iconColor: "text-red-400",
        glow: "shadow-red-950/15",
        badge: "bg-red-500/10 text-red-400 border-red-500/20"
      };
    }
    return <div className={`relative w-full h-full bg-gradient-to-br ${cardTheme.bg} border ${cardTheme.border} ${cardTheme.glow} shadow-2xl flex flex-col items-center justify-center p-6 select-none overflow-hidden min-h-[160px]`}>
        {!isFree && <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center overflow-hidden opacity-10">
            <div className="absolute inset-0 flex flex-wrap gap-4 p-2 justify-around content-around rotate-[-15deg] scale-125 text-[8px] font-mono font-bold tracking-widest text-rose-500 uppercase">
              {Array.from({ length: 6 }).map((_, idx) => <span key={idx} className="whitespace-nowrap">TYAGIHUB DRM PROTECTED</span>)}
            </div>
          </div>}

        <div className="flex flex-col items-center text-center space-y-3 z-10">
          <div className={`p-4 rounded-2xl bg-slate-950/80 border ${cardTheme.border} shadow-lg flex items-center justify-center relative`}>
            {type === "pdf" && <FileText className={`w-8 h-8 ${cardTheme.iconColor}`} />}
            {type === "zip" && <Archive className={`w-8 h-8 ${cardTheme.iconColor}`} />}
            {type === "video" && <VideoIcon className={`w-8 h-8 ${cardTheme.iconColor}`} />}
            {type === "image" && <FileImage className={`w-8 h-8 ${cardTheme.iconColor}`} />}
            {type !== "pdf" && type !== "zip" && type !== "video" && type !== "image" && <FileText className={`w-8 h-8 text-indigo-400`} />}
            
            <div className="absolute -bottom-1 -right-1 bg-slate-900 border border-slate-800 rounded-full p-1 shadow-md">
              <Lock className="w-3 h-3 text-rose-400" />
            </div>
          </div>

          <div className="space-y-1">
            <span className={`inline-block px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded border ${cardTheme.badge}`}>
              Secure Preview
            </span>
            <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">
              Premium {type} File
            </h4>
            <p className="text-[10px] text-slate-400 max-w-[240px] leading-relaxed">
              Google Drive Cloud verification active. Purchase to unlock permanent downloads.
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 bg-slate-950/90 py-1.5 border-t border-slate-900 flex items-center justify-center gap-1.5 px-3 z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-[8px] font-mono font-semibold text-slate-400 uppercase tracking-widest">
            TYAGIHUB AUTOMATED PRE-DOWNLOAD DRM GATEWAY
          </span>
        </div>
      </div>;
  }
  return <div className="relative w-full h-full overflow-hidden select-none">
      {loading && <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-1.5 z-30">
          <div className="w-6 h-6 rounded-full border border-slate-850 border-t-indigo-500 animate-spin" />
          <span className="text-[9px] font-mono text-slate-500 tracking-wider">DRM SECURING...</span>
        </div>}

      <img
    src={displaySrc || src}
    alt={alt}
    referrerPolicy="no-referrer"
    className={`${className} select-none pointer-events-none`}
    draggable="false"
  />

      {useOverlayWatermark && !isFree && <>
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-10 flex flex-col justify-around py-4 scale-110">
            {Array.from({ length: 6 }).map((_, rIdx) => <div
    key={rIdx}
    className="flex justify-around gap-2 whitespace-nowrap text-[9px] font-mono font-black text-rose-500 uppercase tracking-widest select-none pointer-events-none rotate-[-18deg]"
    style={{ mixBlendMode: "difference", opacity: 0.4 }}
  >
                <span>TyagiHub Secure DRM • DO NOT ALTER</span>
                <span>TyagiHub Secure DRM • DO NOT ALTER</span>
              </div>)}
          </div>

          <div className="absolute bottom-0 inset-x-0 bg-slate-950/90 py-1.5 text-[8px] font-mono font-bold text-red-300 text-center uppercase tracking-widest border-t border-slate-900/60 z-15 select-none pointer-events-none">
            TYAGIHUB SECURE DRM PROTECTED • PRE-DOWNLOAD PREVIEW
          </div>
        </>}

      {!isFree && <div
    className="absolute inset-0 z-20 bg-transparent cursor-pointer select-none pointer-events-auto"
    onContextMenu={(e) => e.preventDefault()}
    draggable="false"
  />}
    </div>;
}
export function generateAndDownloadPDF(title, rawContent, watermarkText) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxLineWidth = pageWidth - margin * 2;
  const drawWatermark = () => {
    if (!watermarkText) return;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(45);
    doc.setTextColor(245, 215, 215);
    doc.text(watermarkText, pageWidth / 2, pageHeight / 2 - 40, {
      align: "center",
      angle: 35
    });
    doc.text(watermarkText, pageWidth / 2, pageHeight / 2 + 40, {
      align: "center",
      angle: 35
    });
  };
  const addHeaderFooter = (pageNum, totalPages2) => {
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
    doc.text(`Page ${pageNum} of ${totalPages2}`, pageWidth - margin, pageHeight - 10, { align: "right" });
    doc.text("Securely distributed by TyagiHub Store (golutyagi9710@gmail.com)", margin, pageHeight - 10);
  };
  let currentY = 28;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(17, 24, 39);
  const titleLines = doc.splitTextToSize(title.toUpperCase(), maxLineWidth);
  titleLines.forEach((line) => {
    doc.text(line, pageWidth / 2, currentY, { align: "center" });
    currentY += 8;
  });
  currentY += 2;
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(1.2);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 12;
  const normalizedContent = rawContent.replace(/\r\n/g, "\n");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(55, 65, 81);
  const lines = doc.splitTextToSize(normalizedContent, maxLineWidth);
  const lineHeight = 6.8;
  let calcY = currentY;
  let totalPages = 1;
  for (let i = 0; i < lines.length; i++) {
    if (calcY > pageHeight - 25) {
      totalPages++;
      calcY = 22;
    }
    calcY += lineHeight;
  }
  let currentPageNum = 1;
  if (watermarkText) {
    drawWatermark();
  }
  addHeaderFooter(currentPageNum, totalPages);
  for (let i = 0; i < lines.length; i++) {
    if (currentY > pageHeight - 25) {
      doc.addPage();
      currentPageNum++;
      currentY = 22;
      if (watermarkText) {
        drawWatermark();
      }
      addHeaderFooter(currentPageNum, totalPages);
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(55, 65, 81);
    doc.text(lines[i], margin, currentY);
    currentY += lineHeight;
  }
  const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "_").substring(0, 40);
  const filename = `${sanitizedTitle}_unlocked_tyagihub.pdf`;
  doc.save(filename);
}
export function generateAndDownloadDOC(title, rawContent) {
  const normalizedContent = rawContent.replace(/\r\n/g, "\n");
  const paragraphs = normalizedContent.split("\n").map((p) => p.trim()).filter((p) => p.length > 0).map((p) => `<p style="margin-bottom: 12pt; text-align: justify; font-size: 11pt; line-height: 150%; font-family: 'Calibri', 'Arial', sans-serif; color: #2D3748;">${p}</p>`).join("");
  const docHTML = `
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
      <div class="subtitle">SECURE DOCUMENT PROTOCOL \u2022 TYAGIHUB VERIFIED ORIGINAL</div>
      <div class="divider"></div>
      
      <div class="content-body">
        ${paragraphs}
      </div>

      <div class="footer">
        <p>Securely downloaded via TyagiHub Store (golutyagi9710@gmail.com) \u2022 Verified Original Solutions Document</p>
      </div>
    </body>
    </html>
  `;
  const blob = new Blob(["\uFEFF" + docHTML], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "_").substring(0, 40);
  a.download = `${sanitizedTitle}_unlocked_tyagihub.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
const firebaseConfig = {
  apiKey: "AIzaSyBE0uXhh8ePOQH6FBdhRCZrRgRkUTwCWws",
  authDomain: "tyagi-hub.firebaseapp.com",
  projectId: "tyagi-hub",
  storageBucket: "tyagi-hub.firebasestorage.app",
  messagingSenderId: "1052184634573",
  appId: "1:1052184634573:web:077135d1bc4f321688b584",
  measurementId: "G-36X3TG734R"
};
const DEPLOYED_GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx9iZxNjc8MdlgIul3TJju2B3h3RB25uEQMJ63R6YyzOLhmojgauokk7lB1ATZ6L58h/exec";
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(firebaseApp);
const safeFetchJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
  }
  const text = await response.text();
  const trimmed = text.trim();
  if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html") || trimmed.startsWith("<script") || trimmed.startsWith("<head") || trimmed.startsWith("<body")) {
    throw new Error('Received HTML response instead of JSON. Please ensure that your Google Apps Script Web App is deployed with "Execute as: Me" and "Who has access: Anyone". If you are logged in with multiple Google accounts, try opening the App in incognito or another browser.');
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`Invalid JSON response from server. Error: ${err instanceof Error ? err.message : String(err)}`);
  }
};
export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const local = localStorage.getItem("tyagihub_user");
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
      }
    }
    return null;
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [showSubModal, setShowSubModal] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [subUtr, setSubUtr] = useState("");
  const [subVerificationState, setSubVerificationState] = useState("idle");
  const [subVerificationError, setSubVerificationError] = useState("");
  const [createdSubId, setCreatedSubId] = useState("");
  const [receivedSubToken, setReceivedSubToken] = useState("");
  const theme = "dark";
  const [assets, setAssets] = useState(() => {
    const local = localStorage.getItem("tyagihub_assets_offline");
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (parsed && parsed.length > 0) {
          return parsed.filter((item) => item && item.id && !item.id.startsWith("ASSET-"));
        }
      } catch (e) {
      }
    }
    return [];
  });
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [detailAsset, setDetailAsset] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [fileTypeFilters, setFileTypeFilters] = useState([]);
  const [sortOption, setSortOption] = useState("newest");
  const [showFilterMenu, setShowFilterMenu] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  const [isLiveSync, setIsLiveSync] = useState(() => {
    const saved = localStorage.getItem("tyagihub_live_sync");
    if (saved !== null) {
      return saved === "true";
    }
    return DEPLOYED_GAS_WEB_APP_URL !== "" && DEPLOYED_GAS_WEB_APP_URL !== "YOUR_DEPLOYED_GOOGLE_APPS_SCRIPT_URL_HERE";
  });
  const [gasWebAppUrl] = useState(() => {
    if (DEPLOYED_GAS_WEB_APP_URL && DEPLOYED_GAS_WEB_APP_URL !== "YOUR_DEPLOYED_GOOGLE_APPS_SCRIPT_URL_HERE") {
      return DEPLOYED_GAS_WEB_APP_URL;
    }
    const saved = localStorage.getItem("tyagihub_gas_url");
    if (saved) return saved;
    return "";
  });
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState("idle");
  const [syncError, setSyncError] = useState("");
  const [isAdminMode, setIsAdminMode] = useState(() => {
    return localStorage.getItem("tyagihub_admin_mode") === "true";
  });
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [adminLoginError, setAdminLoginError] = useState("");
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [checkoutAsset, setCheckoutAsset] = useState(null);
  const [custName, setCustName] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custWhatsapp, setCustWhatsapp] = useState("");
  const [custUtr, setCustUtr] = useState("");
  const [verificationState, setVerificationState] = useState("idle");
  const [verificationError, setVerificationError] = useState("");
  const [receivedToken, setReceivedToken] = useState("");
  const [createdRequestId, setCreatedRequestId] = useState("");
  const [lookupUtr, setLookupUtr] = useState("");
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [showLookupPanel, setShowLookupPanel] = useState(false);
  const [showAddAssetForm, setShowAddAssetForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("image");
  const [newSize, setNewSize] = useState("");
  const [newPrice, setNewPrice] = useState(0);
  const [newDriveId, setNewDriveId] = useState("");
  const [newPreviewUrl, setNewPreviewUrl] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [syncEmailsLoading, setSyncEmailsLoading] = useState(false);
  const [syncEmailsMessage, setSyncEmailsMessage] = useState(null);
  const syncUserWalletData = async (user, currentSubsList = subscriptions) => {
    if (!user) return null;
    let credits = user.creditsBalance ?? 0;
    let expiry = user.expiryDate ?? "N/A";
    const userSubs = currentSubsList.filter(
      (s) => s.userEmail.toLowerCase() === user.email.toLowerCase() && s.status === "approved"
    );
    if (userSubs.length > 0) {
      let totalCredits = 0;
      let maxExpiryTime = 0;
      let maxExpiryStr = "N/A";
      userSubs.forEach((sub) => {
        const planName = sub.planName.toLowerCase();
        let planCredits = 0;
        if (planName.includes("micro")) planCredits = 60;
        else if (planName.includes("mini")) planCredits = 125;
        else if (planName.includes("super") || planName.includes("vault")) planCredits = 400;
        else if (planName.includes("elite") || planName.includes("creator")) planCredits = 850;
        else planCredits = 60;
        totalCredits += planCredits;
        const expTime = new Date(sub.expiryDate).getTime();
        if (!isNaN(expTime) && expTime > maxExpiryTime) {
          maxExpiryTime = expTime;
          maxExpiryStr = sub.expiryDate;
        }
      });
      credits = totalCredits;
      expiry = maxExpiryStr;
      if (maxExpiryTime > 0 && maxExpiryTime < Date.now()) {
        credits = 0;
        expiry = "Expired";
      }
    }
    if (isLiveSync && gasWebAppUrl) {
      try {
        const url = `${gasWebAppUrl}?action=syncUserWallet&uid=${encodeURIComponent(user.uid)}&name=${encodeURIComponent(user.displayName)}&email=${encodeURIComponent(user.email)}`;
        const data = await safeFetchJson(url);
        if (data && data.success) {
          credits = Number(data.creditsBalance ?? 0);
          expiry = String(data.expiryDate ?? "N/A");
        }
      } catch (err) {
        console.error("Wallet sync failed, falling back to local subscriptions calculation:", err);
      }
    }
    const updatedUser = {
      ...user,
      creditsBalance: credits,
      expiryDate: expiry
    };
    localStorage.setItem("tyagihub_user", JSON.stringify(updatedUser));
    return updatedUser;
  };
  useEffect(() => {
    console.clear();
    console.log("%c[DRM ACTIVE] TyagiHub Secure DRM Protocol v4", "color: #fca5a5; font-size: 18px; font-weight: 900; background: #0f172a; padding: 6px 12px; border-radius: 8px;");
    if (isLiveSync && gasWebAppUrl) {
      fetchDataFromSheet();
    } else {
      const localAssets = localStorage.getItem("tyagihub_assets_offline");
      const localRequests = localStorage.getItem("tyagihub_requests_offline");
      const localSubs = localStorage.getItem("tyagihub_subscriptions_offline");
      if (localAssets) setAssets(JSON.parse(localAssets));
      if (localRequests) setRequests(JSON.parse(localRequests));
      if (localSubs) setSubscriptions(JSON.parse(localSubs));
    }
  }, [isLiveSync]);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setShowAdminLoginModal(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
          photoURL: firebaseUser.photoURL || void 0,
          subscription: null
        };
        const matchedSub = subscriptions.find(
          (s) => s.userEmail.toLowerCase() === user.email.toLowerCase() && s.status === "approved"
        );
        if (matchedSub) {
          user.subscription = matchedSub;
        }
        const fullySynced = await syncUserWalletData(user, subscriptions);
        setCurrentUser(fullySynced);
        localStorage.setItem("tyagihub_user", JSON.stringify(fullySynced));
      } else {
        const cachedUser = localStorage.getItem("tyagihub_user");
        if (cachedUser && !isLiveSync) {
          try {
            const userObj = JSON.parse(cachedUser);
            const fullySyncedUser = await syncUserWalletData(userObj, subscriptions);
            setCurrentUser(fullySyncedUser);
          } catch (e) {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      }
    });
    return () => unsubscribe();
  }, [isLiveSync, subscriptions]);
  useEffect(() => {
    if (!isLiveSync) {
      localStorage.setItem("tyagihub_assets_offline", JSON.stringify(assets));
    }
  }, [assets, isLiveSync]);
  useEffect(() => {
    if (!isLiveSync) {
      localStorage.setItem("tyagihub_requests_offline", JSON.stringify(requests));
    }
  }, [requests, isLiveSync]);
  useEffect(() => {
    if (!isLiveSync) {
      localStorage.setItem("tyagihub_subscriptions_offline", JSON.stringify(subscriptions));
    }
  }, [subscriptions, isLiveSync]);
  const fetchDataFromSheet = async (urlToUse = gasWebAppUrl) => {
    if (!urlToUse) {
      setSyncStatus("error");
      setSyncError("Please set your Google Apps Script Web App URL first.");
      return;
    }
    setIsLoading(true);
    setSyncStatus("idle");
    setSyncError("");
    try {
      const prodData = await safeFetchJson(`${urlToUse}?action=getProducts`);
      if (prodData.success && Array.isArray(prodData.data)) {
        setAssets(prodData.data);
      } else {
        throw new Error(prodData.error || "Could not parse products from sheet.");
      }
      try {
        const reqData = await safeFetchJson(`${urlToUse}?action=getRequests`);
        if (reqData.success && Array.isArray(reqData.data)) {
          setRequests(reqData.data);
        }
      } catch (reqErr) {
        console.error("Requests fetch failed:", reqErr);
      }
      try {
        const subData = await safeFetchJson(`${urlToUse}?action=getSubscriptions`);
        if (subData.success && Array.isArray(subData.data)) {
          setSubscriptions(subData.data);
          const cachedUser = localStorage.getItem("tyagihub_user");
          if (cachedUser) {
            const userObj = JSON.parse(cachedUser);
            const userActiveSub = subData.data.find(
              (s) => s.userEmail.toLowerCase() === userObj.email.toLowerCase() && s.status === "approved"
            );
            const updated = { ...userObj, subscription: userActiveSub || null };
            const fullySyncedUser = await syncUserWalletData(updated, subData.data);
            setCurrentUser(fullySyncedUser);
          }
        }
      } catch (subErr) {
        console.error("Subscriptions fetch failed:", subErr);
        throw new Error(subErr instanceof Error ? subErr.message : "Subscriptions fetch failed");
      }
      setSyncStatus("success");
      localStorage.setItem("tyagihub_gas_url", urlToUse);
      localStorage.setItem("tyagihub_live_sync", "true");
      setIsLiveSync(true);
    } catch (err) {
      setSyncStatus("error");
      setSyncError(err.message || "Network error sync failed.");
    } finally {
      setIsLoading(false);
    }
  };
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPasswordInput === "golu123") {
      setIsAdminMode(true);
      localStorage.setItem("tyagihub_admin_mode", "true");
      setShowAdminLoginModal(false);
      setAdminLoginError("");
      setAdminPasswordInput("");
      setShowAdminPanel(true);
    } else {
      setAdminLoginError("Invalid access key. Please try again.");
    }
  };
  const handleAdminLogout = () => {
    setIsAdminMode(false);
    localStorage.removeItem("tyagihub_admin_mode");
    setShowAdminPanel(false);
  };
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    if (authMode === "register" && !authName.trim()) {
      setAuthError("\u0915\u0943\u092A\u092F\u093E \u0905\u092A\u0928\u093E \u092A\u0942\u0930\u093E \u0928\u093E\u092E \u0926\u0930\u094D\u091C \u0915\u0930\u0947\u0902\u0964 (Please enter your full name.)");
      setAuthLoading(false);
      return;
    }
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError("\u0908\u092E\u0947\u0932 \u0914\u0930 \u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u0906\u0935\u0936\u094D\u092F\u0915 \u0939\u0948\u0902\u0964 (Email and Password are required.)");
      setAuthLoading(false);
      return;
    }
    try {
      if (authMode === "register") {
        const userCredential = await createUserWithEmailAndPassword(auth, authEmail.trim(), authPassword.trim());
        await updateProfile(userCredential.user, {
          displayName: authName.trim()
        });
      } else {
        await signInWithEmailAndPassword(auth, authEmail.trim(), authPassword.trim());
      }
      setShowAuthModal(false);
      setAuthName("");
      setAuthEmail("");
      setAuthPassword("");
    } catch (err) {
      console.error("Firebase Auth Error:", err);
      let localizedMsg = err.message;
      if (err.code === "auth/email-already-in-use") {
        localizedMsg = "\u092F\u0939 \u0908\u092E\u0947\u0932 \u092A\u0939\u0932\u0947 \u0938\u0947 \u0939\u0940 \u0909\u092A\u092F\u094B\u0917 \u092E\u0947\u0902 \u0939\u0948\u0964 (This email is already registered.)";
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        localizedMsg = "\u0917\u0932\u0924 \u0908\u092E\u0947\u0932 \u092F\u093E \u092A\u093E\u0938\u0935\u0930\u094D\u0921\u0964 \u0915\u0943\u092A\u092F\u093E \u092A\u0941\u0928\u0903 \u092A\u094D\u0930\u092F\u093E\u0938 \u0915\u0930\u0947\u0902\u0964 (Incorrect email or password.)";
      } else if (err.code === "auth/weak-password") {
        localizedMsg = "\u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u0915\u092E \u0938\u0947 \u0915\u092E 6 \u0905\u0915\u094D\u0937\u0930\u094B\u0902 \u0915\u093E \u0939\u094B\u0928\u093E \u091A\u093E\u0939\u093F\u090F\u0964 (Password must be at least 6 characters.)";
      } else if (err.code === "auth/invalid-email") {
        localizedMsg = "\u0915\u0943\u092A\u092F\u093E \u090F\u0915 \u092E\u093E\u0928\u094D\u092F \u0908\u092E\u0947\u0932 \u0926\u0930\u094D\u091C \u0915\u0930\u0947\u0902\u0964 (Please enter a valid email.)";
      }
      setAuthError(localizedMsg);
    } finally {
      setAuthLoading(false);
    }
  };
  const handleGoogleSignIn = async () => {
    setAuthError("");
    setAuthLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      setShowAuthModal(false);
    } catch (err) {
      console.error("Google Sign-In Error:", err);
      if (err.code !== "auth/popup-closed-by-user") {
        setAuthError(err.message || "Google \u0932\u0949\u0917\u093F\u0928 \u0935\u093F\u092B\u0932 \u0930\u0939\u093E\u0964 (Google Login failed.)");
      }
    } finally {
      setAuthLoading(false);
    }
  };
  const handleSubmitPurchase = async (e) => {
    e.preventDefault();
    if (!checkoutAsset) return;
    const isPaid = checkoutAsset.price > 0;
    const finalPrice = currentUser ? checkoutAsset.price : Math.round(checkoutAsset.price * 1.15);
    const cleanUtr = custUtr.trim();
    if (isPaid && (!cleanUtr || cleanUtr.length < 6)) {
      setVerificationState("error");
      setVerificationError("Please enter a valid Paytm Transaction ID or UPI Reference Number (UTR).");
      return;
    }
    setVerificationState("verifying");
    setVerificationError("");
    const requestId = "REQ-" + Math.floor(1e5 + Math.random() * 9e5);
    setCreatedRequestId(requestId);
    const buyerName = currentUser ? currentUser.displayName : custName || "N/A";
    const buyerEmail = currentUser ? currentUser.email : custEmail || "N/A";
    const params = new URLSearchParams({
      action: "addRequest",
      id: requestId,
      assetId: checkoutAsset.id,
      assetTitle: checkoutAsset.title,
      customerName: buyerName,
      customerEmail: buyerEmail,
      customerWhatsapp: custWhatsapp || "N/A",
      transactionId: cleanUtr,
      price: finalPrice.toString(),
      requestDate: (/* @__PURE__ */ new Date()).toLocaleString("en-US")
    });
    if (isLiveSync && gasWebAppUrl) {
      try {
        const data = await safeFetchJson(`${gasWebAppUrl}?${params.toString()}`);
        if (data.success) {
          if (data.status === "approved") {
            setVerificationState("verified");
            setReceivedToken(data.secureToken);
          } else {
            setVerificationState("pending");
            if (data.warning) {
              setVerificationError(data.warning);
            }
          }
          fetchDataFromSheet();
        } else {
          setVerificationState("error");
          setVerificationError(data.error || "Server rejected verification. Check UTR reuse.");
        }
      } catch (err) {
        setVerificationState("error");
        setVerificationError("Network failed to contact verification server. Order submitted locally.");
      }
    } else {
      const isFree = checkoutAsset.price === 0;
      const mockRequest = {
        id: requestId,
        assetId: checkoutAsset.id,
        assetTitle: checkoutAsset.title,
        customerName: buyerName,
        customerEmail: buyerEmail,
        customerWhatsapp: custWhatsapp,
        transactionId: cleanUtr,
        price: finalPrice,
        status: isFree ? "approved" : "pending",
        requestDate: (/* @__PURE__ */ new Date()).toLocaleString("en-US"),
        downloadCount: 0,
        secureToken: isFree ? "SANDBOX-FREE-TOKEN-" + Math.random().toString(36).substring(2, 8).toUpperCase() : void 0
      };
      const updatedReqs = [mockRequest, ...requests];
      setRequests(updatedReqs);
      if (isFree) {
        setVerificationState("verified");
        setReceivedToken(mockRequest.secureToken || "");
      } else {
        setVerificationState("pending");
      }
    }
  };
  const [downloadWithCreditsLoading, setDownloadWithCreditsLoading] = useState(false);
  const handleDownloadWithPassCredits = async (asset) => {
    if (!currentUser) {
      alert("Please log in to use your Credit Pass.");
      return;
    }
    setDownloadWithCreditsLoading(true);
    if (!isLiveSync || !gasWebAppUrl) {
      const currentBalance = currentUser.creditsBalance ?? 0;
      const currentExpiry = currentUser.expiryDate ?? "N/A";
      let expired = false;
      if (currentExpiry === "N/A") {
        expired = true;
      } else {
        const expDate = new Date(currentExpiry);
        if (isNaN(expDate.getTime()) || expDate.getTime() < Date.now()) {
          expired = true;
        }
      }
      if (expired) {
        const updatedUser2 = {
          ...currentUser,
          creditsBalance: 0,
          expiryDate: "Expired"
        };
        setCurrentUser(updatedUser2);
        localStorage.setItem("tyagihub_user", JSON.stringify(updatedUser2));
        alert("Your Credit Pass has expired! Balance has been frozen and flushed. Please purchase a new Credit Pass.");
        setDownloadWithCreditsLoading(false);
        return;
      }
      if (currentBalance < asset.price) {
        alert(`Insufficient credits! You have ${currentBalance} credits, but this asset costs ${asset.price} credits.`);
        setDownloadWithCreditsLoading(false);
        return;
      }
      const newBalance = currentBalance - asset.price;
      const updatedUser = {
        ...currentUser,
        creditsBalance: newBalance
      };
      setCurrentUser(updatedUser);
      localStorage.setItem("tyagihub_user", JSON.stringify(updatedUser));
      const mockReq = {
        id: "REQ-CR-" + Math.floor(1e5 + Math.random() * 9e5),
        assetId: asset.id,
        assetTitle: asset.title,
        customerName: currentUser.displayName,
        customerEmail: currentUser.email,
        customerWhatsapp: "N/A",
        transactionId: "CREDIT_PASS_DEDUCTION",
        price: asset.price,
        status: "approved",
        requestDate: (/* @__PURE__ */ new Date()).toLocaleString(),
        secureToken: "TOKEN-CREDIT-" + Math.random().toString(36).substring(2, 10).toUpperCase(),
        downloadCount: 1
      };
      setRequests((prev) => [mockReq, ...prev]);
      alert(`\u2713 \u20B9${asset.price} Credits Deducted! Click format buttons to download.`);
      setDownloadWithCreditsLoading(false);
      return;
    }
    try {
      const url = `${gasWebAppUrl}?action=downloadWithCredits&email=${encodeURIComponent(currentUser.email)}&assetId=${encodeURIComponent(asset.id)}`;
      const data = await safeFetchJson(url);
      if (data && data.success) {
        const updatedUser = {
          ...currentUser,
          creditsBalance: data.creditsBalance,
          expiryDate: data.expiryDate
        };
        setCurrentUser(updatedUser);
        localStorage.setItem("tyagihub_user", JSON.stringify(updatedUser));
        const mockReq = {
          id: "REQ-CR-" + Math.floor(1e5 + Math.random() * 9e5),
          assetId: asset.id,
          assetTitle: asset.title,
          customerName: currentUser.displayName,
          customerEmail: currentUser.email,
          customerWhatsapp: "N/A",
          transactionId: "CREDIT_PASS_DEDUCTION",
          price: asset.price,
          status: "approved",
          requestDate: (/* @__PURE__ */ new Date()).toLocaleString(),
          secureToken: data.secureToken,
          downloadCount: 1
        };
        setRequests((prev) => [mockReq, ...prev]);
        alert(`\u2713 Credits deducted successfully! DRM authorization token issued.`);
      } else {
        if (data.expired) {
          const updatedUser = {
            ...currentUser,
            creditsBalance: 0,
            expiryDate: "Expired"
          };
          setCurrentUser(updatedUser);
          localStorage.setItem("tyagihub_user", JSON.stringify(updatedUser));
          alert(data.error || "Your Credit Pass has expired! Balance has been frozen and flushed.");
        } else {
          alert(data.error || "Deduction failed. Ensure sufficient credits or valid pass.");
        }
      }
    } catch (err) {
      console.error("Deduction API error:", err);
      alert("API connection failed. Please retry.");
    } finally {
      setDownloadWithCreditsLoading(false);
    }
  };
  const handlePurchaseSubscription = async (e) => {
    e.preventDefault();
    if (!checkoutPlan || !currentUser) return;
    const cleanUtr = subUtr.trim();
    if (!cleanUtr || cleanUtr.length < 6) {
      setSubVerificationState("error");
      setSubVerificationError("Please enter a valid Paytm transaction ID or UPI Reference Number (UTR).");
      return;
    }
    setSubVerificationState("verifying");
    setSubVerificationError("");
    const subId = "SUB-" + Math.floor(1e5 + Math.random() * 9e5);
    setCreatedSubId(subId);
    const purchaseDate = (/* @__PURE__ */ new Date()).toLocaleString("en-US");
    const expDate = /* @__PURE__ */ new Date();
    if (checkoutPlan.durationHours) {
      expDate.setHours(expDate.getHours() + checkoutPlan.durationHours);
    } else {
      expDate.setDate(expDate.getDate() + checkoutPlan.durationDays);
    }
    const expiryDate = expDate.toLocaleString("en-US");
    if (isLiveSync && gasWebAppUrl) {
      try {
        const queryParams = new URLSearchParams({
          action: "addSubscription",
          id: subId,
          userEmail: currentUser.email,
          userName: currentUser.displayName,
          planName: checkoutPlan.name,
          price: checkoutPlan.price.toString(),
          transactionId: cleanUtr,
          purchaseDate,
          expiryDate
        });
        const data = await safeFetchJson(`${gasWebAppUrl}?${queryParams.toString()}`);
        if (data.success) {
          setSubVerificationState(data.autoVerified ? "verified" : "pending");
          if (data.autoVerified && data.secureToken) {
            setReceivedSubToken(data.secureToken);
            const liveSubObj = {
              id: subId,
              userEmail: currentUser.email,
              userName: currentUser.displayName,
              planName: checkoutPlan.name,
              price: checkoutPlan.price,
              transactionId: cleanUtr,
              status: "approved",
              purchaseDate,
              expiryDate,
              secureToken: data.secureToken
            };
            const updated = { ...currentUser, subscription: liveSubObj };
            setCurrentUser(updated);
            localStorage.setItem("tyagihub_user", JSON.stringify(updated));
            setSubscriptions((prev) => [liveSubObj, ...prev]);
          } else {
            const pendingSubObj = {
              id: subId,
              userEmail: currentUser.email,
              userName: currentUser.displayName,
              planName: checkoutPlan.name,
              price: checkoutPlan.price,
              transactionId: cleanUtr,
              status: "pending",
              purchaseDate,
              expiryDate
            };
            setSubscriptions((prev) => [pendingSubObj, ...prev]);
          }
        } else {
          setSubVerificationState("error");
          setSubVerificationError(data.error || "Server rejected subscription log request.");
        }
      } catch (err) {
        setSubVerificationState("error");
        setSubVerificationError("Connection lost. Please try submitting again.");
      }
    } else {
      await new Promise((r) => setTimeout(r, 1e3));
      const mockToken = "SUB-TOKEN-SANDBOX-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const sandboxSubObj = {
        id: subId,
        userEmail: currentUser.email,
        userName: currentUser.displayName,
        planName: checkoutPlan.name,
        price: checkoutPlan.price,
        transactionId: cleanUtr,
        status: "approved",
        purchaseDate,
        expiryDate,
        secureToken: mockToken
      };
      setSubVerificationState("verified");
      setReceivedSubToken(mockToken);
      const updated = { ...currentUser, subscription: sandboxSubObj };
      setCurrentUser(updated);
      localStorage.setItem("tyagihub_user", JSON.stringify(updated));
      setSubscriptions((prev) => [sandboxSubObj, ...prev]);
    }
  };
  const handleUpdateSubscriptionStatus = async (id, newStatus) => {
    const token = "SUB-TOKEN-MANUAL-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    if (isLiveSync && gasWebAppUrl) {
      try {
        const queryParams = new URLSearchParams({
          action: "updateSubscription",
          id,
          status: newStatus,
          secureToken: token
        });
        const data = await safeFetchJson(`${gasWebAppUrl}?${queryParams.toString()}`);
        if (data.success) {
          setSubscriptions((prev) => prev.map((s) => {
            if (s.id === id) {
              const updatedSub = { ...s, status: newStatus, secureToken: data.secureToken || token };
              if (currentUser && currentUser.email.toLowerCase() === s.userEmail.toLowerCase()) {
                const nextUser = { ...currentUser, subscription: newStatus === "approved" ? updatedSub : null };
                setCurrentUser(nextUser);
                localStorage.setItem("tyagihub_user", JSON.stringify(nextUser));
              }
              return updatedSub;
            }
            return s;
          }));
          alert(`Subscription request ${id} successfully marked as ${newStatus}!`);
        } else {
          alert(`Failed to update subscription on sheet: ${data.error}`);
        }
      } catch (err) {
        alert("Failed to update subscription status. Connection failed.");
      }
    } else {
      setSubscriptions((prev) => prev.map((s) => {
        if (s.id === id) {
          const updatedSub = { ...s, status: newStatus, secureToken: newStatus === "approved" ? token : void 0 };
          if (currentUser && currentUser.email.toLowerCase() === s.userEmail.toLowerCase()) {
            const nextUser = { ...currentUser, subscription: newStatus === "approved" ? updatedSub : null };
            setCurrentUser(nextUser);
            localStorage.setItem("tyagihub_user", JSON.stringify(nextUser));
          }
          return updatedSub;
        }
        return s;
      }));
      alert(`[Sandbox Mode] Subscription request ${id} marked as ${newStatus}.`);
    }
  };
  const handleUpdateOrderStatus = async (reqId, nextStatus) => {
    const token = "TOKEN-MANUAL-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    if (isLiveSync && gasWebAppUrl) {
      setIsLoading(true);
      try {
        const data = await safeFetchJson(`${gasWebAppUrl}?action=updateRequest&id=${reqId}&status=${nextStatus}&secureToken=${token}`);
        if (data.success) {
          fetchDataFromSheet();
        } else {
          alert("Failed to update status: " + data.error);
        }
      } catch (err) {
        alert("Sync error failed to update.");
      } finally {
        setIsLoading(false);
      }
    } else {
      setRequests(requests.map((r) => r.id === reqId ? { ...r, status: nextStatus, secureToken: nextStatus === "approved" ? token : void 0 } : r));
    }
  };
  const handleDeleteOrder = async (reqId) => {
    if (!confirm("Are you sure you want to delete this order?")) return;
    if (isLiveSync && gasWebAppUrl) {
      setIsLoading(true);
      try {
        const data = await safeFetchJson(`${gasWebAppUrl}?action=deleteRequest&id=${reqId}`);
        if (data.success) {
          fetchDataFromSheet();
        }
      } catch (err) {
        alert("Failed to delete request.");
      } finally {
        setIsLoading(false);
      }
    } else {
      setRequests(requests.filter((r) => r.id !== reqId));
    }
  };
  const handleAddNewProduct = async (e) => {
    e.preventDefault();
    if (!newTitle || !newDriveId) {
      alert("Product Title and Google Drive ID are required!");
      return;
    }
    const prodId = "PROD-" + Date.now().toString(36).toUpperCase();
    const cleanDriveId = newDriveId.trim();
    const extractedId = extractDriveId(cleanDriveId);
    const finalPreviewUrl = newPreviewUrl.trim() || (extractedId ? `https://drive.google.com/thumbnail?id=${extractedId}&sz=w1000` : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80");
    if (isLiveSync && gasWebAppUrl) {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          action: "addAsset",
          id: prodId,
          title: newTitle,
          type: newType,
          size: newSize || "N/A",
          price: newPrice.toString(),
          driveId: cleanDriveId,
          previewUrl: finalPreviewUrl,
          description: newDescription || "Premium high quality resource."
        });
        const data = await safeFetchJson(`${gasWebAppUrl}?${params.toString()}`);
        if (data.success) {
          setShowAddAssetForm(false);
          clearNewProductForm();
          fetchDataFromSheet();
        } else {
          alert("Error adding asset: " + data.error);
        }
      } catch (err) {
        alert("Network failed to add product.");
      } finally {
        setIsLoading(false);
      }
    } else {
      const mockAsset = {
        id: prodId,
        title: newTitle,
        type: newType,
        size: newSize || "N/A",
        price: newPrice,
        driveId: cleanDriveId,
        previewUrl: finalPreviewUrl,
        description: newDescription
      };
      setAssets([mockAsset, ...assets]);
      setShowAddAssetForm(false);
      clearNewProductForm();
    }
  };
  const handleDeleteProduct = async (prodId) => {
    if (!confirm("Are you sure you want to permanently delete this product? This will remove it from the store.")) return;
    if (isLiveSync && gasWebAppUrl) {
      setIsLoading(true);
      try {
        const data = await safeFetchJson(`${gasWebAppUrl}?action=deleteAsset&id=${prodId}`);
        if (data.success) {
          fetchDataFromSheet();
        } else {
          alert("Error deleting: " + data.error);
        }
      } catch (err) {
        alert("Failed to connect to sheet.");
      } finally {
        setIsLoading(false);
      }
    } else {
      setAssets(assets.filter((a) => a.id !== prodId));
    }
  };
  const clearNewProductForm = () => {
    setNewTitle("");
    setNewType("image");
    setNewSize("");
    setNewPrice(0);
    setNewDriveId("");
    setNewPreviewUrl("");
    setNewDescription("");
  };
  const handleSyncPaytmEmails = async () => {
    if (!isLiveSync || !gasWebAppUrl) {
      alert("Please connect Google Sheets Live Mode to scan emails.");
      return;
    }
    setSyncEmailsLoading(true);
    setSyncEmailsMessage(null);
    try {
      const data = await safeFetchJson(`${gasWebAppUrl}?action=syncEmails`);
      if (data.success) {
        setSyncEmailsMessage(data.message || "Gmail scan complete!");
        fetchDataFromSheet();
      } else {
        setSyncEmailsMessage("Error: " + data.error);
      }
    } catch (err) {
      setSyncEmailsMessage("Failed to trigger scan. Check if Web App has Gmail access.");
    } finally {
      setSyncEmailsLoading(false);
    }
  };
  const handleLookupOrder = async (e) => {
    e.preventDefault();
    const cleanSearch = lookupUtr.trim();
    if (!cleanSearch) return;
    setLookupLoading(true);
    setLookupError("");
    setLookupResult(null);
    if (isLiveSync && gasWebAppUrl) {
      try {
        const data = await safeFetchJson(`${gasWebAppUrl}?action=getRequests`);
        if (data.success && Array.isArray(data.data)) {
          const found = data.data.find(
            (r) => r.transactionId.toLowerCase() === cleanSearch.toLowerCase() || r.id.toLowerCase() === cleanSearch.toLowerCase()
          );
          if (found) {
            setLookupResult(found);
          } else {
            setLookupError("No order found with this Transaction ID / Order ID.");
          }
        } else {
          setLookupError("Could not sync orders from Google Sheet.");
        }
      } catch (err) {
        setLookupError("Network connection failed. Please try again.");
      } finally {
        setLookupLoading(false);
      }
    } else {
      const found = requests.find(
        (r) => r.transactionId.toLowerCase() === cleanSearch.toLowerCase() || r.id.toLowerCase() === cleanSearch.toLowerCase()
      );
      if (found) {
        setLookupResult(found);
      } else {
        setLookupError("Order not found. Note: Sandbox mode stores orders locally in your current browser tab.");
      }
      setLookupLoading(false);
    }
  };
  const toggleFileTypeFilter = (type) => {
    if (fileTypeFilters.includes(type)) {
      setFileTypeFilters(fileTypeFilters.filter((t) => t !== type));
    } else {
      setFileTypeFilters([...fileTypeFilters, type]);
    }
  };
  const filteredAssets = assets.filter((a) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || (a.title || "").toLowerCase().includes(query) || (a.description || "").toLowerCase().includes(query) || (a.id || "").toLowerCase().includes(query);
    if (!matchesSearch) return false;
    if (selectedCategory !== "all") {
      const assetCat = getAssetCategory(a);
      if (assetCat !== selectedCategory) return false;
    }
    if (priceFilter === "free" && a.price !== 0) return false;
    if (priceFilter === "paid" && a.price === 0) return false;
    if (fileTypeFilters.length > 0) {
      const sidebarType = getAssetSidebarType(a);
      if (!fileTypeFilters.includes(sidebarType)) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortOption === "newest") {
      return String(b.id || "").localeCompare(String(a.id || ""));
    } else if (sortOption === "name-asc") {
      return String(a.title || "").localeCompare(String(b.title || ""));
    } else if (sortOption === "name-desc") {
      return String(b.title || "").localeCompare(String(a.title || ""));
    } else if (sortOption === "price-asc") {
      return (a.price || 0) - (b.price || 0);
    } else if (sortOption === "price-desc") {
      return (b.price || 0) - (a.price || 0);
    }
    return 0;
  });
  return <div className={`min-h-screen font-sans relative transition-colors duration-300 ${theme === "dark" ? "bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white" : "bg-[#f8fafc] text-slate-800 selection:bg-indigo-600 selection:text-white"}`}>
      
      {
    /* Dynamic ambient glowing elements */
  }
      {theme === "dark" ? <>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-950/20 rounded-full filter blur-[120px] pointer-events-none" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-slate-900/10 rounded-full filter blur-[120px] pointer-events-none" />
        </> : <>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-200/20 rounded-full filter blur-[120px] pointer-events-none" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-slate-200/15 rounded-full filter blur-[120px] pointer-events-none" />
        </>}
      {
    /* --- MAIN PAGE VIEWPORT (Grid / Sidebar Bento Filters) --- */
  }
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 min-h-[80vh]">
        
        {
    /* Loading status */
  }
        {isLoading && <div className="mb-4 flex items-center gap-2 text-indigo-400 text-xs font-semibold bg-indigo-950/15 border border-indigo-900/30 p-2.5 rounded-xl animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
            <span>Syncing catalog with live database...</span>
          </div>}

        {
    /* Status Alerts */
  }
        {syncStatus === "error" && <div className="mb-4 text-rose-400 text-xs font-semibold flex items-center gap-1.5 bg-rose-950/20 border border-rose-900/40 p-2.5 rounded-xl">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {syncError} (Using offline fallback sandbox)
          </div>}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {
    /* Backdrop on Mobile only when menu is open */
  }
          {showFilterMenu && <div
    className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 lg:hidden"
    onClick={() => setShowFilterMenu(false)}
  />}

          {
    /* --- LEFT SIDEBAR (Mobile Slide-over Drawer / Desktop Sidebar) --- */
  }
          <div className={`
            fixed inset-y-0 left-0 z-50 w-[310px] max-w-[85vw] p-5 overflow-y-auto transition-all duration-300 ease-out
            ${showFilterMenu ? "translate-x-0" : "-translate-x-full lg:hidden"} 
            lg:static lg:translate-x-0 lg:w-auto lg:max-w-none lg:p-5 lg:rounded-2xl lg:border lg:col-span-1 lg:sticky lg:top-[70px] lg:h-auto lg:overflow-visible lg:z-auto
            ${showFilterMenu ? "lg:block" : "lg:hidden"}
            space-y-4
            ${theme === "dark" ? "bg-slate-950 border-r border-slate-900/80 lg:bg-slate-900/30 lg:border lg:border-slate-900/80 text-slate-100" : "bg-white border-r border-slate-250 lg:bg-white lg:border lg:border-slate-200 lg:shadow-xs text-slate-800"}
          `}>
            
            {
    /* Main Header inside Sidebar with Close Button on Mobile */
  }
            <div className={`space-y-1 pb-4 border-b relative ${theme === "dark" ? "border-slate-900/80" : "border-slate-150"}`}>
              <div className="flex items-center justify-between">
                <h2
    onDoubleClick={() => setShowAdminLoginModal(true)}
    className={`text-base font-black tracking-tight flex items-center gap-2 cursor-pointer select-none ${theme === "dark" ? "text-white" : "text-slate-900"}`}
    title="Double-click for Admin Access"
  >
                  <SlidersHorizontal className="w-4 h-4 text-indigo-500" /> Refine Catalog
                </h2>
                {
    /* Close Button on Mobile/Tablet */
  }
                <button
    onClick={() => setShowFilterMenu(false)}
    className={`p-1.5 rounded-lg transition-all lg:hidden ${theme === "dark" ? "bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800"}`}
    title="Close Filters"
  >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className={`text-[11px] ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Select specifications to find SVG, PDF, and templates.</p>
            </div>

            {
    /* Price Filter Options (All, Free, Paid) */
  }
            <div className="space-y-2">
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block ${theme === "dark" ? "text-slate-500" : "text-slate-450"}`}>PRICE LEVEL</span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
    { value: "all", label: "All" },
    { value: "free", label: "Free" },
    { value: "paid", label: "Premium" }
  ].map((opt) => <button
    key={opt.value}
    onClick={() => setPriceFilter(opt.value)}
    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center border ${priceFilter === opt.value ? "bg-indigo-600/10 text-indigo-500 border-indigo-500/45 shadow-xs" : theme === "dark" ? "bg-slate-950/50 text-slate-400 border-slate-900/40 hover:text-slate-250" : "bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100"}`}
  >
                    {opt.label}
                  </button>)}
              </div>
            </div>

            {
    /* Custom File Type Selection Checklist (SVG, PDF, PPT, Video, Image) */
  }
            <div className="space-y-2 pt-1">
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block ${theme === "dark" ? "text-slate-500" : "text-slate-450"}`}>FILE SPECIFICATION</span>
              <div className="flex flex-col gap-1.5 w-full">
                {[
    { key: "svg", label: "\u26A1 SVG Vector Icons" },
    { key: "pdf", label: "\u{1F4C4} PDF Preparations" },
    { key: "ppt", label: "\u{1F4CA} PPT Presentation Templates" },
    { key: "image", label: "\u{1F5BC}\uFE0F Graphics & Mockups" },
    { key: "video", label: "\u{1F3AC} Stock Video Loops" },
    { key: "other", label: "\u{1F4E6} Other / ZIP Bundles" }
  ].map((type) => {
    const isActive = fileTypeFilters.includes(type.key);
    return <button
      key={type.key}
      onClick={() => toggleFileTypeFilter(type.key)}
      className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-between border ${isActive ? "bg-indigo-900/10 text-indigo-600 border-indigo-500/30" : theme === "dark" ? "bg-slate-950/20 text-slate-400 border-transparent hover:bg-slate-950/40" : "bg-slate-50 text-slate-600 border-slate-200/60 hover:bg-slate-100"}`}
    >
                      <span>{type.label}</span>
                      {isActive ? <CheckSquare className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> : <Square className={`w-3.5 h-3.5 shrink-0 ${theme === "dark" ? "text-slate-650" : "text-slate-400"}`} />}
                    </button>;
  })}
              </div>
            </div>

            {
    /* Asset Categories Selection */
  }
            <div className="space-y-2 pt-1">
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block ${theme === "dark" ? "text-slate-500" : "text-slate-450"}`}>THEMATIC CATEGORY</span>
              <div className="flex flex-col gap-1.5 w-full">
                {[
    { value: "all", label: "All Categories" },
    { value: "icons", label: "Icons & SVGs" },
    { value: "templates", label: "PPT & ZIP Slides" },
    { value: "documents", label: "Exam prep & PDFs" },
    { value: "backgrounds", label: "Wallpapers" },
    { value: "photos", label: "High Res Photos" },
    { value: "videos", label: "Video footage" },
    { value: "mockups", label: "Mockups" }
  ].map((cat) => <button
    key={cat.value}
    onClick={() => setSelectedCategory(cat.value)}
    className={`w-full text-left py-2 px-3 rounded-lg text-xs font-bold transition-all border ${selectedCategory === cat.value ? theme === "dark" ? "bg-slate-100 text-slate-950 border-slate-100 font-bold" : "bg-indigo-650 text-white border-indigo-650 font-bold shadow-xs" : theme === "dark" ? "bg-slate-950/20 text-slate-400 border-transparent hover:bg-slate-950/40" : "bg-slate-50 text-slate-600 border-transparent hover:bg-slate-100"}`}
  >
                    {cat.label}
                  </button>)}
              </div>
            </div>

            {
    /* Clear Filters Button */
  }
            {(fileTypeFilters.length > 0 || selectedCategory !== "all" || priceFilter !== "all" || searchQuery) && <button
    onClick={() => {
      setFileTypeFilters([]);
      setSelectedCategory("all");
      setPriceFilter("all");
      setSearchQuery("");
    }}
    className={`w-full text-xs py-2 rounded-xl border font-bold transition-all text-center uppercase tracking-wider ${theme === "dark" ? "bg-slate-950 hover:bg-slate-900 text-rose-400 border-rose-950/40" : "bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200"}`}
  >
                Clear Refinements
              </button>}

          </div>

          {
    /* --- RIGHT STAGE (Unified Inventory Grid & Operations) --- */
  }
          <div className={`${showFilterMenu ? "lg:col-span-3" : "lg:col-span-4"} space-y-6`}>
            
            {
    /* Header / Title block + Order Tracker search bar */
  }
            <div className={`border p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${theme === "dark" ? "bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 border-slate-900/85 text-white" : "bg-white border-slate-200 shadow-xs text-slate-800"}`}>
              <div className="space-y-1">
                <h2 className={`text-xl font-black leading-tight transition-colors ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                  Stock — Free & Premium Assets | TyagiHub
                </h2>
                <p className={`text-xs transition-colors ${theme === "dark" ? "text-slate-400" : "text-slate-650"}`}>
                  Download premium royalty-free vector icons, preparatory solution PDFs, presentations, and mockups.
                </p>
              </div>

              {
    /* Order Retrieval Trigger */
  }
              <button
    onClick={() => setShowLookupPanel(!showLookupPanel)}
    className={`border font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 tracking-wide uppercase shrink-0 ${theme === "dark" ? "bg-slate-950 hover:bg-slate-900 text-indigo-400 border-slate-850" : "bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 border-indigo-200 shadow-xs"}`}
  >
                <Download className="w-4 h-4" />
                {showLookupPanel ? "Hide Claim Form" : "Claim Authorized Download"}
              </button>
            </div>

            {
    /* Collapsible Lookup Download Retrieval Portal */
  }
            {showLookupPanel && <div className={`border rounded-2xl p-5 space-y-4 transition-colors ${theme === "dark" ? "bg-slate-900/40 border-slate-900" : "bg-white border-slate-200 shadow-xs"}`}>
                <div className="space-y-1">
                  <h3 className={`text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors ${theme === "dark" ? "text-indigo-400" : "text-indigo-650"}`}>
                    <Download className="w-3.5 h-3.5" /> Order Download Retrieval Portal (डाउनलोड प्राप्त करें)
                  </h3>
                  <p className={`text-[11px] leading-normal transition-colors ${theme === "dark" ? "text-slate-400" : "text-slate-650"}`}>
                    Enter the 12-digit Paytm UPI Reference Number (UTR) or Order Request ID (REQ-XXXXXX) from your transaction screen to instantly load your permanent, safe download link.
                  </p>
                </div>

                <form onSubmit={handleLookupOrder} className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
    type="text"
    placeholder="Enter 12-digit Paytm UTR or REQ Order ID..."
    value={lookupUtr}
    onChange={(e) => setLookupUtr(e.target.value)}
    className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono focus:outline-none transition-colors ${theme === "dark" ? "bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500" : "bg-slate-50 border-slate-250 text-slate-850 placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white"}`}
  />
                  </div>
                  <button
    type="submit"
    disabled={lookupLoading}
    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wide transition-all shrink-0 flex items-center gap-2 disabled:opacity-50"
  >
                    {lookupLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Search Database"}
                  </button>
                </form>

                {
    /* Lookup Retrieval result container */
  }
                {lookupError && <div className={`border p-3 rounded-xl text-xs leading-relaxed flex items-start gap-2 transition-colors ${theme === "dark" ? "bg-rose-950/25 border-rose-900/40 text-rose-300" : "bg-rose-50 border-rose-150 text-rose-700"}`}>
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-500" />
                    <div>
                      <strong>Order Not Synced Yet:</strong> {lookupError}
                      <p className={`mt-1 text-[11px] ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>If payment is done, Golu Tyagi will auto-verify it momentarily. Please check back in 1 minute.</p>
                    </div>
                  </div>}

                {lookupResult && <div className={`border p-4 rounded-xl space-y-3 text-xs transition-colors ${theme === "dark" ? "bg-slate-950 border-slate-900" : "bg-slate-50 border-slate-200"}`}>
                    <div className={`flex items-center justify-between border-b pb-2.5 ${theme === "dark" ? "border-slate-900" : "border-slate-200"}`}>
                      <div>
                        <p className={`text-[10px] font-mono ${theme === "dark" ? "text-slate-500" : "text-slate-450"}`}>TRANSACTION STATUS</p>
                        <span className={`inline-block mt-0.5 px-2 py-0.5 rounded font-mono font-bold uppercase text-[9px] ${lookupResult.status === "approved" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : lookupResult.status === "rejected" ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 animate-pulse"}`}>
                          {lookupResult.status}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className={`text-[10px] font-mono ${theme === "dark" ? "text-slate-500" : "text-slate-450"}`}>ORDER REQUEST ID</p>
                        <p className={`font-mono font-bold ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>{lookupResult.id}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className={`text-[10px] font-mono ${theme === "dark" ? "text-slate-500" : "text-slate-450"}`}>AUTHORIZED ITEM</p>
                      <p className="font-bold text-indigo-600 text-sm leading-snug">{lookupResult.assetTitle}</p>
                    </div>

                    {lookupResult.status === "approved" ? <div className={`border p-3.5 rounded-xl space-y-2 mt-2 ${theme === "dark" ? "bg-indigo-950/30 border-indigo-900/50 text-slate-300" : "bg-indigo-50 border-indigo-200/60 text-slate-750"}`}>
                        <p className="text-[11px] leading-relaxed">
                          ✓ Payment approved successfully. You are cleared for secure download redirection.
                        </p>
                        
                        {(() => {
    const lookupAsset = assets.find((a) => a.id === lookupResult.assetId);
    const rawDriveId = lookupAsset ? lookupAsset.driveId : lookupResult.assetId || "";
    const cleanDriveId = extractDriveId(rawDriveId);
    if (cleanDriveId) {
      return <div className="flex flex-col sm:flex-row gap-2 pt-1.5">
                                <a
        href={`https://docs.google.com/uc?export=download&id=${cleanDriveId}&confirm=t`}
        target="_blank"
        rel="noreferrer"
        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2.5 px-4 rounded-xl text-center text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
      >
                                  <Download className="w-4 h-4 animate-bounce" /> Download File Now (फाइल डाउनलोड करें)
                                </a>
                                <a
        href={`https://drive.google.com/file/d/${cleanDriveId}/view?usp=sharing`}
        target="_blank"
        rel="noreferrer"
        className={`font-bold py-2.5 px-3 rounded-xl text-center text-[10px] tracking-wide uppercase transition-all flex items-center justify-center gap-1.5 border ${theme === "dark" ? "bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700/60" : "bg-slate-100 hover:bg-slate-200 text-slate-750 border-slate-200"}`}
      >
                                  <ExternalLink className="w-3.5 h-3.5" /> Direct View Link
                                </a>
                              </div>;
    } else {
      return isLiveSync ? <a
        href={`${gasWebAppUrl}?action=download&token=${lookupResult.secureToken || "TOKEN"}`}
        target="_blank"
        rel="noreferrer"
        className="mt-1.5 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2.5 rounded-xl text-center text-xs tracking-wide uppercase transition-all flex items-center justify-center gap-2"
      >
                                <Download className="w-4 h-4 animate-bounce" /> Retrieve Download Token Link
                              </a> : <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-center text-amber-400 font-mono text-[11px] mt-1.5">
                                Sandbox Offline Mode Only: Secure link hidden
                              </div>;
    }
  })()}
                      </div> : lookupResult.status === "pending" ? <div className="bg-yellow-950/20 border border-yellow-900/40 p-3 rounded-xl text-slate-300 flex items-start gap-2">
                        <Clock className="w-4 h-4 shrink-0 text-yellow-400 mt-0.5" />
                        <div className="space-y-0.5">
                          <p className="font-bold text-yellow-300">Awaiting Auto-Email Scanner Approval</p>
                          <p className="text-[11px] text-slate-400">Once Paytm Business registers your payment, your UTR matches automatically inside Google Sheets logs. Checking back soon.</p>
                        </div>
                      </div> : <div className="bg-rose-950/25 border border-rose-900/40 p-3 rounded-xl text-rose-300">
                        <strong>Request Declined:</strong> This order transaction has been marked rejected. Ensure your transaction ID was fully correct or contact Golu Tyagi.
                      </div>}
                  </div>}
              </div>}

            {
    /* Live Search Row */
  }
            <div className={`flex flex-col md:flex-row gap-3 p-3 rounded-xl border items-center justify-between transition-colors ${theme === "dark" ? "bg-slate-900/30 border-slate-900" : "bg-white border-slate-200 shadow-xs"}`}>
              <div className="flex items-center gap-2 flex-1 w-full">
                <button
    onClick={() => setShowFilterMenu(!showFilterMenu)}
    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shrink-0 ${showFilterMenu ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-950/25" : theme === "dark" ? "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-250" : "bg-slate-55 border-slate-200 text-slate-600 hover:text-slate-850"}`}
    title="Toggle filter specifications menu"
  >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{showFilterMenu ? "Hide Filters" : "Show Filters"}</span>
                </button>

                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
    type="text"
    placeholder="Type to search premium or free resources instantly..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className={`w-full border rounded-xl pl-9 pr-4 py-1.5 text-xs focus:outline-none transition-colors ${theme === "dark" ? "bg-slate-950 border-slate-800/80 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500" : "bg-slate-50 border-slate-250 text-slate-800 placeholder:text-slate-450 focus:border-indigo-650 focus:bg-white"}`}
  />
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 justify-between md:justify-end w-full md:w-auto border-t border-slate-900/50 md:border-0 pt-2.5 md:pt-0">
                <span className={`text-[11px] font-mono uppercase tracking-widest ${theme === "dark" ? "text-slate-500" : "text-slate-450"}`}>
                  Showing: {filteredAssets.length} products
                </span>
                <select
    value={sortOption}
    onChange={(e) => setSortOption(e.target.value)}
    className={`border rounded-xl text-[11px] py-1.5 px-3 focus:outline-none cursor-pointer transition-all ${theme === "dark" ? "bg-slate-950 border-slate-800 hover:border-slate-750 text-slate-300" : "bg-white border-slate-250 text-slate-750 hover:border-slate-350"}`}
  >
                  <option value="newest">📅 Newly Listed</option>
                  <option value="price-asc">📉 Price: Low to High (कम से ज्यादा)</option>
                  <option value="price-desc">📈 Price: High to Low (ज्यादा से कम)</option>
                  <option value="name-asc">🔤 Title A-Z</option>
                </select>
              </div>
            </div>

            {
    /* --- CORE CARD GRID OF DIGITAL ASSETS --- */
  }
            {filteredAssets.length === 0 ? <div className={`border rounded-2xl py-16 px-6 text-center space-y-4 transition-colors ${theme === "dark" ? "bg-slate-900/10 border-slate-900/80" : "bg-slate-100/50 border-slate-200"}`}>
                <div className={`mx-auto w-10 h-10 border flex items-center justify-center rounded-xl transition-colors ${theme === "dark" ? "bg-slate-900 border-slate-850 text-slate-600" : "bg-white border-slate-250 text-slate-400 shadow-2xs"}`}>
                  <Archive className="w-5 h-5" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto text-xs">
                  <h3 className={`font-bold ${theme === "dark" ? "text-slate-300" : "text-slate-800"}`}>
                    {assets.length === 0 ? "No products listed yet" : "No matches found"}
                  </h3>
                  <p className={`leading-normal ${theme === "dark" ? "text-slate-500" : "text-slate-600"}`}>
                    {assets.length === 0 ? "The store is currently empty. Connect your Google Sheet or add a new product from the Admin Panel to begin." : "Try refining your left specification checks, pricing filters, or type another search term."}
                  </p>
                </div>
              </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredAssets.map((asset) => {
    const isFree = asset.price === 0;
    const hasSub = currentUser && currentUser.subscription;
    const guestPrice = Math.round(asset.price * 1.15);
    const getSvgComplexityClass = (price) => {
      if (price === 0) return { name: "Free Utility", color: "text-emerald-400 bg-emerald-500/10" };
      if (price <= 19) return { name: "Low Complexity SVG", color: "text-sky-400 bg-sky-500/10" };
      if (price <= 39) return { name: "Medium Complexity SVG", color: "text-indigo-400 bg-indigo-500/10" };
      if (price <= 79) return { name: "Heavy Complexity SVG", color: "text-amber-400 bg-amber-500/10" };
      return { name: "High-End Motion SVG", color: "text-rose-400 bg-rose-500/10" };
    };
    const complexity = getSvgComplexityClass(asset.price);
    return <motion.div
      key={asset.id}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => setDetailAsset(asset)}
      className={`rounded-xl overflow-hidden transition-all flex flex-col group relative cursor-pointer h-full border ${theme === "dark" ? "bg-slate-900/30 border-slate-900/80 hover:border-slate-850 hover:shadow-lg hover:shadow-indigo-950/10" : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-lg hover:shadow-indigo-500/5"}`}
    >
                      {
      /* Premium Covered Thumbnail with baked canvas DRM protection */
    }
                      <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                        <SecurePreviewImage
      src={getAssetPreviewUrl(asset)}
      alt={asset.title}
      isFree={isFree || !!hasSub}
      type={asset.type}
      className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-300 ${!isFree ? "contrast-[1.03] brightness-[0.88]" : ""}`}
    />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 z-20 pointer-events-none" />
                        
                        {
      /* Status/Badge */
    }
                        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-30 items-start">
                          <span className={`px-2 py-0.5 text-[9px] font-mono font-black uppercase rounded tracking-wider ${isFree ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : hasSub ? "bg-gradient-to-r from-amber-500 to-indigo-650 text-white border border-indigo-500/25 shadow-xs font-bold" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
                            {isFree ? "Free Access" : hasSub ? "\u{1F451} Sub Unlocked" : "Premium File"}
                          </span>
                          <span className={`px-1.5 py-0.5 text-[8px] font-extrabold uppercase rounded ${complexity.color}`}>
                            {complexity.name}
                          </span>
                        </div>
 
                        {
      /* File Format Badge */
    }
                        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-slate-950/95 px-2 py-0.5 rounded text-[9px] font-mono text-slate-300 border border-slate-850 z-30 font-bold uppercase">
                          {asset.type} • {asset.size}
                        </div>
                      </div>
 
                      {
      /* Info block */
    }
                      <div className={`p-4 flex-1 flex flex-col justify-between space-y-3.5 transition-colors ${theme === "dark" ? "bg-slate-950/20" : "bg-slate-50/40"}`}>
                        <div className="space-y-1.5 flex-1">
                          <h3 className={`text-xs font-bold leading-relaxed transition-colors line-clamp-2 ${theme === "dark" ? "text-white group-hover:text-indigo-400" : "text-slate-800 group-hover:text-indigo-650"}`} title={asset.title}>
                            {asset.title}
                          </h3>
                          {asset.description && <p className={`text-[10px] line-clamp-2 leading-normal transition-colors ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                              {asset.description}
                            </p>}
                        </div>
 
                        <div className={`flex items-center justify-between pt-3 mt-auto border-t ${theme === "dark" ? "border-slate-900/60" : "border-slate-100"}`}>
                          <div>
                            <p className={`text-[8px] font-mono uppercase tracking-widest ${theme === "dark" ? "text-slate-550" : "text-slate-450"}`}>PRICE</p>
                            {isFree ? <p className="text-xs font-mono font-black text-emerald-500">FREE</p> : hasSub ? <p className="text-xs font-mono font-black text-emerald-400 flex items-center gap-1">
                                <Crown className="w-3 h-3 text-amber-400" /> ₹0 (VIP Pass)
                              </p> : currentUser ? <p className="text-xs font-mono font-black text-indigo-300">
                                ₹{asset.price} <span className="text-[9px] font-normal text-slate-550">(Base)</span>
                              </p> : <div className="flex flex-col">
                                <p className="text-xs font-mono font-black text-amber-500">
                                  ₹{guestPrice} <span className="text-[9px] font-bold text-rose-500/80">(Surcharged)</span>
                                </p>
                                <p className="text-[8px] text-slate-500 leading-none">VIP Members: ₹{asset.price}</p>
                              </div>}
                          </div>
                          
                          <div className={`flex items-center gap-0.5 text-[10px] font-bold transition-colors ${theme === "dark" ? "text-indigo-400 group-hover:text-indigo-300" : "text-indigo-650 group-hover:text-indigo-700"}`}>
                            <span>{isFree || hasSub ? "Get Now" : "Claim Now"}</span>
                            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </motion.div>;
  })}
              </div>}

          </div>

        </div>

      </main>

      {
    /* Secure Admin Control Panel inside hidden bottom drawer */
  }
      {isAdminMode && showAdminPanel && <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`max-w-4xl mx-auto border p-5 rounded-2xl text-left space-y-6 transition-colors ${theme === "dark" ? "bg-slate-900/50 border-slate-900 text-slate-200" : "bg-white border-slate-200 shadow-xs text-slate-800"}`}
  >
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-3 ${theme === "dark" ? "border-slate-900" : "border-slate-250"}`}>
                <div className="space-y-0.5">
                  <h3 className={`text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                    <Lock className="w-3.5 h-3.5 text-indigo-500" /> Admin Command Center
                  </h3>
                  <p className={`text-[11px] ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>Add digital products, delete listings, and synchronize Paytm Business email receipts manually.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
    onClick={handleSyncPaytmEmails}
    disabled={syncEmailsLoading || !isLiveSync}
    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-40 uppercase"
  >
                    <RefreshCw className={`w-3 h-3 ${syncEmailsLoading ? "animate-spin" : ""}`} />
                    Sync Paytm Emails
                  </button>
                  <button
    onClick={() => setShowAddAssetForm(!showAddAssetForm)}
    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1 uppercase"
  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    {showAddAssetForm ? "Close Product Form" : "Add New Product"}
                  </button>
                </div>
              </div>

              {
    /* Email sync response logs */
  }
              {syncEmailsMessage && <div className={`border p-3 rounded-xl flex gap-2.5 text-xs ${theme === "dark" ? "bg-indigo-950/25 border-indigo-900/40 text-indigo-300" : "bg-indigo-50 border-indigo-150 text-indigo-750"}`}>
                  <Inbox className="w-4.5 h-4.5 shrink-0 text-indigo-500 mt-0.5" />
                  <div>
                    <h4 className={`font-bold uppercase text-[10px] ${theme === "dark" ? "text-indigo-200" : "text-indigo-800"}`}>Gmail Scanner Output Log</h4>
                    <p className="mt-0.5 leading-relaxed">{syncEmailsMessage}</p>
                  </div>
                </div>}

              {
    /* Add New Digital Product Form */
  }
              {showAddAssetForm && <div className={`p-4 rounded-xl border space-y-4 ${theme === "dark" ? "bg-slate-950/60 border-slate-900" : "bg-slate-50 border-slate-200"}`}>
                  <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">Configure New Digital Product (नया उत्पाद जोड़ें)</h4>
                  <form onSubmit={handleAddNewProduct} className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className={`font-medium ${theme === "dark" ? "text-slate-400" : "text-slate-650"}`}>Product Title</label>
                      <input
    type="text"
    placeholder="e.g. Photoshop Vector Pack"
    value={newTitle}
    onChange={(e) => setNewTitle(e.target.value)}
    required
    className={`w-full border rounded-lg px-3 py-2 focus:outline-none transition-colors ${theme === "dark" ? "bg-slate-900 border-slate-800 text-slate-200 focus:border-indigo-500" : "bg-white border-slate-250 text-slate-800 focus:border-indigo-650"}`}
  />
                    </div>
                    <div className="space-y-1">
                      <label className={`font-medium ${theme === "dark" ? "text-slate-400" : "text-slate-650"}`}>Category Type</label>
                      <select
    value={newType}
    onChange={(e) => setNewType(e.target.value)}
    className={`w-full border rounded-lg px-3 py-2 focus:outline-none transition-colors ${theme === "dark" ? "bg-slate-900 border-slate-800 text-slate-200 focus:border-indigo-500" : "bg-white border-slate-250 text-slate-800 focus:border-indigo-650"}`}
  >
                        <option value="image">Image / SVG Vector</option>
                        <option value="pdf">PDF preparation / Document</option>
                        <option value="video">MP4 Video Clip</option>
                        <option value="zip">ZIP Source bundle</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className={`font-medium ${theme === "dark" ? "text-slate-400" : "text-slate-650"}`}>File Storage Size</label>
                      <input
    type="text"
    placeholder="e.g. 1.2 MB or 450 KB"
    value={newSize}
    onChange={(e) => setNewSize(e.target.value)}
    className={`w-full border rounded-lg px-3 py-2 focus:outline-none transition-colors ${theme === "dark" ? "bg-slate-900 border-slate-800 text-slate-200 focus:border-indigo-500" : "bg-white border-slate-250 text-slate-800 focus:border-indigo-650"}`}
  />
                    </div>
                    <div className="space-y-1">
                      <label className={`font-medium ${theme === "dark" ? "text-slate-400" : "text-slate-650"}`}>Asset Price (₹) - Set 0 for free</label>
                      <input
    type="number"
    placeholder="Price"
    value={newPrice}
    onChange={(e) => setNewPrice(Number(e.target.value))}
    className={`w-full border rounded-lg px-3 py-2 focus:outline-none transition-colors ${theme === "dark" ? "bg-slate-900 border-slate-800 text-slate-200 focus:border-indigo-500" : "bg-white border-slate-250 text-slate-850 focus:border-indigo-650"}`}
  />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className={`font-medium ${theme === "dark" ? "text-slate-400" : "text-slate-650"}`}>Google Drive target download file ID</label>
                      <input
    type="text"
    placeholder="Google Drive ID"
    value={newDriveId}
    onChange={(e) => setNewDriveId(e.target.value)}
    required
    className={`w-full border rounded-lg px-3 py-2 focus:outline-none font-mono transition-colors ${theme === "dark" ? "bg-slate-900 border-slate-800 text-slate-200 focus:border-indigo-500" : "bg-white border-slate-250 text-slate-850 focus:border-indigo-650"}`}
  />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className={`font-medium ${theme === "dark" ? "text-slate-400" : "text-slate-650"}`}>Public Preview Thumbnail Image URL (Optional)</label>
                      <input
    type="text"
    placeholder="Leave blank to auto generate from Drive, or paste Unsplash/Imgur links"
    value={newPreviewUrl}
    onChange={(e) => setNewPreviewUrl(e.target.value)}
    className={`w-full border rounded-lg px-3 py-2 focus:outline-none transition-colors ${theme === "dark" ? "bg-slate-900 border-slate-800 text-slate-200 focus:border-indigo-500" : "bg-white border-slate-250 text-slate-800 focus:border-indigo-650"}`}
  />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className={`font-medium ${theme === "dark" ? "text-slate-400" : "text-slate-650"}`}>Detailed Description</label>
                      <textarea
    rows={2}
    placeholder="Explain features, usage rights, resolution..."
    value={newDescription}
    onChange={(e) => setNewDescription(e.target.value)}
    className={`w-full border rounded-lg px-3 py-2 focus:outline-none resize-none transition-colors ${theme === "dark" ? "bg-slate-900 border-slate-800 text-slate-200 focus:border-indigo-500" : "bg-white border-slate-250 text-slate-800 focus:border-indigo-650"}`}
  />
                    </div>
                    <button
    type="submit"
    className="md:col-span-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl transition-all uppercase tracking-wide text-xs"
  >
                      Save Product Record
                    </button>
                  </form>
                </div>}

              {
    /* Products Inventory list & order request table */
  }
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                
                {
    /* Active Inventory */
  }
                <div className="space-y-3">
                  <h4 className={`text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1 ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                    <Archive className="w-3.5 h-3.5" /> Inventory List ({assets.length})
                  </h4>
                  <div className={`space-y-2 max-h-64 overflow-y-auto p-2 rounded-xl border pr-1 transition-colors ${theme === "dark" ? "bg-slate-950/40 border-slate-900" : "bg-slate-50 border-slate-200"}`}>
                    {assets.map((a) => <div key={a.id} className={`p-2.5 border rounded-lg flex items-center justify-between text-xs gap-3 transition-colors ${theme === "dark" ? "bg-slate-950 border-slate-900 text-slate-200" : "bg-white border-slate-200 text-slate-800"}`}>
                        <div className="truncate">
                          <p className={`font-bold truncate ${theme === "dark" ? "text-white" : "text-slate-850"}`}>{a.title}</p>
                          <p className={`text-[10px] font-mono ${theme === "dark" ? "text-slate-500" : "text-slate-450"}`}>ID: {a.id} | Price: ₹{a.price}</p>
                        </div>
                        <button
    onClick={() => handleDeleteProduct(a.id)}
    className={`p-1 rounded transition-all border ${theme === "dark" ? "text-rose-400 border-rose-950 hover:bg-rose-950/20" : "text-rose-600 border-rose-200 hover:bg-rose-50"}`}
    title="Delete product"
  >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>)}
                  </div>
                </div>

                {
    /* Checkout requests */
  }
                <div className="space-y-3">
                  <h4 className={`text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1 ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                    <TrendingUp className="w-3.5 h-3.5" /> Order Requests logs ({requests.length})
                  </h4>
                  <div className={`space-y-2 max-h-64 overflow-y-auto p-2 rounded-xl border pr-1 text-[11px] transition-colors ${theme === "dark" ? "bg-slate-950/40 border-slate-900" : "bg-slate-50 border-slate-200"}`}>
                    {requests.length === 0 ? <p className={`text-center py-6 text-xs font-mono ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>No order records found.</p> : requests.map((r) => <div key={r.id} className={`p-2.5 border rounded-lg space-y-1.5 transition-colors ${theme === "dark" ? "bg-slate-950 border-slate-900" : "bg-white border-slate-200"}`}>
                          <div className="flex items-center justify-between gap-1 font-mono text-[10px]">
                            <span className={`font-bold ${theme === "dark" ? "text-white" : "text-slate-800"}`}>{r.customerName}</span>
                            <span className={`px-1.5 rounded uppercase text-[9px] font-bold ${r.status === "approved" ? "bg-emerald-950/40 text-emerald-500 border border-emerald-900/30" : "bg-yellow-950/40 text-yellow-500 border border-yellow-900/20 animate-pulse"}`}>{r.status}</span>
                          </div>
                          <p className={`truncate text-[10px] ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>{r.assetTitle}</p>
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>UTR: {r.transactionId || "FREE"}</span>
                            {r.status === "pending" && <div className="space-x-1">
                                <button
    onClick={() => handleUpdateOrderStatus(r.id, "approved")}
    className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold uppercase text-[9px]"
  >
                                  Approve
                                </button>
                                <button
    onClick={() => handleUpdateOrderStatus(r.id, "rejected")}
    className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold uppercase text-[9px]"
  >
                                  Reject
                                </button>
                              </div>}
                            <button
    onClick={() => handleDeleteOrder(r.id)}
    className="text-rose-400 hover:underline text-[9px]"
  >
                              Delete
                            </button>
                          </div>
                        </div>)}
                  </div>
                </div>

                {
    /* VIP Subscriptions */
  }
                <div className="space-y-3">
                  <h4 className={`text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1 ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                    <Crown className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> VIP Subscriptions ({subscriptions.length})
                  </h4>
                  <div className={`space-y-2 max-h-64 overflow-y-auto p-2 rounded-xl border pr-1 text-[11px] transition-colors ${theme === "dark" ? "bg-slate-950/40 border-slate-900" : "bg-slate-50 border-slate-200"}`}>
                    {subscriptions.length === 0 ? <p className={`text-center py-6 text-xs font-mono ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>No subscription requests logged.</p> : subscriptions.map((sub) => <div key={sub.id} className={`p-2.5 border rounded-lg space-y-1.5 transition-colors ${theme === "dark" ? "bg-slate-950 border-slate-900" : "bg-white border-slate-200"}`}>
                          <div className="flex items-center justify-between gap-1 font-mono text-[10px]">
                            <span className={`font-bold ${theme === "dark" ? "text-white" : "text-slate-800"}`}>{sub.userName}</span>
                            <span className={`px-1.5 rounded uppercase text-[9px] font-bold ${sub.status === "approved" ? "bg-amber-950/40 text-amber-500 border border-amber-900/30" : "bg-yellow-950/40 text-yellow-500 border border-yellow-900/20 animate-pulse"}`}>{sub.status}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-500">{sub.userEmail}</span>
                            <span className="font-bold text-indigo-500 font-mono">{sub.planName}</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5 border-t border-slate-100 dark:border-slate-900">
                            <span>UTR: {sub.transactionId}</span>
                            {sub.status === "pending" && <div className="space-x-1">
                                <button
    onClick={() => handleUpdateSubscriptionStatus(sub.id, "approved")}
    className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold uppercase text-[9px]"
  >
                                  Approve
                                </button>
                                <button
    onClick={() => handleUpdateSubscriptionStatus(sub.id, "rejected")}
    className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold uppercase text-[9px]"
  >
                                  Reject
                                </button>
                              </div>}
                          </div>
                        </div>)}
                  </div>
                </div>

              </div>

            </motion.div>}

      {
    /* Floating Admin Settings Widget for active Golu session */
  }
      {isAdminMode && <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
          {showAdminPanel && <div className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md">
              ✓ Admin Active
            </div>}
          <div className="flex gap-2">
            <button
    onClick={() => setShowAdminPanel(!showAdminPanel)}
    className="p-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl transition-all border border-indigo-500/25 flex items-center justify-center"
    title={showAdminPanel ? "Hide Admin Controls" : "Open Admin Controls"}
  >
              <Settings className={`w-5 h-5 ${showAdminPanel ? "animate-spin" : ""}`} />
            </button>
            <button
    onClick={handleAdminLogout}
    className="p-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-xl transition-all border border-rose-500/25 flex items-center justify-center text-xs font-bold"
    title="Logout Admin"
  >
              🚪
            </button>
          </div>
        </div>}

       {
    /* --- FLIPKART STYLE PRODUCT DETAILS MODAL --- */
  }
      <AnimatePresence>
        {detailAsset && (() => {
    const isUnlocked = detailAsset.price === 0 || requests.some((r) => r.assetId === detailAsset.id && r.status === "approved");
    const isSvg = detailAsset.driveId.trim().startsWith("<svg") || detailAsset.driveId.includes("<svg") || detailAsset.type === "svg";
    const handleDownloadCleanSVG = () => {
      if (!isUnlocked) return;
      const rawSvg = detailAsset.driveId;
      const blob = new Blob([rawSvg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${detailAsset.title.toLowerCase().replace(/\s+/g, "_")}_clean.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
    const handleDownloadPNG = () => {
      if (!isUnlocked) return;
      const rawSvg = detailAsset.driveId;
      const blob = new Blob([rawSvg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          try {
            const pngUrl = canvas.toDataURL("image/png");
            const a = document.createElement("a");
            a.href = pngUrl;
            a.download = `${detailAsset.title.toLowerCase().replace(/\s+/g, "_")}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          } catch (e) {
            console.error("PNG conversion failed", e);
          }
        }
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
      };
      img.src = url;
    };
    const handleDownloadCleanXML = () => {
      if (!isUnlocked) return;
      const rawSvg = detailAsset.driveId;
      const blob = new Blob([rawSvg], { type: "text/xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${detailAsset.title.toLowerCase().replace(/\s+/g, "_")}_code.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
    const handleDownloadCleanPDFText = () => {
      if (!isUnlocked) return;
      const fullContent = detailAsset.driveId && detailAsset.driveId.length > 40 && !extractDriveId(detailAsset.driveId) ? detailAsset.driveId : detailAsset.description || "Verified solutions prep guide.";
      generateAndDownloadPDF(detailAsset.title, fullContent);
    };
    const handleDownloadWordDOC = () => {
      if (!isUnlocked) return;
      const fullContent = detailAsset.driveId && detailAsset.driveId.length > 40 && !extractDriveId(detailAsset.driveId) ? detailAsset.driveId : detailAsset.description || "Verified solutions prep guide.";
      generateAndDownloadDOC(detailAsset.title, fullContent);
    };
    const cleanDriveId = extractDriveId(detailAsset.driveId);
    return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
              <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 30, scale: 0.95 }}
      className={`border rounded-2xl overflow-hidden max-w-4xl w-full shadow-2xl relative my-8 transition-colors ${theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
    >
                <button
      onClick={() => setDetailAsset(null)}
      className={`absolute top-4 right-4 z-40 p-2 rounded-full border transition-all shadow-lg ${theme === "dark" ? "bg-slate-950/80 hover:bg-slate-800 text-slate-400 border-slate-850 hover:text-white" : "bg-white/90 hover:bg-slate-100 text-slate-500 border-slate-200 hover:text-slate-850"}`}
    >
                  <X className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2">
                  
                  {
      /* Left image stage with baked canvas DRM protection */
    }
                  <div className={`relative aspect-square md:aspect-auto md:h-full min-h-[300px] md:min-h-[450px] flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r p-4 transition-colors ${theme === "dark" ? "bg-slate-950 border-slate-800/60" : "bg-slate-100/40 border-slate-200"}`}>
                    
                    <img
      src={getAssetPreviewUrl(detailAsset)}
      alt=""
      className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-35 scale-110 pointer-events-none select-none"
    />

                    <div className="relative z-10 max-h-[380px] max-w-full w-auto h-auto flex items-center justify-center">
                      <SecurePreviewImage
      src={getAssetPreviewUrl(detailAsset)}
      alt={detailAsset.title}
      isFree={isUnlocked}
      type={isSvg ? "svg" : detailAsset.type}
      pdfContent={detailAsset.driveId && detailAsset.driveId.length > 40 && !extractDriveId(detailAsset.driveId) ? detailAsset.driveId : detailAsset.description}
      className={`max-h-[380px] max-w-full w-auto h-auto object-contain rounded-lg shadow-2xl transition-transform hover:scale-[1.01] duration-300 ${!isUnlocked ? "contrast-[1.03] brightness-[0.88]" : ""}`}
    />
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 z-20 pointer-events-none" />

                    {
      /* Format/Size indicator */
    }
                    <div className={`absolute bottom-4 left-4 text-[10px] font-mono px-2.5 py-1 rounded-lg border z-30 flex items-center gap-1 font-bold uppercase transition-colors ${theme === "dark" ? "bg-slate-950/90 text-slate-300 border-slate-800" : "bg-white/95 text-slate-700 border-slate-250 shadow-2xs"}`}>
                      {detailAsset.type === "zip" && <Archive className="w-3.5 h-3.5 text-yellow-500" />}
                      {detailAsset.type === "pdf" && <FileText className="w-3.5 h-3.5 text-red-500" />}
                      {detailAsset.type === "image" && <FileImage className="w-3.5 h-3.5 text-blue-500" />}
                      {detailAsset.type === "video" && <VideoIcon className="w-3.5 h-3.5 text-purple-500" />}
                      <span>{detailAsset.type} • {detailAsset.size}</span>
                    </div>
                  </div>

                  {
      /* Right Details stage */
    }
                  <div className="p-6 md:p-8 flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-mono font-bold px-2.5 py-1 rounded border uppercase tracking-widest transition-colors ${theme === "dark" ? "bg-slate-950 text-indigo-400 border-slate-800" : "bg-slate-100 text-indigo-650 border-slate-200"}`}>
                          DRM Verified Asset
                        </span>
                        <span className={`text-[11px] font-mono ${theme === "dark" ? "text-slate-600" : "text-slate-450"}`}>• ID: {detailAsset.id}</span>
                      </div>

                      <h2 className={`text-lg md:text-xl font-extrabold leading-snug transition-colors ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                        {detailAsset.title}
                      </h2>

                      <div className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${theme === "dark" ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-200"}`}>
                        <div>
                          <p className={`text-[9px] font-mono uppercase tracking-wider ${theme === "dark" ? "text-slate-500" : "text-slate-450"}`}>LICENSE COST</p>
                          <div className="flex items-baseline gap-2 mt-0.5">
                            <span className={`text-xl font-black ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                              {detailAsset.price === 0 ? "FREE DOWNLOAD" : `\u20B9${detailAsset.price}`}
                            </span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-mono font-black uppercase px-2.5 py-1 rounded-md ${isUnlocked ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20"}`}>
                          {isUnlocked ? "Unlocked / Paid" : "Verified Purchase"}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <h4 className={`text-[10px] font-mono font-bold uppercase tracking-wider ${theme === "dark" ? "text-slate-500" : "text-slate-450"}`}>File Specifications</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                          <div className={`p-2 rounded-xl border flex flex-col transition-colors ${theme === "dark" ? "bg-slate-950/40 border-slate-900" : "bg-slate-50 border-slate-200/60"}`}>
                            <span className="text-slate-500 text-[9px]">FORMAT TYPE</span>
                            <span className={`uppercase font-bold mt-0.5 ${theme === "dark" ? "text-slate-200" : "text-slate-850"}`}>{detailAsset.type}</span>
                          </div>
                          <div className={`p-2 rounded-xl border flex flex-col transition-colors ${theme === "dark" ? "bg-slate-950/40 border-slate-900" : "bg-slate-50 border-slate-200/60"}`}>
                            <span className="text-slate-500 text-[9px]">STORAGE WEIGHT</span>
                            <span className={`font-bold mt-0.5 ${theme === "dark" ? "text-slate-200" : "text-slate-850"}`}>{detailAsset.size}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <h4 className={`text-[10px] font-mono font-bold uppercase tracking-wider ${theme === "dark" ? "text-slate-500" : "text-slate-450"}`}>Description (विवरण)</h4>
                        <p className={`text-xs leading-relaxed max-h-[140px] overflow-y-auto pr-2 p-3 rounded-xl border transition-colors scrollbar-thin ${theme === "dark" ? "text-slate-300 bg-slate-950/20 border-slate-900/60" : "text-slate-700 bg-slate-50/60 border-slate-200"}`}>
                          {detailAsset.description || "No description provided."}
                        </p>
                      </div>
                    </div>

                    {
      /* Actions footer inside details modal */
    }
                    <div className={`space-y-3 pt-4 border-t ${theme === "dark" ? "border-slate-850" : "border-slate-200"}`}>
                      {isUnlocked ? <div className="space-y-2.5">
                          <p className="text-[10px] text-center font-mono font-black text-emerald-500 uppercase tracking-widest animate-pulse">✓ Access Clearance Approved</p>
                          
                          {isSvg && <div className={`p-3 rounded-xl border transition-colors ${theme === "dark" ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-200"}`}>
                              <p className="text-[10px] font-mono text-indigo-500 font-bold uppercase tracking-wider text-center">🎯 Select Your Download Format</p>
                              <div className="grid grid-cols-1 gap-2">
                                <button
      onClick={handleDownloadCleanSVG}
      className="w-full py-2.5 px-4 text-xs font-black tracking-wider uppercase rounded-xl transition-all shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2"
    >
                                  <Download className="w-3.5 h-3.5" />
                                  Download Clean SVG File (.svg)
                                </button>
                                <button
      onClick={handleDownloadPNG}
      className="w-full py-2.5 px-4 text-xs font-black tracking-wider uppercase rounded-xl transition-all shadow-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2"
    >
                                  <FileImage className="w-3.5 h-3.5" />
                                  Convert & Download PNG (.png)
                                </button>
                                <button
      onClick={handleDownloadCleanXML}
      className="w-full py-2.5 px-4 text-xs font-black tracking-wider uppercase rounded-xl transition-all shadow-lg bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-2"
    >
                                  <FileText className="w-3.5 h-3.5" />
                                  Download Raw XML (.xml)
                                </button>
                              </div>
                            </div>}

                          {detailAsset.type === "pdf" && <div className={`p-3 rounded-xl border transition-colors ${theme === "dark" ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-200"}`}>
                              <p className="text-[10px] font-mono text-indigo-500 font-bold uppercase tracking-wider text-center">🎯 Choose Your Download Format</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                <button
      onClick={handleDownloadCleanPDFText}
      className="w-full py-2.5 px-4 text-xs font-black tracking-wider uppercase rounded-xl transition-all shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2"
    >
                                  <Download className="w-3.5 h-3.5 animate-bounce" />
                                  Download PDF (.pdf)
                                </button>
                                <button
      onClick={handleDownloadWordDOC}
      className="w-full py-2.5 px-4 text-xs font-black tracking-wider uppercase rounded-xl transition-all shadow-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2"
    >
                                  <FileText className="w-3.5 h-3.5" />
                                  Download Word (.doc)
                                </button>
                              </div>
                            </div>}

                          {!isSvg && detailAsset.type !== "pdf" && cleanDriveId && <a
      href={`https://docs.google.com/uc?export=download&id=${cleanDriveId}&confirm=t`}
      target="_blank"
      rel="noreferrer"
      className="w-full py-3 px-6 text-xs font-black tracking-wider uppercase rounded-xl transition-all shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 text-center"
    >
                              <Download className="w-4 h-4 animate-bounce" />
                              Download Original File
                            </a>}
                        </div> : <div className="space-y-3">
                          {isSvg && <div className={`p-3 rounded-xl border space-y-1.5 transition-colors ${theme === "dark" ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-200"}`}>
                              <p className={`text-[10px] font-mono font-bold uppercase tracking-wider ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>🔒 MULTI-FORMAT LICENSE INCLUDED</p>
                              <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                                <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/20">📁 SVG (Vector)</span>
                                <span className="bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded border border-blue-500/20">🖼️ PNG (Image)</span>
                                <span className="bg-purple-500/10 text-purple-500 px-2 py-0.5 rounded border border-purple-500/20">📝 XML (Code)</span>
                              </div>
                              <p className={`text-[9px] italic ${theme === "dark" ? "text-slate-500" : "text-slate-450"}`}>Watermarked live preview active. All formats unlocked immediately upon transaction verification.</p>
                            </div>}
                          {detailAsset.price === 0 ? <button
      onClick={() => {
        setDetailAsset(null);
        setCheckoutAsset(detailAsset);
        setCustName("");
        setCustEmail("");
        setCustWhatsapp("");
        setCustUtr("");
        setVerificationState("idle");
        setVerificationError("");
      }}
      className="w-full py-3 px-6 text-xs font-black tracking-wider uppercase rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/20"
    >
                              <Download className="w-4 h-4" />
                              Download Free (मुफ्त डाउनलोड)
                            </button> : <div className="space-y-3 w-full">
                              {currentUser ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                  {
      /* Download with Pass Credits Button */
    }
                                  <button
      onClick={() => handleDownloadWithPassCredits(detailAsset)}
      disabled={downloadWithCreditsLoading || (currentUser.creditsBalance ?? 0) < detailAsset.price || currentUser.expiryDate === "Expired"}
      className={`py-3 px-4 text-xs font-black tracking-wider uppercase rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 ${(currentUser.creditsBalance ?? 0) >= detailAsset.price && currentUser.expiryDate !== "Expired" ? "bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white shadow-indigo-950/20" : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-850"}`}
    >
                                    {downloadWithCreditsLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4 text-amber-300 animate-pulse" />}
                                    <span>Use Pass ({detailAsset.price} Cr)</span>
                                  </button>

                                  {
      /* Buy Individual Cash QR Button */
    }
                                  <button
      onClick={() => {
        setDetailAsset(null);
        setCheckoutAsset(detailAsset);
        setCustName(currentUser.displayName);
        setCustEmail(currentUser.email);
        setCustWhatsapp("");
        setCustUtr("");
        setVerificationState("idle");
        setVerificationError("");
      }}
      className="py-3 px-4 text-xs font-bold tracking-wider uppercase rounded-xl transition-all border border-slate-700/60 hover:bg-slate-800 bg-slate-900 text-slate-200 flex items-center justify-center gap-1.5"
    >
                                    <QrCode className="w-4 h-4" />
                                    <span>Buy (₹{detailAsset.price})</span>
                                  </button>
                                </div> : <div className="space-y-2.5 w-full">
                                  {
      /* Buy Individual as Guest */
    }
                                  <button
      onClick={() => {
        setDetailAsset(null);
        setCheckoutAsset(detailAsset);
        setCustName("");
        setCustEmail("");
        setCustWhatsapp("");
        setCustUtr("");
        setVerificationState("idle");
        setVerificationError("");
      }}
      className="w-full py-3 px-6 text-xs font-black tracking-wider uppercase rounded-xl transition-all shadow-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/20 flex items-center justify-center gap-2"
    >
                                    <QrCode className="w-4 h-4" />
                                    <span>Buy Individual (₹{Math.round(detailAsset.price * 1.15)}) [Guest Surcharged]</span>
                                  </button>

                                  {
      /* Login recommendation */
    }
                                  <button
      onClick={() => {
        setDetailAsset(null);
        setShowAuthModal(true);
      }}
      className="w-full py-2 text-center text-xs font-bold text-indigo-400 hover:text-indigo-300 border border-indigo-900/35 rounded-xl bg-indigo-950/20 hover:bg-indigo-950/40 transition-all flex items-center justify-center gap-1.5"
    >
                                    <User className="w-3.5 h-3.5" />
                                    <span>Log in to use VIP Credit Pass (₹{detailAsset.price})</span>
                                  </button>
                                </div>}
                            </div>}
                        </div>}
                      
                      <p className={`text-[10px] text-center ${theme === "dark" ? "text-slate-500" : "text-slate-450"}`}>
                        Protected by secure Google Apps Script email & UTR match algorithm.
                      </p>
                    </div>

                  </div>
                </div>
              </motion.div>
            </div>;
  })()}
      </AnimatePresence>

      {
    /* --- PAYMENT CHECKOUT & AUTOMATED UPI UTR REGISTRATION GATEWAY --- */
  }
      <AnimatePresence>
        {checkoutAsset && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
    initial={{ opacity: 0, y: 25 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 25 }}
    className={`border rounded-2xl overflow-hidden max-w-4xl w-full shadow-2xl flex flex-col md:flex-row my-8 transition-colors ${theme === "dark" ? "bg-slate-900 border-slate-850" : "bg-white border-slate-200"}`}
  >
              {
    /* Left Column: Paytm UPI Official Merchant QR */
  }
              <div className={`w-full md:w-1/2 p-6 flex flex-col justify-between border-r transition-colors ${theme === "dark" ? "bg-slate-950 border-slate-900/60" : "bg-slate-50 border-slate-200"}`}>
                <div className="space-y-4">
                  <span className={`px-2.5 py-1 text-[9px] font-mono font-bold border rounded uppercase tracking-wider transition-colors ${theme === "dark" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-indigo-50 text-indigo-700 border-indigo-200"}`}>
                    SECURE PAYTM MERCHANT GATEWAY
                  </span>
                  
                  {(() => {
    const finalPrice = currentUser ? checkoutAsset.price : Math.round(checkoutAsset.price * 1.15);
    return <div>
                        <h3 className={`text-base font-black transition-colors ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{checkoutAsset.title}</h3>
                        <p className={`text-xs mt-0.5 transition-colors ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                          Asset access registration cost: <span className="text-emerald-500 font-bold">₹{finalPrice}</span>
                          {!currentUser && <span className="text-[10px] text-indigo-400 block sm:inline sm:ml-2">(Includes 15% Guest Surcharge)</span>}
                        </p>
                      </div>;
  })()}

                  {checkoutAsset.price > 0 ? <div className="space-y-3.5 py-2">
                      {(() => {
    const finalPrice = currentUser ? checkoutAsset.price : Math.round(checkoutAsset.price * 1.15);
    const upiLink = `upi://pay?pa=paytmqr28100505010113clkijdlzou@paytm&pn=Paytm%20Merchant&mc=5499&mode=02&orgid=000000&paytmqr=28100505010113CLKIJDLZOU&tn=Verified%20Paytm%20Account&am=${finalPrice}&cu=INR`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiLink)}`;
    return <div className="space-y-3.5">
                            <div className="mx-auto w-40 h-40 bg-white p-2 rounded-xl flex items-center justify-center shadow-lg">
                              <img src={qrUrl} alt="UPI QR" className="w-full h-full" />
                            </div>
                            
                            <div className={`text-center space-y-1 p-2.5 rounded-lg border transition-colors ${theme === "dark" ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-250 shadow-3xs"}`}>
                              <p className="text-[9px] font-mono text-slate-500 uppercase">OFFICIAL MERCHANT UPI ID</p>
                              <p className={`text-[11px] font-mono font-bold transition-colors ${theme === "dark" ? "text-white" : "text-slate-850"}`}>paytmqr28100505010113clkijdlzou@paytm</p>
                              <p className="text-[9px] text-slate-500">Merchant: Paytm Merchant / Golu Tyagi</p>
                            </div>

                            <a
      href={upiLink}
      className={`w-full border font-bold py-2 px-3 rounded-lg text-xs tracking-wide transition-all uppercase flex items-center justify-center gap-2 ${theme === "dark" ? "bg-slate-900 border-slate-800 hover:bg-slate-800 text-white" : "bg-indigo-50 border-indigo-200 hover:bg-indigo-100 text-indigo-750"}`}
    >
                              <ExternalLink className="w-4 h-4 text-indigo-500" /> Pay with Mobile UPI App
                            </a>
                          </div>;
  })()}
                    </div> : <div className="py-10 text-center space-y-2">
                      <div className="w-10 h-10 bg-emerald-950 text-emerald-400 border border-emerald-900 rounded-lg flex items-center justify-center mx-auto text-lg">✓</div>
                      <p className={`text-xs font-bold transition-colors ${theme === "dark" ? "text-white" : "text-slate-850"}`}>Free Checkout</p>
                      <p className="text-[11px] text-slate-500">Provide registration details to instantly claim your document link.</p>
                    </div>}
                </div>
              </div>

              {
    /* Right Column: Order claim form */
  }
              <div className="w-full md:w-1/2 p-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className={`flex items-center justify-between pb-2 border-b ${theme === "dark" ? "border-slate-900" : "border-slate-200"}`}>
                    <h3 className={`text-xs font-bold uppercase tracking-wider font-mono transition-colors ${theme === "dark" ? "text-slate-200" : "text-slate-700"}`}>Claim Asset (फाइल प्राप्त करें)</h3>
                    <button
    onClick={() => setCheckoutAsset(null)}
    className={`text-xs font-semibold transition-colors ${theme === "dark" ? "text-slate-550 hover:text-white" : "text-slate-400 hover:text-slate-900"}`}
  >
                      Cancel
                    </button>
                  </div>

                  {verificationState === "idle" || verificationState === "verifying" ? <form onSubmit={handleSubmitPurchase} className="space-y-3.5 text-xs">
                      
                      {!currentUser && <div className="space-y-3 p-3 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 space-y-3.5">
                          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider font-mono">Claim Details (प्राप्तकर्ता विवरण)</p>
                          
                          {
    /* Guest Name */
  }
                          <div className="space-y-1">
                            <label className={`font-bold flex items-center gap-1 text-[10px] uppercase font-mono transition-colors ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>
                              Full Name (आपका पूरा नाम) <span className="text-red-500">*</span>
                            </label>
                            <input
    type="text"
    placeholder="e.g. Rahul Sharma"
    value={custName}
    onChange={(e) => setCustName(e.target.value)}
    required
    className={`w-full border rounded-lg px-2.5 py-2 focus:outline-none text-xs transition-colors ${theme === "dark" ? "bg-slate-950 border-slate-850 text-slate-200 focus:border-indigo-500" : "bg-white border-slate-200 text-slate-850 focus:border-indigo-650"}`}
  />
                          </div>

                          {
    /* Guest Email */
  }
                          <div className="space-y-1">
                            <label className={`font-bold flex items-center gap-1 text-[10px] uppercase font-mono transition-colors ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>
                              Email Address (ईमेल पता) <span className="text-red-500">*</span>
                            </label>
                            <input
    type="email"
    placeholder="e.g. rahul@gmail.com"
    value={custEmail}
    onChange={(e) => setCustEmail(e.target.value.trim())}
    required
    className={`w-full border rounded-lg px-2.5 py-2 focus:outline-none text-xs transition-colors ${theme === "dark" ? "bg-slate-950 border-slate-850 text-slate-200 focus:border-indigo-500" : "bg-white border-slate-200 text-slate-850 focus:border-indigo-650"}`}
  />
                          </div>

                          {
    /* Guest WhatsApp */
  }
                          <div className="space-y-1">
                            <label className={`font-bold flex items-center gap-1 text-[10px] uppercase font-mono transition-colors ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>
                              WhatsApp Number (वैकल्पिक)
                            </label>
                            <input
    type="tel"
    placeholder="e.g. 9876543210 (Optional)"
    value={custWhatsapp}
    onChange={(e) => setCustWhatsapp(e.target.value.trim())}
    className={`w-full border rounded-lg px-2.5 py-2 focus:outline-none text-xs transition-colors ${theme === "dark" ? "bg-slate-950 border-slate-850 text-slate-200 focus:border-indigo-500" : "bg-white border-slate-200 text-slate-850 focus:border-indigo-650"}`}
  />
                          </div>
                        </div>}

                      {checkoutAsset.price > 0 ? <div className={`space-y-1 p-2.5 rounded-lg border transition-colors ${theme === "dark" ? "bg-indigo-950/10 border-indigo-950/60" : "bg-indigo-50/50 border-indigo-150"}`}>
                          <label className={`font-bold flex items-center gap-1 font-mono text-[10px] transition-colors ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>
                            <QrCode className="w-3.5 h-3.5 text-indigo-500" /> Paytm UPI Ref (UTR) / Transaction ID
                          </label>
                          <input
    type="text"
    placeholder="e.g. 318283948572 or T2607..."
    value={custUtr}
    onChange={(e) => setCustUtr(e.target.value.trim())}
    maxLength={40}
    required
    className={`mt-1 w-full border rounded-lg px-2.5 py-2 focus:outline-none font-mono text-xs uppercase transition-colors ${theme === "dark" ? "bg-slate-950 border-indigo-900 text-slate-200 focus:border-indigo-500" : "bg-white border-indigo-200 text-slate-800 focus:border-indigo-650"}`}
  />
                          <p className={`text-[9px] leading-normal mt-1 ${theme === "dark" ? "text-slate-500" : "text-slate-450"}`}>Paste the exact 12-digit Paytm Reference ID or UTR number from your payment app screen.</p>
                        </div> : <div className="py-2.5 text-center">
                          <p className={`text-[11px] ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>Click below to register your download request and retrieve the secure file instantly.</p>
                        </div>}

                      <button
    type="submit"
    disabled={verificationState === "verifying"}
    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 text-xs uppercase tracking-wider"
  >
                        {verificationState === "verifying" ? <>
                            <RefreshCw className="w-4 h-4 animate-spin" /> Verifying reference...
                          </> : <>
                            <ShieldCheck className="w-4 h-4" /> Claim File Download (फ़ाइल डाउनलोड करें)
                          </>}
                      </button>
                    </form> : verificationState === "verified" ? (
    /* INSTANTLY VERIFIED SUCCESS VIEW */
    <div className="space-y-4 text-center py-4 text-xs">
                      <div className="w-11 h-11 bg-emerald-950 text-emerald-400 border border-emerald-900 rounded-full flex items-center justify-center mx-auto text-xl animate-bounce">
                        ✓
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-emerald-500 text-sm">Payment Instantly Verified!</h4>
                        <p className={`${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>
                          Your transaction reference was matching and successfully validated. Your download access token is ready!
                        </p>
                      </div>

                      <div className={`p-2.5 rounded-xl font-mono text-[10px] border transition-colors ${theme === "dark" ? "bg-slate-950 border-slate-900" : "bg-slate-50 border-slate-200"}`}>
                        <p className="text-slate-500">SECURE DRM TOKEN</p>
                        <p className={`font-bold tracking-widest mt-0.5 ${theme === "dark" ? "text-slate-300" : "text-slate-800"}`}>{receivedToken}</p>
                      </div>

                      {(() => {
      const isSvg = checkoutAsset && (checkoutAsset.driveId.trim().startsWith("<svg") || checkoutAsset.driveId.includes("<svg") || checkoutAsset.type === "svg");
      if (isSvg && checkoutAsset) {
        const handleLocalCleanSVG = () => {
          const rawSvg = checkoutAsset.driveId;
          const blob = new Blob([rawSvg], { type: "image/svg+xml" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${checkoutAsset.title.toLowerCase().replace(/\s+/g, "_")}_clean.svg`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        };
        const handleLocalCleanXML = () => {
          const rawSvg = checkoutAsset.driveId;
          const blob = new Blob([rawSvg], { type: "text/xml" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${checkoutAsset.title.toLowerCase().replace(/\s+/g, "_")}_code.xml`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        };
        const handleLocalPNG = () => {
          const rawSvg = checkoutAsset.driveId;
          const blob = new Blob([rawSvg], { type: "image/svg+xml;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = 1024;
            canvas.height = 1024;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              try {
                const pngUrl = canvas.toDataURL("image/png");
                const a = document.createElement("a");
                a.href = pngUrl;
                a.download = `${checkoutAsset.title.toLowerCase().replace(/\s+/g, "_")}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              } catch (e) {
                console.error("PNG conversion failed", e);
              }
            }
            URL.revokeObjectURL(url);
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
          };
          img.src = url;
        };
        return <div className="space-y-2 pt-2 text-left">
                              <p className="text-[10px] font-mono text-indigo-500 font-bold uppercase tracking-wider text-center">🎯 Choose Your Download Format</p>
                              <div className="grid grid-cols-1 gap-2">
                                <button
          onClick={handleLocalCleanSVG}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2"
        >
                                  <Download className="w-3.5 h-3.5" /> Download SVG File (.svg)
                                </button>
                                <button
          onClick={handleLocalPNG}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2"
        >
                                  <FileImage className="w-3.5 h-3.5" /> Convert & Download PNG (.png)
                                </button>
                                <button
          onClick={handleLocalCleanXML}
          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2"
        >
                                  <FileText className="w-3.5 h-3.5" /> Download Raw XML (.xml)
                                </button>
                              </div>
                            </div>;
      }
      const isTextContent = checkoutAsset && (checkoutAsset.type === "pdf" || checkoutAsset.driveId.trim().length > 50 && !checkoutAsset.driveId.trim().startsWith("<svg"));
      if (isTextContent && checkoutAsset) {
        const handleDownloadWordDoc = () => {
          const rawText = checkoutAsset.driveId.trim();
          const hasSvgTag = rawText.startsWith("<svg") || rawText.includes("<svg");
          if (hasSvgTag) return;
          if (checkoutAsset.type !== "pdf" && rawText.length < 50) return;
          const fullContent = checkoutAsset.driveId && checkoutAsset.driveId.length > 40 && !extractDriveId(checkoutAsset.driveId) ? checkoutAsset.driveId : checkoutAsset.description || "Verified solutions prep guide.";
          generateAndDownloadDOC(checkoutAsset.title, fullContent);
        };
        const handleDownloadFullPDF = () => {
          const fullContent = checkoutAsset.driveId && checkoutAsset.driveId.length > 40 && !extractDriveId(checkoutAsset.driveId) ? checkoutAsset.driveId : checkoutAsset.description || "Verified solutions prep guide.";
          generateAndDownloadPDF(checkoutAsset.title, fullContent);
        };
        const cleanId = extractDriveId(checkoutAsset.driveId);
        return <div className="space-y-2">
                              {checkoutAsset.type === "pdf" ? <div className="grid grid-cols-1 gap-2">
                                  <button
          onClick={handleDownloadFullPDF}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
        >
                                    <Download className="w-4 h-4 animate-bounce" /> Download Unlocked PDF Document (.pdf)
                                  </button>
                                  <button
          onClick={handleDownloadWordDoc}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/40"
        >
                                    <FileText className="w-4 h-4" /> Download Word Document (.doc)
                                  </button>
                                </div> : checkoutAsset.driveId.trim().length > 50 && <button
          onClick={handleDownloadWordDoc}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
        >
                                    <Download className="w-4 h-4 animate-bounce" /> Download Word Document (.doc)
                                  </button>}
                              {cleanId && <a
          href={`https://docs.google.com/uc?export=download&id=${cleanId}&confirm=t`}
          target="_blank"
          rel="noreferrer"
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-extrabold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
        >
                                  <Download className="w-4 h-4" /> Download original attachment from Drive
                                </a>}
                            </div>;
      }
      if (isLiveSync && gasWebAppUrl) {
        return <a
          href={`${gasWebAppUrl}?action=download&token=${receivedToken}`}
          target="_blank"
          rel="noreferrer"
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 rounded-xl text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
        >
                              <Download className="w-4 h-4 animate-bounce" /> Download File Now (फाइल डाउनलोड करें)
                            </a>;
      } else {
        return <div className="space-y-2">
                              <div className={`p-2 border text-[10px] rounded-lg leading-normal transition-colors ${theme === "dark" ? "bg-amber-950/20 border-amber-900 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
                                Sandbox Mock: Dynamic Apps Script redirection active in live mode to keep Google Drive links hidden.
                              </div>
                              {checkoutAsset && extractDriveId(checkoutAsset.driveId) && <a
          href={`https://docs.google.com/uc?export=download&id=${extractDriveId(checkoutAsset.driveId)}&confirm=t`}
          target="_blank"
          rel="noreferrer"
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
        >
                                  <Download className="w-4 h-4" /> Download Sandbox File
                                </a>}
                            </div>;
      }
    })()}
                    </div>
  ) : verificationState === "pending" ? (
    /* PENDING MANUALLY VERIFICATION STATE */
    <div className="space-y-4 py-4 text-xs">
                      <div className="w-11 h-11 bg-yellow-950 text-yellow-400 border border-yellow-900 rounded-full flex items-center justify-center mx-auto text-xl animate-pulse">
                        🕒
                      </div>
                      <div className="text-center space-y-1">
                        <h4 className="font-bold text-yellow-400">UTR Registered (Pending Scanner)</h4>
                        <p className={`leading-normal ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}>
                          Your transaction was submitted. Golu Tyagi's automated Paytm inbox scanner synchronizes email receipts momentarily. Once scanned, your order will auto-approve! Save this Request ID to track:
                        </p>
                      </div>

                      <div className={`border rounded-xl p-3 text-center transition-colors ${theme === "dark" ? "bg-slate-950 border-slate-900" : "bg-slate-50 border-slate-200"}`}>
                        <p className="text-[9px] font-mono text-slate-500">YOUR RETRIEVAL ORDER ID</p>
                        <p className={`font-mono font-bold text-sm mt-0.5 transition-colors ${theme === "dark" ? "text-white" : "text-slate-850"}`}>{createdRequestId}</p>
                      </div>

                      {verificationError && <p className="text-[10px] text-rose-400 bg-rose-950/20 border border-rose-900/30 p-2 rounded">
                          {verificationError}
                        </p>}

                      <div className="space-y-1.5 pt-1">
                        <button
      onClick={() => {
        setLookupUtr(createdRequestId);
        setCheckoutAsset(null);
        setShowLookupPanel(true);
      }}
      className={`w-full border py-2 rounded-lg font-bold transition-all ${theme === "dark" ? "bg-slate-950 border-slate-800 text-slate-300 hover:text-white" : "bg-white border-slate-250 text-slate-750 hover:bg-slate-50 hover:text-slate-950"}`}
    >
                          Check Status inside Lookup Portal
                        </button>
                        <button
      onClick={() => setCheckoutAsset(null)}
      className="w-full text-slate-500 hover:text-slate-400 text-center text-[11px]"
    >
                          Back to Storefront
                        </button>
                      </div>
                    </div>
  ) : (
    /* FAILING ERROR STATE */
    <div className="space-y-4 py-4 text-xs">
                      <div className="w-11 h-11 bg-rose-950 text-rose-400 border border-rose-900 rounded-full flex items-center justify-center mx-auto text-lg">
                        ✕
                      </div>
                      <div className="text-center space-y-1">
                        <h4 className="font-bold text-rose-400">Verification Refused</h4>
                        <p className={`leading-normal ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>
                          {verificationError || "Double claim or invalid transaction reference reported by sheets database."}
                        </p>
                      </div>

                      <div className={`p-3 rounded-lg leading-normal text-[11px] border transition-colors ${theme === "dark" ? "bg-slate-950 border-slate-900 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-650"}`}>
                        Support support contact email: <span className="text-indigo-500 font-bold">golutyagi9710@gmail.com</span>. Please share screenshot of Paytm Business receipt with Golu.
                      </div>

                      <div className="flex gap-2">
                        <button
      onClick={() => setVerificationState("idle")}
      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl"
    >
                          Try Again
                        </button>
                        <button
      onClick={() => setCheckoutAsset(null)}
      className={`flex-1 py-2 rounded-xl border transition-all ${theme === "dark" ? "bg-slate-950 border-slate-850 text-slate-400 hover:text-white" : "bg-white border-slate-250 text-slate-600 hover:bg-slate-50 hover:text-slate-800"}`}
    >
                          Close
                        </button>
                      </div>
                    </div>
  )}
                </div>

                <div className={`text-[10px] text-center border-t pt-3 font-mono transition-colors ${theme === "dark" ? "border-slate-900 text-slate-550" : "border-slate-200 text-slate-450"}`}>
                  DRM Gateway protection • TyagiHub Secure DRM
                </div>
              </div>

            </motion.div>
          </div>}
      </AnimatePresence>

      {
    /* --- MODAL: ADMIN PASSWORD ACCESS DIALOG --- */
  }
      <AnimatePresence>
        {showAdminLoginModal && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className={`border rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-5 transition-colors ${theme === "dark" ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"}`}
  >
              <div className="text-center space-y-2">
                <div className="mx-auto w-10 h-10 bg-indigo-500/10 text-indigo-500 flex items-center justify-center rounded-xl">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className={`text-base font-bold transition-colors ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Admin Authorized Login</h3>
                <p className={`text-[11px] transition-colors ${theme === "dark" ? "text-slate-400" : "text-slate-550"}`}>Authorized creators only. Access key is <strong className="text-indigo-500">golu123</strong></p>
              </div>
 
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <input
    type="password"
    placeholder="Enter access key passcode..."
    value={adminPasswordInput}
    onChange={(e) => setAdminPasswordInput(e.target.value)}
    required
    className={`w-full border rounded-xl px-4 py-2 text-center font-mono text-sm focus:outline-none transition-colors ${theme === "dark" ? "bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500" : "bg-slate-50 border-slate-250 text-slate-800 focus:border-indigo-600"}`}
  />
 
                {adminLoginError && <p className="text-[11px] text-rose-500 text-center">{adminLoginError}</p>}
 
                <div className="flex gap-2 text-xs">
                  <button
    type="button"
    onClick={() => {
      setShowAdminLoginModal(false);
      setAdminLoginError("");
    }}
    className={`flex-1 py-2 rounded-xl font-semibold transition-all border ${theme === "dark" ? "bg-slate-950 border-slate-800 text-slate-400 hover:text-white" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800"}`}
  >
                    Cancel
                  </button>
                  <button
    type="submit"
    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-xl font-bold transition-all"
  >
                    Authenticate
                  </button>
                </div>
              </form>
            </motion.div>
          </div>}
      </AnimatePresence>
 
      {
    /* --- MODAL: FIREBASE SIGN IN / REGISTER --- */
  }
      <AnimatePresence>
        {showAuthModal && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
            <motion.div
    initial={{ opacity: 0, y: 15, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 15, scale: 0.98 }}
    className={`border rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 relative transition-colors ${theme === "dark" ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"}`}
  >
              <button
    onClick={() => {
      setShowAuthModal(false);
      setAuthError("");
    }}
    className={`absolute top-4 right-4 p-1.5 rounded-full border transition-all ${theme === "dark" ? "bg-slate-950 hover:bg-slate-800 text-slate-400 border-slate-850" : "bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200"}`}
  >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-1.5">
                <div className="mx-auto w-11 h-11 bg-indigo-600/10 text-indigo-500 flex items-center justify-center rounded-2xl">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className={`text-lg font-black transition-colors ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                  {authMode === "login" ? "Welcome Back to TyagiHub" : "Create Your VIP Member Account"}
                </h3>
                <p className={`text-xs transition-colors ${theme === "dark" ? "text-slate-450" : "text-slate-500"}`}>
                  {authMode === "login" ? "Sign in to access VIP pricing and unlock direct SVG code downloads" : "Register now to bypass the 15% guest surcharge immediately"}
                </p>
              </div>

              {
    /* Federated Social Login */
  }
              <button
    type="button"
    onClick={handleGoogleSignIn}
    className={`w-full flex items-center justify-center gap-2.5 font-bold py-2.5 px-4 rounded-xl text-xs transition-all border ${theme === "dark" ? "bg-slate-950 hover:bg-slate-905 border-slate-800 text-slate-300 hover:text-white" : "bg-white hover:bg-slate-50 border-slate-250 text-slate-700 shadow-3xs"}`}
  >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.58 14.94 1 12 1 7.35 1 3.39 3.65 1.5 7.5l3.86 3C6.27 7.57 8.91 5.04 12 5.04z" />
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.48-1.12 2.74-2.38 3.58l3.7 2.87c2.16-1.99 3.41-4.92 3.41-8.6z" />
                  <path fill="#FBBC05" d="M5.36 14.5c-.24-.72-.38-1.49-.38-2.3s.14-1.58.38-2.3L1.5 6.9C.54 8.84 0 11.01 0 12.3s.54 3.46 1.5 5.4l3.86-3.2z" />
                  <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.7-2.87c-1.03.69-2.35 1.1-4.26 1.1-3.09 0-5.73-2.53-6.66-5.46l-3.86 3C3.39 20.35 7.35 23 12 23z" />
                </svg>
                Continue with Google Secure Auth
              </button>

              <div className="flex items-center my-4">
                <div className={`flex-1 border-t ${theme === "dark" ? "border-slate-800" : "border-slate-200"}`} />
                <span className={`px-3 text-[10px] font-mono tracking-widest uppercase shrink-0 ${theme === "dark" ? "text-slate-600" : "text-slate-400"}`}>OR EMAIL ACCESS</span>
                <div className={`flex-1 border-t ${theme === "dark" ? "border-slate-800" : "border-slate-200"}`} />
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === "register" && <div className="space-y-1">
                    <label className={`text-[10px] font-mono font-bold uppercase transition-colors ${theme === "dark" ? "text-slate-400" : "text-slate-650"}`}>Full Name</label>
                    <input
    type="text"
    placeholder="e.g. Golu Tyagi"
    value={authName}
    onChange={(e) => setAuthName(e.target.value)}
    required
    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors ${theme === "dark" ? "bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500" : "bg-white border-slate-250 text-slate-850 focus:border-indigo-650"}`}
  />
                  </div>}

                <div className="space-y-1">
                  <label className={`text-[10px] font-mono font-bold uppercase transition-colors ${theme === "dark" ? "text-slate-400" : "text-slate-650"}`}>Email Address</label>
                  <input
    type="email"
    placeholder="name@example.com"
    value={authEmail}
    onChange={(e) => setAuthEmail(e.target.value)}
    required
    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors ${theme === "dark" ? "bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500" : "bg-white border-slate-250 text-slate-850 focus:border-indigo-650"}`}
  />
                </div>

                <div className="space-y-1">
                  <label className={`text-[10px] font-mono font-bold uppercase transition-colors ${theme === "dark" ? "text-slate-400" : "text-slate-650"}`}>Secret Password</label>
                  <input
    type="password"
    placeholder="••••••••"
    value={authPassword}
    onChange={(e) => setAuthPassword(e.target.value)}
    required
    minLength={6}
    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors ${theme === "dark" ? "bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500" : "bg-white border-slate-250 text-slate-850 focus:border-indigo-650"}`}
  />
                </div>

                {authError && <p className="text-[11px] text-rose-500 text-center font-bold bg-rose-500/10 p-2 rounded-lg">{authError}</p>}

                <button
    type="submit"
    disabled={authLoading}
    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 text-xs uppercase tracking-wider"
  >
                  {authLoading ? <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Creating secure credentials...
                    </> : <>
                      <ShieldCheck className="w-4 h-4" />
                      {authMode === "login" ? "Sign In Securely" : "Register VIP Account"}
                    </>}
                </button>
              </form>

              <div className="text-center pt-2">
                <button
    type="button"
    onClick={() => {
      setAuthMode(authMode === "login" ? "register" : "login");
      setAuthError("");
    }}
    className="text-xs text-indigo-500 hover:underline font-bold"
  >
                  {authMode === "login" ? "New here? Create a VIP profile" : "Already have a VIP account? Sign in"}
                </button>
              </div>
            </motion.div>
          </div>}
      </AnimatePresence>

      {
    /* --- MODAL: PREMIUM MULTI-TIER SUBSCRIPTIONS PORTAL --- */
  }
      <AnimatePresence>
        {showSubModal && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
            <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 20 }}
    className={`border rounded-2xl overflow-hidden max-w-5xl w-full shadow-2xl relative my-8 flex flex-col transition-colors ${theme === "dark" ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"}`}
  >
              {
    /* Close Button */
  }
              <button
    onClick={() => {
      setShowSubModal(false);
      setCheckoutPlan(null);
      setSubVerificationState("idle");
      setSubVerificationError("");
    }}
    className={`absolute top-4 right-4 z-40 p-1.5 rounded-full border transition-all ${theme === "dark" ? "bg-slate-950 hover:bg-slate-800 text-slate-400 border-slate-850" : "bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-250 shadow-3xs"}`}
  >
                <X className="w-4 h-4" />
              </button>

              {!checkoutPlan ? (
    /* STAGE 1: BENTO SELECTION LIST OF MULTI-TIERS */
    <div className="p-6 sm:p-10 space-y-8">
                  <div className="text-center space-y-2 max-w-xl mx-auto">
                    <span className="bg-gradient-to-r from-amber-500 to-indigo-600 text-white font-extrabold text-[9px] font-mono px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                      👑 TyagiHub Crown Club
                    </span>
                    <h2 className={`text-xl sm:text-2xl font-black transition-colors tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                      Unlimited Download Pass Membership
                    </h2>
                    <p className={`text-xs transition-colors leading-relaxed ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                      Are you a heavy designer or developer? Bypass separate checkout micro-transactions completely. Join the TyagiHub Elite Pass program to download all items directly!
                    </p>
                  </div>

                  {
      /* Bento Grid layout */
    }
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
                    {[
      {
        name: "Micro Pass",
        price: 49,
        durationDays: 30,
        credits: 60,
        desc: "Perfect for quick individual templates and high-quality vector downloads.",
        features: ["60 Wallet Credits issued", "Valid for 30 Days (1 Month)", "Direct SVG and PNG extracts", "1 Credit = \u20B91 Fixed value mapping"],
        accent: "border-slate-850",
        badge: "Starter Pass \u26A1"
      },
      {
        name: "Mini Pass",
        price: 99,
        durationDays: 30,
        credits: 125,
        desc: "Awesome boost with extra bonus credits for active graphic designers.",
        features: ["125 Wallet Credits issued", "Valid for 30 Days (1 Month)", "Direct high-speed downloads", "Includes 25% bonus credits"],
        accent: "border-slate-850",
        badge: "Super Saver \u{1F4B8}"
      },
      {
        name: "Super Vault",
        price: 299,
        durationDays: 30,
        credits: 400,
        desc: "Bulk developer vault. Keep assets synced with full layout source codes.",
        features: ["400 Wallet Credits issued", "Valid for 30 Days (1 Month)", "Bypass manual download approvals", "Includes 33% bonus credits"],
        accent: "border-indigo-500 shadow-indigo-950/20 shadow-xl relative scale-[1.02]",
        badge: "Best Value \u2B50",
        popular: true
      },
      {
        name: "Elite Pro Creator",
        price: 599,
        durationDays: 90,
        credits: 850,
        desc: "Heavy-duty agency membership. Unlocks long-term premium assets.",
        features: ["850 Wallet Credits issued", "Valid for 90 Days (3 Months)", "Direct Google Drive backup access", "Custom shape coding requests", "VVIP telegram chat with Golu"],
        accent: "border-amber-500/85 shadow-amber-950/20 shadow-xl",
        badge: "VVIP Creator \u{1F451}"
      }
    ].map((plan) => <div
      key={plan.name}
      className={`border rounded-2xl p-6 flex flex-col justify-between space-y-6 transition-all ${plan.accent} ${theme === "dark" ? "bg-slate-950/40 hover:bg-slate-950/80" : "bg-slate-50/50 hover:bg-white shadow-3xs hover:shadow-md"}`}
    >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded border ${plan.popular ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}>
                              {plan.badge}
                            </span>
                          </div>

                          <div>
                            <h3 className={`text-sm font-black transition-colors ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{plan.name}</h3>
                            <p className="text-[11px] text-slate-500 mt-1 leading-normal">{plan.desc}</p>
                          </div>

                          <div className="flex items-baseline gap-1.5 py-1">
                            <span className={`text-2xl font-black ${theme === "dark" ? "text-indigo-400" : "text-indigo-600"}`}>₹{plan.price}</span>
                            <span className="text-[10px] text-slate-500">/ one-time</span>
                          </div>

                          <div className={`border-t pt-4 space-y-2 text-[10px] leading-normal ${theme === "dark" ? "border-slate-900" : "border-slate-150"}`}>
                            {plan.features.map((feat) => <div key={feat} className="flex items-start gap-1.5">
                                <span className="text-emerald-500 font-extrabold shrink-0">✓</span>
                                <span className={theme === "dark" ? "text-slate-400" : "text-slate-650"}>{feat}</span>
                              </div>)}
                          </div>
                        </div>

                        <button
      onClick={() => {
        if (!currentUser) {
          setShowSubModal(false);
          setAuthMode("register");
          setShowAuthModal(true);
          alert("Please register or sign in to your VIP account first to log your subscription pass!");
          return;
        }
        setCheckoutPlan(plan);
      }}
      className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md ${plan.popular ? "bg-indigo-600 hover:bg-indigo-500 text-white" : theme === "dark" ? "bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800" : "bg-slate-200 hover:bg-slate-300 text-slate-800"}`}
    >
                          Choose {plan.name}
                        </button>
                      </div>)}
                  </div>

                  <p className={`text-[10px] text-center max-w-md mx-auto leading-normal ${theme === "dark" ? "text-slate-600" : "text-slate-500"}`}>
                    *Subscription payments are processed manually. Once submitted with Paytm UTR, our inbox automation approves your account access immediately.
                  </p>
                </div>
  ) : (
    /* STAGE 2: SUBSCRIPTION CHECKOUT SCREEN */
    <div className="flex flex-col md:flex-row">
                  
                  {
      /* Left QR Code Column */
    }
                  <div className={`w-full md:w-1/2 p-6 sm:p-10 flex flex-col justify-between border-r transition-colors ${theme === "dark" ? "bg-slate-950 border-slate-900/60" : "bg-slate-50 border-slate-250 shadow-3xs"}`}>
                    <div className="space-y-5">
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-1 text-[9px] font-mono font-bold border rounded uppercase tracking-wider transition-colors ${theme === "dark" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-indigo-50 text-indigo-700 border-indigo-200"}`}>
                          👑 VIP CROWN CHECKOUT
                        </span>
                        <button
      onClick={() => {
        setCheckoutPlan(null);
        setSubVerificationState("idle");
      }}
      className="text-[10px] font-bold text-indigo-500 hover:underline"
    >
                          ← Change Plan
                        </button>
                      </div>

                      <div>
                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest leading-none">ORDER MEMBERSHIP</p>
                        <h3 className={`text-base font-black transition-colors mt-1 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                          {checkoutPlan.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 leading-normal">{checkoutPlan.desc}</p>
                      </div>

                      {
      /* QR Setup */
    }
                      {(() => {
      const amount = checkoutPlan.price;
      const upiLink = `upi://pay?pa=paytmqr28100505010113clkijdlzou@paytm&pn=Paytm%20Merchant&mc=5499&mode=02&orgid=000000&paytmqr=28100505010113CLKIJDLZOU&tn=VIP%20Crown%20Subscription&am=${amount}&cu=INR`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiLink)}`;
      return <div className="space-y-4">
                            <div className="mx-auto w-36 h-36 bg-white p-2.5 rounded-xl flex items-center justify-center shadow-lg">
                              <img src={qrUrl} alt="UPI QR" className="w-full h-full" />
                            </div>

                            <div className={`text-center space-y-1 p-2.5 rounded-lg border text-xs transition-colors ${theme === "dark" ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"}`}>
                              <p className="text-[8px] font-mono text-slate-500">PAYTM MERCHANT ADDRESS</p>
                              <p className={`text-[10px] font-mono font-bold transition-colors ${theme === "dark" ? "text-white" : "text-slate-850"}`}>paytmqr28100505010113clkijdlzou@paytm</p>
                              <p className="text-[9px] text-slate-500">Merchant: Paytm Merchant / Golu Tyagi</p>
                            </div>

                            <a
        href={upiLink}
        className={`w-full border font-bold py-2 px-3 rounded-lg text-xs tracking-wide transition-all uppercase flex items-center justify-center gap-2 ${theme === "dark" ? "bg-slate-900 border-slate-800 hover:bg-slate-800 text-white" : "bg-indigo-50 border-indigo-200 hover:bg-indigo-100 text-indigo-750"}`}
      >
                              <ExternalLink className="w-4 h-4 text-indigo-500" /> Pay with Mobile UPI App (₹{amount})
                            </a>
                          </div>;
    })()}
                    </div>
                  </div>

                  {
      /* Right Form Column */
    }
                  <div className="w-full md:w-1/2 p-6 sm:p-10 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className={`flex items-center justify-between pb-2 border-b ${theme === "dark" ? "border-slate-900" : "border-slate-200"}`}>
                        <h3 className={`text-xs font-bold uppercase tracking-wider font-mono transition-colors ${theme === "dark" ? "text-slate-200" : "text-slate-700"}`}>Claim Membership</h3>
                        <p className="text-[10px] text-slate-450">{currentUser?.displayName}</p>
                      </div>

                      {subVerificationState === "idle" || subVerificationState === "verifying" ? <form onSubmit={handlePurchaseSubscription} className="space-y-4 text-xs">
                          <div className={`space-y-1 p-3 rounded-lg border transition-colors ${theme === "dark" ? "bg-indigo-950/10 border-indigo-950/60" : "bg-indigo-50/50 border-indigo-150"}`}>
                            <label className={`font-bold flex items-center gap-1 font-mono text-[10px] transition-colors ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>
                              <QrCode className="w-3.5 h-3.5 text-indigo-500" /> Paytm UPI Ref (UTR) / Transaction ID
                            </label>
                            <input
      type="text"
      placeholder="e.g. 318283948572..."
      value={subUtr}
      onChange={(e) => setSubUtr(e.target.value.trim())}
      maxLength={40}
      required
      className={`mt-1.5 w-full border rounded-lg px-2.5 py-2.5 focus:outline-none font-mono text-xs uppercase transition-colors ${theme === "dark" ? "bg-slate-950 border-indigo-900 text-slate-200 focus:border-indigo-500" : "bg-white border-indigo-200 text-slate-800 focus:border-indigo-650"}`}
    />
                            <p className="text-[9px] text-slate-500 mt-1">Paste the exact 12-digit transaction ID or reference number shown on your Paytm/UPI receipt screen.</p>
                          </div>

                          <button
      type="submit"
      disabled={subVerificationState === "verifying"}
      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 text-xs uppercase tracking-wider shadow-lg"
    >
                            {subVerificationState === "verifying" ? <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Validating Paytm payment reference...
                              </> : <>
                                <Crown className="w-4 h-4 text-amber-300" />
                                Activate Membership Now (₹{checkoutPlan.price})
                              </>}
                          </button>
                        </form> : subVerificationState === "verified" ? (
      /* VERIFIED VIP */
      <div className="space-y-4 text-center py-6 text-xs">
                          <div className="w-12 h-12 bg-emerald-950 text-emerald-400 border border-emerald-900 rounded-full flex items-center justify-center mx-auto text-xl animate-bounce">
                            👑
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-extrabold text-emerald-400 text-sm">Pass Activated Successfully!</h4>
                            <p className={theme === "dark" ? "text-slate-300" : "text-slate-700"}>
                              Congratulations! Your payment receipt has been auto-verified. You now have unlimited access to download every single file in the catalog!
                            </p>
                          </div>

                          <div className={`p-2.5 rounded-xl font-mono text-[10px] border transition-colors ${theme === "dark" ? "bg-slate-950 border-slate-900" : "bg-slate-50 border-slate-200"}`}>
                            <p className="text-slate-500">CROWN CLUB ACCESS TOKEN</p>
                            <p className={`font-bold tracking-widest mt-0.5 ${theme === "dark" ? "text-white" : "text-slate-800"}`}>{receivedSubToken}</p>
                          </div>

                          <button
        onClick={() => {
          setShowSubModal(false);
          setCheckoutPlan(null);
          setSubVerificationState("idle");
        }}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl"
      >
                            Return & Browse Unlocked Storefront
                          </button>
                        </div>
    ) : subVerificationState === "pending" ? (
      /* PENDING QUEUE */
      <div className="space-y-4 text-center py-6 text-xs">
                          <div className="w-12 h-12 bg-yellow-950 text-yellow-400 border border-yellow-900 rounded-full flex items-center justify-center mx-auto text-xl animate-pulse">
                            🕒
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-bold text-yellow-400">Request Logged (Awaiting Sync)</h4>
                            <p className={`leading-normal ${theme === "dark" ? "text-slate-300" : "text-slate-650"}`}>
                              Your subscription reference was registered. Once Golu's automated inbox reads the payment receipt email, your crown status will instantly activate!
                            </p>
                          </div>

                          <div className={`border rounded-xl p-3 text-center transition-colors ${theme === "dark" ? "bg-slate-950 border-slate-900" : "bg-slate-50 border-slate-200"}`}>
                            <p className="text-[9px] font-mono text-slate-500">MEMBER ACCESS PASS ID</p>
                            <p className={`font-mono font-bold text-sm mt-0.5 transition-colors ${theme === "dark" ? "text-white" : "text-slate-850"}`}>{createdSubId}</p>
                          </div>

                          <button
        onClick={() => {
          setShowSubModal(false);
          setCheckoutPlan(null);
          setSubVerificationState("idle");
        }}
        className={`w-full py-2 rounded-xl border transition-all font-bold ${theme === "dark" ? "bg-slate-950 border-slate-800 text-slate-300 hover:text-white" : "bg-white border-slate-250 text-slate-700 hover:bg-slate-50"}`}
      >
                            Return to Storefront
                          </button>
                        </div>
    ) : (
      /* FAILED WRONG UTR */
      <div className="space-y-4 text-center py-4 text-xs">
                          <div className="w-11 h-11 bg-rose-950 text-rose-400 border border-rose-900 rounded-full flex items-center justify-center mx-auto text-lg">
                            ✕
                          </div>
                          <h4 className="font-bold text-rose-400">Pass Verification Refused</h4>
                          <p className="text-slate-400 leading-normal">{subVerificationError}</p>

                          <div className="flex gap-2">
                            <button
        onClick={() => setSubVerificationState("idle")}
        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl"
      >
                              Try Again
                            </button>
                            <button
        onClick={() => {
          setShowSubModal(false);
          setCheckoutPlan(null);
          setSubVerificationState("idle");
        }}
        className={`flex-1 py-2 rounded-xl border transition-all ${theme === "dark" ? "bg-slate-950 border-slate-850 text-slate-450 hover:text-white" : "bg-white border-slate-250 text-slate-600"}`}
      >
                              Close
                            </button>
                          </div>
                        </div>
    )}

                    </div>
                  </div>

                </div>
  )}

            </motion.div>
          </div>}
      </AnimatePresence>
 
    </div>;
}
