import React, { useState } from "react";
import { 
  Shield, 
  RefreshCw, 
  Plus, 
  Trash, 
  Check, 
  X, 
  ListOrdered, 
  PlusCircle, 
  Package, 
  FolderSync 
} from "lucide-react";
import { SCRIPT_URL, fetchGAS } from "/assets/js/stock/services/api.js";
import { extractDriveId } from "/assets/js/stock/utils/drm.js";

export default function AdminPanel({ 
  requests, 
  subscriptions, 
  products, 
  liveSync, 
  gasUrl, 
  onRefreshSync, 
  onSetProducts, 
  onSetRequests,
  onSetSubscriptions
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [syncingPaytm, setSyncingPaytm] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // New Product Form state
  const [title, setTitle] = useState("");
  const [type, setType] = useState("image"); // "image" | "pdf" | "zip" | "video"
  const [size, setSize] = useState("");
  const [price, setPrice] = useState(0);
  const [driveId, setDriveId] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [description, setDescription] = useState("");

  const resetProductForm = () => {
    setTitle("");
    setType("image");
    setSize("");
    setPrice(0);
    setDriveId("");
    setPreviewUrl("");
    setDescription("");
  };

  // Sync Paytm Business Gmail Receipts manually
  const triggerPaytmEmailSync = async () => {
    if (!liveSync || !gasUrl) {
      alert("Please connect Golu's Live Google Sheets Sync to trigger email scanning.");
      return;
    }
    setSyncingPaytm(true);
    setSyncMessage("");
    try {
      const res = await fetchGAS(`${gasUrl}?action=syncEmails`);
      if (res.success) {
        setSyncMessage(res.message || "Paytm Business receipt scan completed successfully!");
        if (onRefreshSync) onRefreshSync();
      } else {
        setSyncMessage("Error: " + (res.error || "Execution failed. Check script logs."));
      }
    } catch (err) {
      setSyncMessage("Connection failed. Check Google Apps Script permissions.");
    } finally {
      setSyncingPaytm(false);
    }
  };

  // Add Product (Local or Live Sheets)
  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !driveId.trim()) {
      alert("Product Title and GitHub Path/Direct Content are required!");
      return;
    }

    const prodId = "PROD-" + Date.now().toString(36).toUpperCase();
    const cleanDriveId = driveId.trim();
    
    let defaultPreview = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80";
    if (type === "pdf") {
      defaultPreview = "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=400&q=80";
    } else if (type === "document" || type === "doc" || type === "docx" || type === "zip") {
      defaultPreview = "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80";
    }

    const finalPreview = previewUrl.trim() || defaultPreview;

    setLoading(true);

    if (liveSync && gasUrl) {
      try {
        const params = new URLSearchParams({
          action: "addAsset",
          id: prodId,
          title: title.trim(),
          type: type,
          size: size.trim() || "N/A",
          price: price.toString(),
          driveId: cleanDriveId,
          previewUrl: finalPreview,
          description: description.trim() || "Premium high quality educational resource."
        });

        const res = await fetchGAS(`${gasUrl}?${params.toString()}`);
        if (res.success) {
          setShowAddForm(false);
          resetProductForm();
          if (onRefreshSync) onRefreshSync();
          alert("Product added successfully to Google Sheets!");
        } else {
          alert("Error adding asset to sheet: " + res.error);
        }
      } catch (err) {
        alert("Failed to connect to Google Sheets. Product wasn't saved.");
      } finally {
        setLoading(false);
      }
    } else {
      // Offline local update
      const localProduct = {
        id: prodId,
        title: title.trim(),
        type: type,
        size: size.trim() || "N/A",
        price: Number(price),
        driveId: cleanDriveId,
        previewUrl: finalPreview,
        description: description.trim()
      };
      
      onSetProducts([localProduct, ...products]);
      setShowAddForm(false);
      resetProductForm();
      setLoading(false);
      alert("Added to sandbox catalog!");
    }
  };

  // Delete product
  const handleDeleteProduct = async (prodId) => {
    if (!confirm("Are you sure you want to permanently delete this product? This will remove it from the store.")) {
      return;
    }

    if (liveSync && gasUrl) {
      setLoading(true);
      try {
        const res = await fetchGAS(`${gasUrl}?action=deleteAsset&id=${prodId}`);
        if (res.success) {
          if (onRefreshSync) onRefreshSync();
        } else {
          alert("Error deleting product from Google Sheets: " + res.error);
        }
      } catch (err) {
        alert("Failed to connect to sheet.");
      } finally {
        setLoading(false);
      }
    } else {
      onSetProducts(products.filter((p) => p.id !== prodId));
    }
  };

  // Manual UTR Verification / Approval
  const handleApproveUtr = async (reqId, status) => {
    const manualToken = "TOKEN-MANUAL-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    
    if (liveSync && gasUrl) {
      setLoading(true);
      try {
        const res = await fetchGAS(`${gasUrl}?action=updateRequest&id=${reqId}&status=${status}&secureToken=${manualToken}`);
        if (res.success) {
          if (onRefreshSync) onRefreshSync();
        } else {
          alert("Failed to update transaction status: " + res.error);
        }
      } catch (err) {
        alert("Sync error failed to update status.");
      } finally {
        setLoading(false);
      }
    } else {
      onSetRequests(requests.map((req) => 
        req.id === reqId ? { ...req, status: status, secureToken: status === "approved" ? manualToken : undefined } : req
      ));
    }
  };

  // Manual Subscription UTR Verification / Approval
  const handleApproveSubscription = async (subId, status) => {
    const manualToken = "SUB-TOKEN-MANUAL-" + Math.random().toString(36).substring(2, 10).toUpperCase();

    if (liveSync && gasUrl) {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          action: "updateSubscription",
          id: subId,
          status: status,
          secureToken: manualToken
        });
        const res = await fetchGAS(`${gasUrl}?${params.toString()}`);
        if (res.success) {
          if (onRefreshSync) onRefreshSync();
          alert(`Subscription request ${subId} successfully marked as ${status}!`);
        } else {
          alert("Failed to update subscription on sheet: " + res.error);
        }
      } catch (err) {
        alert("Failed to update subscription. Sync failed.");
      } finally {
        setLoading(false);
      }
    } else {
      onSetSubscriptions(subscriptions.map((sub) => 
        sub.id === subId ? { ...sub, status: status, secureToken: status === "approved" ? manualToken : undefined } : sub
      ));
      alert(`[Sandbox Mode] Subscription request ${subId} marked as ${status}.`);
    }
  };

  return (
    <div className="border border-indigo-900/60 bg-slate-900/40 rounded-2xl p-6 md:p-8 space-y-8 animate-in fade-in text-left">
      
      {/* Panel Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <h2 className="text-lg font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            TyagiHub Admin Workspace
          </h2>
          <p className="text-[11px] text-slate-400">
            Add digital products, delete listings, and synchronize Paytm Business email receipts manually.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={triggerPaytmEmailSync}
            disabled={syncingPaytm || !liveSync}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-40 uppercase cursor-pointer"
          >
            <FolderSync className={`w-3.5 h-3.5 ${syncingPaytm ? "animate-spin" : ""}`} />
            Sync Paytm Emails
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1 uppercase cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            {showAddForm ? "Close Form" : "Add New Product"}
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className="p-3 bg-emerald-950/20 border border-emerald-900/50 rounded-xl text-xs text-emerald-400 leading-normal animate-in fade-in">
          {syncMessage}
        </div>
      )}

      {/* Add New Product Form Panel */}
      {showAddForm && (
        <form onSubmit={handleAddProductSubmit} className="bg-slate-950/60 border border-slate-850 p-5 rounded-2xl space-y-4 max-w-2xl animate-in slide-in-from-top duration-200">
          <h3 className="text-xs font-black uppercase text-indigo-400 tracking-wider mb-2">
            Create Digital Listing
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[8px] font-mono uppercase tracking-wider text-slate-500">
                Product Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Chapter 5 Physics Solved Guide"
                className="w-full p-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[8px] font-mono uppercase tracking-wider text-slate-500">
                Resource Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="image">Image Drawing / Template</option>
                <option value="pdf">PDF Syllabus Study Guide</option>
                <option value="zip">ZIP Asset Bundle</option>
                <option value="video">MP4 Video Lecture</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="block text-[8px] font-mono uppercase tracking-wider text-slate-500">
                File Size
              </label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="4.5 MB"
                className="w-full p-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[8px] font-mono uppercase tracking-wider text-slate-500">
                Price (INR)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full p-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[8px] font-mono uppercase tracking-wider text-slate-500">
                Cover Preview URL (Optional)
              </label>
              <input
                type="text"
                value={previewUrl}
                onChange={(e) => setPreviewUrl(e.target.value)}
                placeholder="https://..."
                className="w-full p-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[8px] font-mono uppercase tracking-wider text-indigo-400 font-bold">
              GitHub Asset Path or Raw Markdown / SVG Content
            </label>
            <textarea
              value={driveId}
              onChange={(e) => setDriveId(e.target.value)}
              placeholder="Enter Private GitHub Path (e.g. assets/svg/crown_logo.svg) or decrypted raw text here..."
              className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 h-24 font-mono resize-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[8px] font-mono uppercase tracking-wider text-slate-500">
              Brief Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Study Notes including solved proofs and exam practice papers..."
              className="w-full p-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-55 text-white font-extrabold uppercase tracking-widest text-[10px] rounded-xl cursor-pointer shadow-md"
          >
            {loading ? "Saving Item to Google Sheets..." : "Publish Product Listing"}
          </button>
        </form>
      )}

      {/* Grid: Requests and Products Management tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Sub-Panel 1: Direct File Purchases requests */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <ListOrdered className="w-4 h-4" />
            File Purchase Claims ({requests.length})
          </h3>

          <div className="max-h-[360px] overflow-y-auto border border-slate-900 bg-slate-950/25 rounded-xl divide-y divide-slate-900 scrollbar-thin">
            {requests.length > 0 ? (
              requests.map((req) => (
                <div key={req.id} className="p-4 text-xs space-y-2 hover:bg-slate-900/10 transition-colors">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div className="text-left">
                      <span className="font-bold text-white block">{req.customerName}</span>
                      <span className="text-[10px] text-slate-500 block">{req.customerEmail}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded uppercase text-[9px] font-bold border ${
                      req.status === "approved" 
                        ? "bg-emerald-950/40 text-emerald-500 border-emerald-900/30" 
                        : "bg-yellow-950/40 text-yellow-500 border-yellow-900/20 animate-pulse"
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  
                  <div className="text-left leading-normal text-slate-300">
                    <p className="font-semibold text-[11px] text-indigo-300">{req.assetTitle}</p>
                    <p className="text-[9.5px] text-slate-400 font-mono mt-0.5">
                      UTR: <span className="text-amber-400 select-all">{req.transactionId}</span> • Price: ₹{req.price}
                    </p>
                  </div>

                  {req.status !== "approved" && (
                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        onClick={() => handleApproveUtr(req.id, "approved")}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[9px] uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3 h-3" /> Approve
                      </button>
                      <button
                        onClick={() => handleApproveUtr(req.id, "rejected")}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold text-[9px] uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3 h-3" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="p-6 text-center text-slate-500 text-[10px] font-mono uppercase">
                No purchases submitted yet.
              </p>
            )}
          </div>
        </div>

        {/* Sub-Panel 2: Crown subscriptions requests */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <Crown className="w-4 h-4 text-amber-400" />
            Crown Subscriptions ({subscriptions.length})
          </h3>

          <div className="max-h-[360px] overflow-y-auto border border-slate-900 bg-slate-950/25 rounded-xl divide-y divide-slate-900 scrollbar-thin">
            {subscriptions.length > 0 ? (
              subscriptions.map((sub) => (
                <div key={sub.id} className="p-4 text-xs space-y-2 hover:bg-slate-900/10 transition-colors">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div className="text-left">
                      <span className="font-bold text-white block">{sub.userName || "VIP Student"}</span>
                      <span className="text-[10px] text-slate-500 block">{sub.userEmail}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded uppercase text-[9px] font-bold border ${
                      sub.status === "approved" 
                        ? "bg-amber-950/40 text-amber-450 border-amber-900/30 text-amber-400" 
                        : "bg-yellow-950/40 text-yellow-500 border-yellow-900/20 animate-pulse"
                    }`}>
                      {sub.status}
                    </span>
                  </div>

                  <div className="text-left font-mono text-[9.5px] text-slate-400">
                    UTR: <span className="text-amber-400 select-all">{sub.transactionId}</span> • Price: ₹{sub.price}
                  </div>

                  {sub.status !== "approved" && (
                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        onClick={() => handleApproveSubscription(sub.id, "approved")}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[9px] uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3 h-3" /> Approve
                      </button>
                      <button
                        onClick={() => handleApproveSubscription(sub.id, "rejected")}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold text-[9px] uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3 h-3" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="p-6 text-center text-slate-500 text-[10px] font-mono uppercase">
                No active subscription logs.
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Catalog inventory manager list */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
          <Package className="w-4 h-4" />
          Active Store Inventory ({products.length})
        </h3>

        <div className="overflow-x-auto border border-slate-900 bg-slate-950/25 rounded-xl scrollbar-thin">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 font-mono text-[9px] uppercase tracking-wider border-b border-slate-900">
              <tr>
                <th className="p-3">Product Info</th>
                <th className="p-3">Type</th>
                <th className="p-3">Price</th>
                <th className="p-3">Secure Content/Path</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-900/10 transition-colors">
                  <td className="p-3">
                    <span className="font-bold text-white block">{p.title}</span>
                    <span className="text-[10px] text-slate-500 block font-mono">ID: {p.id}</span>
                  </td>
                  <td className="p-3 uppercase font-semibold text-[10px]">{p.type}</td>
                  <td className="p-3 font-mono font-bold">₹{p.price}</td>
                  <td className="p-3">
                    <span className="text-[10px] font-mono text-slate-400 truncate max-w-[150px] block" title={p.driveId}>
                      {p.driveId}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-2 text-rose-500 hover:text-rose-400 hover:bg-rose-950/25 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1"
                      title="Delete asset permanently"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
