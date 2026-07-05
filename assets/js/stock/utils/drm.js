export const deobfuscateSVG = (scrambled) => {
  if (!scrambled || typeof scrambled !== "string") return "";
  if (!scrambled.startsWith("DRM_SECURE_V1_")) return scrambled;
  try {
    const core = scrambled.substring(14);
    let reversed = "";
    for (let i = 0; i < core.length; i++) {
      reversed += String.fromCharCode(core.charCodeAt(i) - 5);
    }
    const b64 = reversed.split("").reverse().join("");
    return decodeURIComponent(
      atob(b64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
  } catch (e) {
    try {
      const core = scrambled.substring(14);
      let reversed = "";
      for (let i = 0; i < core.length; i++) {
        reversed += String.fromCharCode(core.charCodeAt(i) - 5);
      }
      return atob(reversed.split("").reverse().join(""));
    } catch (err) {
      console.error("DRM Decryption Failure:", e);
      return scrambled;
    }
  }
};

export const stripHtml = (html) => {
  if (!html) return "";
  try {
    let text = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, "\n")
      .replace(/\n\s*\n/g, "\n")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
    return text.trim();
  } catch (e) {
    return html;
  }
};

export const addSvgWatermark = (svgContent, isFree) => {
  if (isFree) return svgContent;
  const watermarkXml = `
    <g id="tyagihub-svg-drm-watermark" style="pointer-events: none; user-select: none;">
      <!-- Elegant diagonal dotted lines crossing the canvas -->
      <line x1="0" y1="0" x2="100%" y2="100%" stroke="#ef4444" stroke-opacity="0.18" stroke-width="3" stroke-dasharray="10,10" />
      <line x1="100%" y1="0" x2="0" y2="100%" stroke="#ef4444" stroke-opacity="0.18" stroke-width="3" stroke-dasharray="10,10" />
      
      <!-- Premium high-visibility DRM text watermarks -->
      <text x="50%" y="38%" fill="#ef4444" fill-opacity="0.55" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="24" font-weight="900" text-anchor="middle" transform="rotate(-18, 150, 150)">TyagiHub Secure DRM</text>
      <text x="50%" y="62%" fill="#ef4444" fill-opacity="0.45" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="16" font-weight="800" text-anchor="middle" transform="rotate(-18, 150, 150)">DO NOT ALTER OR REUSE</text>
      
      <!-- Solid warning footer banner for unauthorized views -->
      <rect x="0" y="85%" width="100%" height="15%" fill="#0f172a" fill-opacity="0.95" rx="4" />
      <text x="50%" y="94%" fill="#fca5a5" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="bold" text-anchor="middle">🔒 TYAGIHUB SECURED SVG PREVIEW</text>
    </g>
  `;
  const lastIndex = svgContent.lastIndexOf("</svg>");
  return lastIndex !== -1 ? svgContent.substring(0, lastIndex) + watermarkXml + svgContent.substring(lastIndex) : svgContent;
};

export const isSvgContent = (content) => {
  if (!content) return false;
  const trimmed = content.trim();
  return (
    trimmed.startsWith("<svg") ||
    trimmed.includes("<svg") ||
    trimmed.includes('xmlns="http://www.w3.org/2000/svg"')
  );
};

export const slugify = (title) => {
  if (!title) return "";
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

export const extractDriveId = (url) => {
  if (!url) return "";
  const regex = /(?:https?:\/\/)?(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|docs\.google\.com\/(?:file\/d\/))([a-zA-Z0-9_-]{25,100})/;
  const match = String(url).match(regex);
  return match && match[1] ? match[1] : "";
};

export const resolveThumbnailUrl = (product) => {
  const previewUrl = (product.previewUrl || "").trim();
  const driveId = (product.driveId || "").trim();
  
  // Check if we have actual raw SVG content or obfuscated SVG
  const hasRawSvg = 
    driveId.startsWith("<svg") || 
    driveId.startsWith("DRM_SECURE_V1_") ||
    previewUrl.startsWith("<svg") ||
    previewUrl.startsWith("DRM_SECURE_V1_");

  if (hasRawSvg) {
    return driveId || previewUrl;
  }

  // If we only have a GitHub path/ID or a standard URL, use the previewUrl for the thumbnail
  if (previewUrl && (previewUrl.startsWith("http") || previewUrl.startsWith("/"))) {
    return previewUrl;
  }

  // Custom gorgeous fallbacks based on product type since Google Drive is completely removed
  if (product.type === "pdf") {
    return "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=400&q=80"; // Beautiful Document CV/Template
  }
  if (product.type === "document" || product.type === "doc" || product.type === "docx") {
    return "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80"; // Clean Bill/Invoice template
  }
  
  return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80";
};

