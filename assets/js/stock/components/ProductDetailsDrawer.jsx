import React, { useState, useEffect } from "react";
// 🚀 LUCIDE SPECIFIER INTEGRATION VIA IMPORT MAP / DIRECT CDN ACCESS
import { 
  ArrowLeft,   
  Crown, 
  Download, 
  ShieldCheck, 
  Check, 
  RefreshCw, 
  AlertTriangle
} from "lucide-react";

// Components & Utility Helpers Layer (Strict Absolute Path Matrix bsdk)
import SecurePreview, { downloadAsPdf, downloadAsDoc } from "/assets/js/stock/SecurePreview.jsx";
import ProductComments from "/assets/js/stock/ProductComments.jsx";
import { SCRIPT_URL, fetchGAS } from "/assets/js/stock/services/api.js";
import { extractDriveId, resolveThumbnailUrl } from "/assets/js/stock/utils/drm.js";

export default function ProductDetailsDrawer({ 
  product, 
  user, 
  requests, 
  liveSync, 
  onClose, 
  openLogin,
  onSyncRequests
}) {
  const [paytmUtr, setPaytmUtr] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [checkoutName, setCheckoutName] = useState("");
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [requestStatus, setRequestStatus] = useState("idle"); 
  const [statusMessage, setStatusMessage] = useState("");
  const [createdRequestId, setCreatedRequestId] = useState("");
  const [rawUnlockedContent, setRawUnlockedContent] = useState("");
  const [retrievedToken, setRetrievedToken] = useState("");

  const isFree = Number(product.price || 0) === 0;
  const hasSubscription = user && user.subscription && user.subscription.status === "approved";
  const surchargedPrice = parseFloat((product.price * 1.15).toFixed(2));
  const finalPrice = user ? product.price : surchargedPrice;

  const approvedRequest = requests.find(
    (req) => 
      req.assetId === product.id && 
      req.status === "approved" &&
      (user ? req.customerEmail.toLowerCase() === user.email.toLowerCase() : true)
  );

  const pendingRequest = requests.find(
    (req) => 
      req.assetId === product.id && 
      req.status === "pending" &&
      (user ? req.customerEmail.toLowerCase() === user.email.toLowerCase() : true)
  );

  const isUnlocked = isFree || !!hasSubscription || !!approvedRequest;
  const isPdfOrDoc = product.type === "pdf" || product.type === "document" || product.type === "doc" || product.type === "docx";

  useEffect(() => {
    if (approvedRequest) {
      setRetrievedToken(approvedRequest.secureToken || "");
      if (approvedRequest.rawContent) {
        setRawUnlockedContent(approvedRequest.rawContent);
      }
    }
  }, [approvedRequest]);

  const triggerPdfDownload = () => {
    if (!isUnlocked) return;
    const content = rawUnlockedContent || (product.driveId && product.driveId.length > 40 && !extractDriveId(product.driveId) ? product.driveId : product.description);
    downloadAsPdf(product.title, content || "TyagiHub Solved Study Manual");
  };

  const triggerDocDownload = () => {
    if (!isUnlocked) return;
    const content = rawUnlockedContent || (product.driveId && product.driveId.length > 40 && !extractDriveId(product.driveId) ? product.driveId : product.description);
    downloadAsDoc(product.title, content || "TyagiHub Solved Study Manual");
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!product) return;

    const utr = paytmUtr.trim();
    if (!isFree && (!utr || utr.length < 6)) {
      setRequestStatus("error");
      setStatusMessage("Please enter a valid 12-digit Paytm Transaction ID or UPI Reference Number (UTR).");
      return;
    }

    setRequestStatus("verifying");
    setStatusMessage("");

    const reqId = "REQ-" + Math.floor(100000 + Math.random() * 900000);
    setCreatedRequestId(reqId);

    const clientName = user ? user.displayName : checkoutName.trim() || "Guest Student";
    const clientEmail = user ? user.email : checkoutEmail.trim() || "guest@tyagihub.com";

    const params = new URLSearchParams({
      action: "addRequest",
      id: reqId,
      assetId: product.id,
      assetTitle: product.title,
      customerName: clientName,
      customerEmail: clientEmail,
      customerWorkspace: whatsappNumber.trim() || "N/A",
      transactionId: utr,
      price: finalPrice.toString(),
      requestDate: new Date().toISOString()
    });

    if (liveSync && SCRIPT_URL) {
      try {
        const res = await fetchGAS(`${SCRIPT_URL}?${params.toString()}`);
        if (res.success) {
          if (res.status === "approved") {
            setRequestStatus("success");
            setStatusMessage("✓ Payment approved successfully. You are cleared for secure download redirection.");
            setRetrievedToken(res.secureToken || "");
            if (res.rawContent) {
              setRawUnlockedContent(res.rawContent);
            }
          } else {
            setRequestStatus("success");
            setStatusMessage("Your transaction was submitted. Golu Tyagi's automated Paytm inbox scanner verifies email receipts momentarily. Once matched, access triggers!");
          }
          if (onSyncRequests) onSyncRequests();
        } else {
          setRequestStatus("error");
          setStatusMessage(res.error || "System rejected validation. Please contact support.");
        }
      } catch (err) {
        saveRequestOffline(reqId, utr, clientName, clientEmail);
      }
    } else {
      saveRequestOffline(reqId, utr, clientName, clientEmail);
    }
  };

  const saveRequestOffline = (reqId, utr, clientName, clientEmail) => {
    const offlineRequests = JSON.parse(localStorage.getItem("tyagihub_requests_offline") || "[]");
    const newReq = {
      rowId: reqId,
      id: reqId,
      assetId: product.id,
      assetTitle: product.title,
      customerName: clientName,
      customerEmail: clientEmail,
      customerWhatsapp: whatsappNumber || "N/A",
      transactionId: utr,
      price: finalPrice.toString(),
      status: "pending",
      requestDate: new Date().toLocaleDateString()
    };
    offlineRequests.unshift(newReq);
    localStorage.setItem("tyagihub_requests_offline", JSON.stringify(offlineRequests));
    
    setRequestStatus("success");
    setStatusMessage("Saved locally! Send receipt screenshot to Golu Tyagi via WhatsApp for quick manual approval.");
    if (onSyncRequests) onSyncRequests();
  };

  const paytmUpiString = `upi://pay?pa=paytmqr28100505010113clkijdlzou@paytm&pn=Paytm%20Merchant&mc=5499&mode=02&orgid=000000&paytmqr=28100505010113CLKIJDLZOU&tn=Verified%20Paytm%20Account&am=${finalPrice}&cu=INR`;
  const paytmQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(paytmUpiString)}`;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      <button
        onClick={onClose}
        className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border bg-slate-900 hover:bg-slate-850 text-slate-350 hover:text-white border-slate-800 transition-colors cursor-pointer mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Storefront
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <div className="lg:col-span-6 space-y-4">
          <div className="border border-slate-800/80 bg-slate-950/40 rounded-2xl overflow-hidden p-5 flex flex-col items-center justify-center min-h-[420px]">
            <SecurePreview
              src={resolveThumbnailUrl(product)}
              alt={product.title}
              isFree={isUnlocked}
              type={product.type}
              pdfContent={rawUnlockedContent}
              assetId={product.id}
              className="max-h-[380px] max-w-full w-auto h-auto rounded-lg object-contain"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-3 bg-slate-950/60 rounded-xl border border-slate-900 text-[10px] text-slate-400 font-mono">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Protected by secure Apps Script email & UTR match algorithm. Unauthorized extraction is logged.</span>
          </div>
        </div>

        <div className="lg:col-span-6 space-y-6 text-left">
          
          <div className="space-y-3">
            <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {product.type} File • {product.size || "150 KB"}
            </span>
            <h1 className="text-xl md:text-2xl font-black text-white leading-tight uppercase tracking-tight">
              {product.title}
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              {product.description || "Premium solved education guide compiled by TyagiHub educators. Fully verified solutions included."}
            </p>
          </div>

          <div className="border-t border-slate-900/60 pt-6">
            
            {isUnlocked ? (
              <div className="p-6 bg-emerald-950/20 border border-emerald-900/35 rounded-2xl space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-950 flex items-center justify-center text-emerald-400 border border-emerald-800 shadow">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase text-emerald-400 tracking-wider">Prisinte Copy Unlocked</h3>
                    <p className="text-[10px] text-slate-400">Your educational credentials have been successfully matched inside Google Sheets.</p>
                  </div>
                </div>

                <div className="pt-2">
                  {isPdfOrDoc ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button onClick={triggerPdfDownload} className="w-full py-3 px-5 text-xs font-black tracking-wider uppercase rounded-xl shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 text-center cursor-pointer">
                        <Download className="w-4 h-4" /> Download PDF Format
                      </button>
                      <button onClick={triggerDocDownload} className="w-full py-3 px-5 text-xs font-black tracking-wider uppercase rounded-xl shadow-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 text-center cursor-pointer">
                        <Download className="w-4 h-4" /> Download DOC Format
                      </button>
                    </div>
                  ) : (
                    <a href={SCRIPT_URL ? `${SCRIPT_URL}?action=download&token=${retrievedToken || "GUEST_UNLOCKED"}` : "#"} target="_blank" rel="noreferrer" className="w-full py-3 px-6 text-xs font-black tracking-wider uppercase rounded-xl shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 text-center">
                      <Download className="w-4 h-4" /> Download Original File Now
                    </a>
                  )}
                </div>
              </div>
            ) : pendingRequest ? (
              <div className="p-6 bg-slate-950/60 border border-indigo-900/25 rounded-2xl space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">UTR Match Pending</h3>
                    <p className="text-[10px] text-slate-400">Request ID: <span className="font-mono text-white">{pendingRequest.id}</span></p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">Once Paytm Business registers your payment, your UTR matches automatically inside Google Sheets logs.</p>
                <div className="pt-2">
                  <button onClick={() => { if (onSyncRequests) onSyncRequests(); }} className="w-full py-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600/30 transition-all font-bold text-[10px] uppercase rounded-lg">
                    Refresh Sync Status
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center p-4 rounded-xl bg-slate-950 border border-slate-900/80">
                  <div>
                    <h3 className="text-[10px] font-mono font-bold uppercase text-slate-500">PAYABLE AMOUNT</h3>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-2xl font-black text-white">₹{finalPrice}</span>
                      {!user && <span className="text-[9px] font-bold text-rose-500/80">(15% Guest Surcharge included)</span>}
                    </div>
                  </div>
                  {!user && (
                    <button onClick={openLogin} className="px-3 py-1.5 text-[9px] font-extrabold uppercase bg-indigo-600 text-white rounded-lg cursor-pointer flex items-center gap-1 shadow">
                      <Crown className="w-3 h-3 text-amber-400" /> Login as VIP (Save 15%)
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center border border-slate-900 bg-slate-950/15 p-5 rounded-2xl">
                  <div className="md:col-span-5 flex flex-col items-center text-center space-y-2">
                    <span className="text-[8px] font-mono font-bold tracking-widest text-slate-500 uppercase">SECURE PAYTM MERCHANT QR</span>
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                      <img src={paytmQrUrl} alt="Paytm Merchant UPI QR" className="w-32 h-32 md:w-36 md:h-36" />
                    </div>
                    <div className="text-center">
                      <span className="block text-[8px] font-mono text-slate-500 font-bold">paytmqr28100505010113clkijdlzou@paytm</span>
                      <span className="block text-[8px] font-mono text-slate-500">Merchant: Golu Tyagi</span>
                    </div>
                  </div>

                  <div className="md:col-span-7 space-y-4">
                    <form onSubmit={handlePaymentSubmit} className="space-y-3.5">
                      {!user && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="block text-[8px] font-mono uppercase text-slate-500">Your Name</label>
                            <input type="text" value={checkoutName} onChange={(e) => setCheckoutName(e.target.value)} placeholder="Student Name" className="w-full p-2.5 text-[11px] bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none" required />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[8px] font-mono uppercase text-slate-500">Your Email</label>
                            <input type="email" value={checkoutEmail} onChange={(e) => setCheckoutEmail(e.target.value)} placeholder="student@example.com" className="w-full p-2.5 text-[11px] bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none" required />
                          </div>
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="block text-[8px] font-mono uppercase text-slate-500">WhatsApp Number</label>
                        <input type="tel" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="+91 99999 88888" className="w-full p-2.5 text-[11px] bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none" />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[8px] font-mono uppercase text-amber-500 font-bold">Paytm UPI Ref (UTR) / 12-Digit Transaction ID</label>
                        <input 
                          type="text" 
                          value={paytmUtr} 
                          onChange={(e) => setPaytmUtr(e.target.value.replace(/[^0-9]/g, ""))} 
                          placeholder="Paste exact 12-digit Paytm UTR ID..." 
                          maxLength={12} 
                          className="w-full p-3 text-xs bg-slate-950 border border-indigo-950 text-slate-200 focus:outline-none text-center font-mono font-extrabold tracking-widest placeholder:text-slate-600" 
                          required 
                        />
                      </div>

                      <button type="submit" disabled={requestStatus === "verifying"} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-1.5 text-xs">
                        {requestStatus === "verifying" ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Unlock Premium Access"}
                      </button>
                    </form>

                    {requestStatus === "success" && (
                      <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-xl space-y-2 text-left animate-in fade-in">
                        <p className="text-[10px] text-emerald-400 font-bold">✓ Payment registered successfully!</p>
                        <p className="text-[9px] text-slate-300 leading-normal">{statusMessage}</p>
                        {createdRequestId && <div className="p-2 bg-slate-950 border border-slate-900 rounded font-mono text-[9px] text-indigo-400 text-center select-all">ID: {createdRequestId}</div>}
                      </div>
                    )}

                    {requestStatus === "error" && <div className="p-3 bg-rose-950/30 border border-rose-900/50 rounded-xl text-[9px] text-rose-400 leading-normal text-left">{statusMessage}</div>}
                  </div>
                </div>

                <div className="flex items-start gap-2 text-[9.5px] leading-relaxed text-slate-500">
                  <AlertTriangle className="w-4 h-4 text-slate-600 shrink-0" />
                  <p>*Paytm transaction references are logged instantly in Google Sheets via the Apps Script Web App. If your transaction fails to auto-approve, please contact Golu Tyagi with the Request ID.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-900 pt-8 mt-12">
        <ProductComments product={product} user={user} openLogin={openLogin} />
      </div>

    </div>
  );
}
