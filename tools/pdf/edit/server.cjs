var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_muhammara = __toESM(require("muhammara"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_genai = require("@google/genai");
var import_config = require("dotenv/config");
async function callGeminiWithRetry(fn, retries = 3, delay = 1e3) {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      const errMsg = String(err.message || err || "").toUpperCase();
      const errStatus = Number(err.status || err.statusCode || err.code || 0);
      const isTransient = errStatus === 503 || errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("TEMPORARY") || errMsg.includes("HIGH DEMAND") || errMsg.includes("SPIKES IN DEMAND");
      if (isTransient && attempt <= retries) {
        console.warn(`[GEMINI RETRY] Transient error encountered on attempt ${attempt}/${retries}. Retrying in ${delay}ms... Reason: ${err.message || err}`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      throw err;
    }
  }
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "100mb" }));
  app.post("/api/gemini/ask", async (req, res) => {
    try {
      const { prompt, context } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Missing prompt" });
      }
      const clientKey = req.headers["x-gemini-key"];
      const apiKey = clientKey && clientKey.trim().length > 0 ? clientKey : process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "Gemini API Key is not configured. Please enter your key in the Gemini AI tab." });
      }
      const ai = new import_genai.GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const finalPrompt = context ? `You are an advanced, helpful AI assistant integrated inside TyagiHub PDF Editor. Keep your answer brief, concise, and professional. Context: ${context}

Question: ${prompt}` : `You are an advanced, helpful AI assistant integrated inside TyagiHub PDF Editor. Keep your answer brief, concise, and professional.

Question: ${prompt}`;
      const response = await callGeminiWithRetry(
        () => ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: finalPrompt
        })
      );
      res.json({ text: response.text });
    } catch (err) {
      console.error("Gemini API Error:", err);
      let clientError = err.message || "Failed to query Gemini AI";
      let isQuotaError = false;
      let isCongestionError = false;
      const errMsg = String(err.message || err || "").toUpperCase();
      const errStatus = Number(err.status || err.statusCode || err.code || 0);
      if (errStatus === 429 || errMsg.includes("429") || errMsg.includes("QUOTA") || errMsg.includes("EXHAUSTED") || errMsg.includes("RATE_LIMIT")) {
        isQuotaError = true;
        clientError = "Gemini API Quota Limit Exceeded: Your personal API key's free usage quota has been fully exhausted or rate-limited in Google AI Studio. Please verify your monthly limitations, generate/input a new active API key, or switch to our ultra-reliable Free Local Offline engine to continue instantly.";
      } else if (errStatus === 503 || errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("HIGH DEMAND") || errMsg.includes("TEMPORARY") || errMsg.includes("SPIKES IN DEMAND")) {
        isCongestionError = true;
        clientError = "Gemini AI Service Under High Demand (Temporary 503): Google's Gemini models are currently experiencing temporary traffic spikes or resource-exhaustion. Try again in a few seconds, configure another personal API key, or switch to our ultra-reliable Free Local Offline engine to continue instantly.";
      } else if (errMsg.includes("KEY_INVALID") || errMsg.includes("API KEY NOT VALID") || errMsg.includes("INVALID_ARGUMENT") || errMsg.includes("BAD_KEY") || errStatus === 400 && errMsg.includes("KEY")) {
        clientError = "Invalid API Key: The personal Gemini API Key you configured is invalid. Please double check that you copied it correctly from Google AI Studio, ensure there are no leading/trailing spaces, or switch to our ultra-reliable Free Local Offline engine.";
      }
      const resStatus = errStatus >= 400 && errStatus < 600 ? errStatus : 500;
      res.status(resStatus).json({
        error: clientError,
        isQuotaError,
        isCongestionError,
        rawError: err.message || String(err)
      });
    }
  });
  app.post("/api/gemini/convert-page", async (req, res) => {
    try {
      const { pageImageBase64, format, customInstructions, pageIndex } = req.body;
      if (!pageImageBase64) {
        return res.status(400).json({ error: "Missing page outline/image data" });
      }
      const clientKey = req.headers["x-gemini-key"];
      const apiKey = clientKey && clientKey.trim().length > 0 ? clientKey : process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "Gemini API Key is not configured. Please enter your key in the Gemini AI tab." });
      }
      const ai = new import_genai.GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      let cleanBase64 = pageImageBase64;
      if (cleanBase64.startsWith("data:")) {
        const parts = cleanBase64.split(";base64,");
        cleanBase64 = parts[1] || parts[0];
      }
      const imagePart = {
        inlineData: {
          mimeType: "image/png",
          data: cleanBase64
        }
      };
      let systemPrompt = "";
      let userPrompt = "";
      const pIndexDisplay = pageIndex !== void 0 ? `Page ${Number(pageIndex) + 1}` : "The page";
      if (format === "HTML") {
        systemPrompt = "You are an elite web architect specializing in perfect Document-to-Web absolute and semantic layout preservation. Reconstruct pages with flawless precision.";
        userPrompt = `Extract ALL visual text layers, styling parameters, background colors, alignments, and columns from this PDF page image. Reconstruct it as an extremely elegant, self-contained HTML block (no <html>, <head> or <body> tags, just a root <div class="gemini-page-container relative w-[800px] min-h-[1100px] bg-white text-black p-10 font-sans shadow-md border border-slate-200 mb-10 overflow-hidden rounded-2xl mx-auto">).
Use elegant CSS styles and modern Tailwind classes to recreate the exact background colors, side-by-side columns (using flex or grid layouts), tables with clean visible borders, headings, and footer blocks. Make sure text is selectable and editable.
${customInstructions ? `Special Format/Adjustment Prompt: ${customInstructions}.` : ""}
Return ONLY the HTML block. Do NOT include markdown code blocks (such as \`\`\`html) or any conversational text. Start directly with "<div class="`;
      } else if (format === "DOCX") {
        systemPrompt = "You are a professional document design engineer specializing in converting static documents into perfectly editable, standard-flow Microsoft Word templates.";
        userPrompt = `Analyze this PDF page image. Reconstruct it as a standard-flow, fully editable HTML block that loads seamlessly as a native document in Microsoft Word.
CRITICAL CONSTRAINT: You MUST NOT use absolute positioning (do NOT use "position: absolute", "position: relative", "left:" or "top:" values), as absolute properties render as uneditable, overlapping, and broken float boxes in Microsoft Word.
Instead, use standard flow layout blocks:
- Use standard paragraphs (<p>), headings (<h1>, <h2>, <h3>), and bulleted lists (<ul>, <ol>, <li>).
- If there are side-by-side columns or parallel blocks, model them using native HTML tables with invisible borders: <table style="width: 100%; border: none; border-collapse: collapse;"><tr><td style="width: 50%; vertical-align: top; padding-right: 15px;">Column 1...</td><td style="width: 50%; vertical-align: top;">Column 2...</td></tr></table>
- If there are content tables, model them using standard tables with visible borders: <table style="width: 100%; border: 1px solid #cccccc; border-collapse: collapse;"><tr style="background-color: #f2f2f2;"><th style="padding: 6px; border: 1px solid #cccccc;">Header 1</th>...</tr><tr><td style="padding: 6px; border: 1px solid #cccccc;">Val 1</td>...</tr></table>
- Apply text formatting using clear inline styling properties (font-family, font-size in pt, font-weight, color, line-height, text-align, margin-bottom).
Wrap the entire reconstructed output inside a simple page-break element:
<div class="word-page-wrapper" style="width: 8.5in; background-color: #ffffff; padding: 0.8in; margin: 0 auto; page-break-after: always; box-sizing: border-box; font-family: 'Arial', 'Calibri', sans-serif;">
  ... [Reconstructed Flowable Content] ...
</div>
${customInstructions ? `Special Rule/Translation/Adjustment: ${customInstructions}.` : ""}
Return ONLY the HTML code. Do NOT use markdown style wrappers (like \`\`\`html). Start directly with "<div class="`;
      } else if (format === "XLSX") {
        systemPrompt = "You are a database engineer specialized in converting scanned tables or document rows into pure Tab-Separated Values (TSV) grids.";
        userPrompt = `Analyze the table structure, grid borders, headers, labels, numbers and text cells of this page image.
Convert the data tables beautifully into a clean Tab-Separated Value (TSV) grid. Use the tab character (\\t) to separate cell columns and the newline character (\\n) to separate row items. Combine cell blocks if necessary to match the structure. 
Return ONLY the raw Tab-Separated Values (TSV) string. Do not explain, do not add comments, and do not use markdown code block wrappers (like \`\`\`tsv).`;
      } else {
        systemPrompt = "You are a professional scribe and OCR post-processing engine.";
        userPrompt = `Extract all text, paragraphs, headers, columnar information, titles, lists, and tables from this page image. 
Maintain readable margins, tables, lists, paragraph structures, reading order and title layout in plain text.
${customInstructions ? `Special Rule: ${customInstructions}.` : ""}
Return ONLY the clean plain text of ${pIndexDisplay}. Do not write introductions, explanations or comments.`;
      }
      const response = await callGeminiWithRetry(
        () => ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: { parts: [imagePart, { text: userPrompt }] },
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.2
            // Keep it highly deterministic for precise layout replication
          }
        })
      );
      let textOutput = response.text || "";
      if (textOutput.startsWith("```html")) {
        textOutput = textOutput.substring(7);
      }
      if (textOutput.startsWith("```xml")) {
        textOutput = textOutput.substring(6);
      }
      if (textOutput.startsWith("```")) {
        textOutput = textOutput.substring(3);
      }
      if (textOutput.endsWith("```")) {
        textOutput = textOutput.substring(0, textOutput.length - 3);
      }
      textOutput = textOutput.trim();
      res.json({ text: textOutput });
    } catch (err) {
      console.error("Gemini Multi-Format Conversion Error:", err);
      let clientError = err.message || "Failed to convert using Gemini AI";
      let isQuotaError = false;
      let isCongestionError = false;
      const errMsg = String(err.message || err || "").toUpperCase();
      const errStatus = Number(err.status || err.statusCode || err.code || 0);
      if (errStatus === 429 || errMsg.includes("429") || errMsg.includes("QUOTA") || errMsg.includes("EXHAUSTED") || errMsg.includes("RATE_LIMIT")) {
        isQuotaError = true;
        clientError = "Gemini API Quota Limit Exceeded: Your personal API key's free usage quota has been fully exhausted or rate-limited in Google AI Studio. Please verify spelling, configure billing on your key, generate/input a new active API key, or switch to our ultra-reliable Free Local Offline engine to continue instantly.";
      } else if (errStatus === 503 || errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("HIGH DEMAND") || errMsg.includes("TEMPORARY") || errMsg.includes("SPIKES IN DEMAND")) {
        isCongestionError = true;
        clientError = "Gemini AI Service Under High Demand (Temporary 503): Google's Gemini models are currently experiencing temporary traffic spikes or resource-exhaustion. Try again in a few seconds, configure another personal API key, or switch to our ultra-reliable Free Local Offline engine to continue instantly.";
      } else if (errMsg.includes("KEY_INVALID") || errMsg.includes("API KEY NOT VALID") || errMsg.includes("INVALID_ARGUMENT") || errMsg.includes("BAD_KEY") || errStatus === 400 && errMsg.includes("KEY")) {
        clientError = "Invalid API Key: The personal Gemini API Key you configured is invalid. Please double check that you copied it correctly from Google AI Studio, ensure there are no leading/trailing spaces, or switch to our ultra-reliable Free Local Offline engine.";
      }
      const resStatus = errStatus >= 400 && errStatus < 600 ? errStatus : 500;
      res.status(resStatus).json({
        error: clientError,
        isQuotaError,
        isCongestionError,
        rawError: err.message || String(err)
      });
    }
  });
  app.post("/api/pdf/protect", async (req, res) => {
    try {
      const { pdfBase64, password } = req.body;
      if (!pdfBase64 || !password) {
        return res.status(400).json({ error: "Missing pdf data or password" });
      }
      const pdfBuffer = Buffer.from(pdfBase64, "base64");
      const inStream = new import_muhammara.default.PDFRStreamForBuffer(pdfBuffer);
      const outPath = import_path.default.join(process.cwd(), `protected_${Date.now()}.pdf`);
      try {
        const pdfWriter = import_muhammara.default.createWriter(outPath, {
          userPassword: password,
          ownerPassword: password,
          userProtectionFlag: 4
          // Allow printing initially
        });
        pdfWriter.appendPDFPagesFromPDF(inStream);
        pdfWriter.end();
        const protectedBuffer = import_fs.default.readFileSync(outPath);
        import_fs.default.unlinkSync(outPath);
        res.json({ pdfBase64: protectedBuffer.toString("base64") });
      } catch (err) {
        if (import_fs.default.existsSync(outPath)) import_fs.default.unlinkSync(outPath);
        throw err;
      }
    } catch (err) {
      console.error("Encryption error:", err);
      res.status(500).json({ error: "Failed to protect PDF" });
    }
  });
  app.post("/api/pdf/decrypt", async (req, res) => {
    try {
      const { pdfBase64, password } = req.body;
      if (!pdfBase64 || !password) {
        return res.status(400).json({ error: "Missing pdf data or password" });
      }
      const pdfBuffer = Buffer.from(pdfBase64, "base64");
      const inputPath = import_path.default.join(process.cwd(), `temp_input_${Date.now()}.pdf`);
      const outputPath = import_path.default.join(process.cwd(), `temp_output_${Date.now()}.pdf`);
      import_fs.default.writeFileSync(inputPath, pdfBuffer);
      try {
        import_muhammara.default.recrypt(inputPath, outputPath, { password });
        const decryptedBuffer = import_fs.default.readFileSync(outputPath);
        import_fs.default.unlinkSync(inputPath);
        import_fs.default.unlinkSync(outputPath);
        res.json({ pdfBase64: decryptedBuffer.toString("base64") });
      } catch (err) {
        if (import_fs.default.existsSync(inputPath)) {
          try {
            import_fs.default.unlinkSync(inputPath);
          } catch {
          }
        }
        if (import_fs.default.existsSync(outputPath)) {
          try {
            import_fs.default.unlinkSync(outputPath);
          } catch {
          }
        }
        console.error("Internal Decryption Error:", err);
        return res.status(400).json({ error: "Incorrect password or corrupted PDF." });
      }
    } catch (err) {
      console.error("Decryption API Error:", err);
      res.status(500).json({ error: "Failed to process PDF decryption." });
    }
  });
  async function ensureTessDataLoaded() {
    const tessDir = import_path.default.join(process.cwd(), "tessdata");
    if (!import_fs.default.existsSync(tessDir)) {
      import_fs.default.mkdirSync(tessDir, { recursive: true });
    }
    const targetFile = import_path.default.join(tessDir, "eng.traineddata.gz");
    if (import_fs.default.existsSync(targetFile) && import_fs.default.statSync(targetFile).size > 1e6) {
      return targetFile;
    }
    const mirrors = [
      "https://cdn.jsdelivr.net/gh/naptha/tessdata@gh-pages/4.0.0/eng.traineddata.gz",
      "https://tessdata.projectnaptha.com/4.0.0/eng.traineddata.gz",
      "https://raw.githubusercontent.com/naptha/tessdata/gh-pages/4.0.0/eng.traineddata.gz"
    ];
    console.log("[TESSERACT] Local traineddata missing. Downloading from mirrors...");
    for (const url of mirrors) {
      try {
        console.log(`[TESSERACT] Attempting download from: ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        import_fs.default.writeFileSync(targetFile, Buffer.from(arrayBuffer));
        console.log("[TESSERACT] Successfully cached eng.traineddata.gz locally!");
        return targetFile;
      } catch (err) {
        console.warn(`[TESSERACT] Mirror failed: ${url}. Error: ${err.message || err}`);
      }
    }
    throw new Error("Unable to download Tesseract language pack from any available mirror. Please check network connection.");
  }
  app.post("/api/ocr/local-tesseract", async (req, res) => {
    try {
      const { pageImageBase64 } = req.body;
      if (!pageImageBase64) {
        return res.status(400).json({ error: "Missing page image data" });
      }
      let cleanBase64 = pageImageBase64;
      if (cleanBase64.startsWith("data:")) {
        const parts = cleanBase64.split(";base64,");
        cleanBase64 = parts[1] || parts[0];
      }
      const imgBuffer = Buffer.from(cleanBase64, "base64");
      const localTessDir = import_path.default.join(process.cwd(), "tessdata");
      await ensureTessDataLoaded();
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, {
        langPath: localTessDir,
        cachePath: localTessDir,
        gzip: true
      });
      const ocrResult = await worker.recognize(imgBuffer, {}, { blocks: true });
      const rawBlocks = ocrResult?.data?.blocks || [];
      const extractedWords = [];
      for (const block of rawBlocks) {
        const paragraphs = block?.paragraphs || [];
        for (const para of paragraphs) {
          const lines = para?.lines || [];
          for (const line of lines) {
            const wordsList = line?.words || [];
            for (const w of wordsList) {
              if (w) {
                extractedWords.push(w);
              }
            }
          }
        }
      }
      await worker.terminate();
      const cleanWords = extractedWords.map((w) => ({
        text: w.text || "",
        bbox: {
          x0: w.bbox?.x0 || 0,
          y0: w.bbox?.y0 || 0,
          x1: w.bbox?.x1 || 0,
          y1: w.bbox?.y1 || 0
        }
      }));
      res.json({ words: cleanWords });
    } catch (err) {
      console.error("Server-side local OCR Error:", err);
      res.status(500).json({ error: err.message || "Failed running local tesseract OCR backend." });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
