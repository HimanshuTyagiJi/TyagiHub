import React, { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";

// 🚀 CRITICAL CONFIG COMPLETE ABSOLUTE CONTEXT LAYOUT BSDK
import { auth } from "/assets/js/stock/services/firebase.js";
import { SCRIPT_URL, fetchGAS } from "/assets/js/stock/services/api.js";

// Components Layer (Strict Paths Verification Core bsdk)
import LoginModal from "/assets/js/stock/components/LoginModal.jsx";
import ProductCard from "/assets/js/stock/components/ProductCard.jsx";
import ProductDetailsDrawer from "/assets/js/stock/components/ProductDetailsDrawer.jsx";
import AdminPanel from "/assets/js/stock/components/AdminPanel.jsx";

// Icons Specifiers Engine Matrix
import { 
  Crown, 
  Search, 
  SlidersHorizontal, 
  HelpCircle, 
  LogOut, 
  User as UserIcon, 
  FolderLock, 
  Activity, 
  Database, 
  Terminal, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  QrCode,
  Sparkles,
  RefreshCw,
  ShoppingBag
} from "lucide-react";

const FALLBACK_PRODUCTS = [];

const SUBSCRIPTION_PLANS = [
  {
    name: "Micro Pass",
    price: 49,
    durationDays: 30,
    credits: 60,
    badge: "Starter Pass ⚡",
    desc: "Perfect for quick individual templates and high-quality vector downloads.",
    features: [
      "60 Wallet Credits issued",
      "Valid for 30 Days (1 Month)",
      "Direct SVG and PNG extracts",
      "1 Credit = ₹1 Fixed value mapping"
    ]
  },
  {
    name: "Mini Pass",
    price: 99,
    durationDays: 30,
    credits: 125,
    badge: "Super Saver 💸",
    desc: "Awesome boost with extra bonus credits for active graphic designers.",
    features: [
      "125 Wallet Credits issued",
      "Valid for 30 Days (1 Month)",
      "Direct high-speed downloads",
      "Includes 25% bonus credits"
    ]
  },
  {
    name: "Super Vault",
    price: 299,
    durationDays: 30,
    credits: 400,
    badge: "Best Value ⭐",
    desc: "Bulk developer vault. Keep assets synced with full layout source codes.",
    features: [
      "400 Wallet Credits issued",
      "Valid for 30 Days (1 Month)",
      "Bypass manual download approvals",
      "Includes 33% bonus credits"
    ],
    popular: true
  },
  {
    name: "Elite Pro Creator",
    price: 599,
    durationDays: 90,
    credits: 850,
    badge: "Agency Pro 👑",
    desc: "Heavy-duty agency membership. Unlocks long-term premium assets.",
    features: [
      "850 Wallet Credits issued",
      "Valid for 90 Days (3 Months)",
      "Bypass download limits entirely",
      "Prioritized manual approvals"
    ]
  }
];

export default function App() {
  // Authentication & Session parameters bsdk
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Admin systems configurations state mapping
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem("tyagihub_admin_mode") === "true");
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminAccessKey, setAdminAccessKey] = useState("");
  const [adminAccessError, setAdminAccessError] = useState("");

  // Storage and catalog listings buffers
  const [products, setProducts] = useState(() => {
    const local = localStorage.getItem("tyagihub_products_offline");
    return local ? JSON.parse(local) : FALLBACK_PRODUCTS;
  });
  const [requests, setRequests] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [liveSync, setLiveSync] = useState(() => {
    const saved = localStorage.getItem("tyagihub_live_sync");
    return saved !== null ? saved === "true" : !!SCRIPT_URL;
  });
  const [syncStatus, setSyncStatus] = useState("idle"); 
  const [syncStatusMessage, setSyncStatusMessage] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  // Filtering metadata metrics
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all"); 
  const [sortBy, setSortBy] = useState("newest"); 

  const [selectedProduct, setSelectedProduct] = useState(null);

  // Value Pack active configurations
  const [showSubModal, setShowSubModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [subPaymentUtr, setSubPaymentUtr] = useState("");
  const [subWhatsapp, setSubWhatsapp] = useState("");
  const [subStatus, setSubStatus] = useState("idle"); 
  const [subMessage, setSubMessage] = useState("");

  // Search tracer state
  const [orderSearchUtr, setOrderSearchUtr] = useState("");
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [trackError, setTrackError] = useState("");
  const [trackLoading, setTrackLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthLoading(true);
      if (firebaseUser) {
        const updatedUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email.split("@")[0],
          photoURL: firebaseUser.photoURL || "https://tyagihub.in/assets/images/icon-192.png",
          subscription: null
        };
        setUser(updatedUser);
        localStorage.setItem("tyagihub_user", JSON.stringify(updatedUser));
      } else {
        setUser(null);
        localStorage.removeItem("tyagihub_user");
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (liveSync && SCRIPT_URL) {
      syncWithGAS();
    }
  }, [liveSync]);

  const syncWithGAS = async (url = SCRIPT_URL) => {
    if (!url) {
      setSyncStatus("error");
      setSyncStatusMessage("Please configure SCRIPT_URL first bsdk.");
      return;
    }

    setIsSyncing(true);
    setSyncStatus("idle");
    setSyncStatusMessage("");

    try {
      const pRes = await fetchGAS(`${url}?action=getProducts`);
      if (pRes.success && Array.isArray(pRes.data)) {
        setProducts(pRes.data);
        localStorage.setItem("tyagihub_products_offline", JSON.stringify(pRes.data));
      } else {
        throw new Error(pRes.error || "Failed to parse active catalog assets.");
      }

      const rRes = await fetchGAS(`${url}?action=getRequests`);
      if (rRes.success && Array.isArray(rRes.data)) {
        setRequests(rRes.data);
      }

      const sRes = await fetchGAS(`${url}?action=getSubscriptions`);
      if (sRes.success && Array.isArray(sRes.data)) {
        setSubscriptions(sRes.data);
        
        if (user) {
          const matchedSub = sRes.data.find(
            (sub) => sub.userEmail.toLowerCase() === user.email.toLowerCase() && sub.status === "approved"
          );
          if (matchedSub) {
            const updatedUser = { ...user, subscription: matchedSub };
            setUser(updatedUser);
            localStorage.setItem("tyagihub_user", JSON.stringify(updatedUser));
          }
        }
      }

      setSyncStatus("success");
      setLiveSync(true);
      localStorage.setItem("tyagihub_live_sync", "true");
    } catch (err) {
      console.error("Sync error:", err);
      setSyncStatus("error");
      setSyncStatusMessage(err.message || "Failed to fetch live data sheets. Offline cache active.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAdminAccessSubmit = (e) => {
    e.preventDefault();
    if (adminAccessKey === "golu123") {
      setIsAdmin(true);
      localStorage.setItem("tyagihub_admin_mode", "true");
      setShowAdminPanel(true);
      setShowAdminLogin(false);
      setAdminAccessKey("");
      setAdminAccessError("");
    } else {
      setAdminAccessError("Invalid access pin. Please try again.");
    }
  };

  const handleAdminSignout = () => {
    setIsAdmin(false);
    setShowAdminPanel(false);
    localStorage.removeItem("tyagihub_admin_mode");
  };

  const handleVIPCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlan || !user) return;

    const utr = subPaymentUtr.trim();
    if (!utr || utr.length < 6) {
      setSubStatus("error");
      setSubMessage("Please enter a valid 12-digit Paytm transaction reference (UTR).");
      return;
    }

    setSubStatus("submitting");
    setSubMessage("");

    const subId = "SUB-" + Math.floor(100000 + Math.random() * 900000);
    const purchaseDate = new Date().toLocaleDateString("en-US");
    const expiryDate = new Date(Date.now() + selectedPlan.durationDays * 24 * 60 * 60 * 1000).toLocaleDateString("en-US");

    if (liveSync && SCRIPT_URL) {
      try {
        const params = new URLSearchParams({
          action: "addSubscription",
          id: subId,
          userEmail: user.email,
          userName: user.displayName,
          planName: selectedPlan.name,
          price: selectedPlan.price.toString(),
          transactionId: utr,
          purchaseDate: purchaseDate,
          expiryDate: expiryDate
        });

        const res = await fetchGAS(`${SCRIPT_URL}?${params.toString()}`);
        if (res.success) {
          if (res.autoVerified && res.secureToken) {
            setSubStatus("success");
            setSubMessage("👑 VIP Pass activated immediately! Automatic UTR scanning complete.");
            const activeSub = {
              id: subId,
              userEmail: user.email,
              userName: user.displayName,
              planName: selectedPlan.name,
              price: selectedPlan.price,
              status: "approved",
              purchaseDate,
              expiryDate,
              secureToken: res.secureToken
            };
            setUser({ ...user, subscription: activeSub });
            setSubscriptions([activeSub, ...subscriptions]);
          } else {
            setSubStatus("success");
            setSubMessage("Submitted! Automated scanner logs verify parameters shortly.");
            const pendingSub = {
              id: subId,
              userEmail: user.email,
              userName: user.displayName,
              planName: selectedPlan.name,
              price: selectedPlan.price,
              status: "pending",
              purchaseDate,
              expiryDate
            };
            setSubscriptions([pendingSub, ...subscriptions]);
          }
          syncWithGAS();
        } else {
          setSubStatus("error");
          setSubMessage(res.error || "Could not register subscription.");
        }
      } catch (err) {
        saveSubscriptionOffline(subId, utr, purchaseDate, expiryDate);
      }
    } else {
      saveSubscriptionOffline(subId, utr, purchaseDate, expiryDate);
    }
  };

  const saveSubscriptionOffline = (subId, utr, purchaseDate, expiryDate) => {
    const offlineSubs = JSON.parse(localStorage.getItem("tyagihub_subs_offline") || "[]");
    const pendingSub = {
      id: subId,
      userEmail: user.email,
      userName: user.displayName,
      planName: selectedPlan.name,
      price: selectedPlan.price,
      transactionId: utr,
      status: "pending",
      purchaseDate,
      expiryDate
    };
    offlineSubs.unshift(pendingSub);
    localStorage.setItem("tyagihub_subs_offline", JSON.stringify(offlineSubs));
    
    setSubStatus("success");
    setSubMessage("Saved offline! Send screenshot to Golu Tyagi via WhatsApp for quick VIP activation.");
  };

  const handleOrderTrackSearch = async (e) => {
    e.preventDefault();
    const query = orderSearchUtr.trim();
    if (!query) return;

    setTrackLoading(true);
    setTrackError("");
    setTrackedOrder(null);

    if (liveSync && SCRIPT_URL) {
      try {
        const res = await fetchGAS(`${SCRIPT_URL}?action=getRequests`);
        if (res.success && Array.isArray(res.data)) {
          const matched = res.data.find(
            (req) => req.transactionId.toLowerCase() === query.toLowerCase() || req.id.toLowerCase() === query.toLowerCase()
          );
          if (matched) {
            setTrackedOrder(matched);
          } else {
            setTrackError("No matching transaction or request ID found in active logs.");
          }
        } else {
          setTrackError("Failed to fetch records. Check Sheets Web App.");
        }
      } catch (err) {
        setTrackError("Connection failed. Sheets live sync unavailable.");
      } finally {
        setTrackLoading(false);
      }
    } else {
      const offlineReqs = JSON.parse(localStorage.getItem("tyagihub_requests_offline") || "[]");
      const matched = offlineReqs.find(
        (req) => req.transactionId.toLowerCase() === query.toLowerCase() || req.id.toLowerCase() === query.toLowerCase()
      );
      if (matched) {
        setTrackedOrder(matched);
      } else {
        setTrackError("No local transaction matching that reference.");
      }
      setTrackLoading(false);
    }
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    const slug = product ? product.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "";
    window.history.pushState(null, "", product ? `?asset=${slug}` : "/");
  };

  useEffect(() => {
    const handlePopState = () => setSelectedProduct(null);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || p.type === selectedCategory;
    const isFree = Number(p.price || 0) === 0;
    const matchesType = selectedType === "all" ? true : selectedType === "free" ? isFree : !isFree;

    return matchesSearch && matchesCategory && matchesType;
  }).sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    const idA = a.id !== undefined && a.id !== null ? String(a.id) : "";
    const idB = b.id !== undefined && b.id !== null ? String(b.id) : "";
    return idB.localeCompare(idA);
  });

  const subPaytmString = selectedPlan ? `upi://pay?pa=paytmqr28100505010113clkijdlzou@paytm&pn=Paytm%20Merchant&mc=5499&mode=02&orgid=000000&paytmqr=28100505010113CLKIJDLZOU&tn=Crown%20VIP%20Subscription&am=${selectedPlan.price}&cu=INR` : "";
  const subQrUrl = selectedPlan ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(subPaytmString)}` : "";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {syncStatus === "error" && (
        <div className="bg-rose-950/40 border-b border-rose-900/30 px-4 py-2 text-xs text-rose-300 text-center flex items-center justify-center gap-2 font-mono">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{syncStatusMessage}</span>
          <button onClick={() => syncWithGAS()} className="underline hover:text-white ml-2 transition-colors flex items-center gap-1 cursor-pointer">
            <RefreshCw className="w-3 h-3" /> Retry Sync
          </button>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Compact Store Controls Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 bg-slate-900/10 border border-slate-900 rounded-xl mb-4 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-[10px] font-mono text-slate-400">
              <span className={`w-1.5 h-1.5 rounded-full ${liveSync ? "bg-emerald-500" : "bg-yellow-500"}`} />
              <span>{liveSync ? "Sheets Live" : "Sandbox"}</span>
            </div>

            <button onClick={() => syncWithGAS()} disabled={isSyncing} className="px-2.5 py-1.5 bg-slate-950 border border-slate-850 text-slate-330 hover:text-white rounded-lg flex items-center gap-1.5 cursor-pointer font-bold font-mono text-[10px]">
              <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin text-indigo-400" : ""}`} />
              {isSyncing ? "Syncing..." : "Sync Sheets"}
            </button>

            {isAdmin ? (
              <button onClick={() => setShowAdminPanel(!showAdminPanel)} className="px-2.5 py-1.5 text-[10px] font-mono font-black border border-indigo-950 bg-indigo-950/20 text-indigo-400 hover:bg-indigo-950/40 rounded-lg">
                {showAdminPanel ? "Hide Admin Panel" : "Show Admin Panel"}
              </button>
            ) : (
              <button onClick={() => setShowAdminLogin(true)} className="p-1.5 text-slate-600 hover:text-indigo-400 rounded-lg" title="Enter Admin Pin">
                <FolderLock className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {user && user.subscription ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-[10px] font-black uppercase text-amber-400 rounded-lg">
                <Crown className="w-3.5 h-3.5" /> Crown VIP Pass
              </span>
            ) : (
              <button onClick={() => setShowSubModal(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-[10px] font-black uppercase rounded-lg shadow-md cursor-pointer">
                <Crown className="w-3.5 h-3.5 text-amber-400" /> Join VIP Members
              </button>
            )}

            {authLoading ? (
              <div className="w-8 h-8 rounded-full border border-slate-800 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-850 py-1 pl-2 pr-1.5 rounded-lg">
                <img src={user.photoURL} alt={user.displayName} className="w-5 h-5 rounded-full border border-slate-800" />
                <span className="text-[10px] font-bold text-slate-200 hidden sm:inline">{user.displayName}</span>
                <button onClick={() => signOut(auth)} title="Log out" className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer">
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button onClick={() => setShowAuthModal(true)} className="px-3 py-1.5 text-[10px] font-bold bg-slate-950 border border-slate-850 text-slate-200 hover:text-white rounded-lg cursor-pointer flex items-center gap-1.5">
                <UserIcon className="w-3 h-3 text-indigo-400" /> Sign In
              </button>
            )}
          </div>
        </div>
        
        {isAdmin && showAdminPanel && (
          <div className="border-b border-indigo-950 pb-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-mono font-bold uppercase text-slate-500 tracking-wider">Active Session: Golu Tyagi Admin Mode</span>
              <button onClick={handleAdminSignout} className="text-[9px] font-mono text-rose-400 hover:text-rose-300 uppercase tracking-widest cursor-pointer font-bold">✕ Deactivate Admin</button>
            </div>
            <AdminPanel
              requests={requests}
              subscriptions={subscriptions}
              products={products}
              liveSync={liveSync}
              gasUrl={SCRIPT_URL}
              onRefreshSync={() => syncWithGAS()}
              onSetProducts={setProducts}
              onSetRequests={setRequests}
              onSetSubscriptions={setSubscriptions}
            />
          </div>
        )}

        {selectedProduct ? (
          <ProductDetailsDrawer
            product={selectedProduct}
            user={user}
            requests={requests}
            liveSync={liveSync}
            onClose={() => handleProductSelect(null)}
            openLogin={() => setShowAuthModal(true)}
            onSyncRequests={() => syncWithGAS()}
          />
        ) : (
          <div className="space-y-8">
            <div className="relative rounded-2xl overflow-hidden border border-slate-900 bg-slate-950/60 p-6 md:p-10 text-left space-y-4">
              <div className="relative z-10 max-w-2xl space-y-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5" /> High-Fidelity Study Materials
                </div>
                <h1 className="text-2xl md:text-4xl font-black text-white leading-tight tracking-tight uppercase">TyagiHub Education DRM Storefront</h1>
                <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-sans">Compiled by expert educators under Golu Tyagi Ji. Original high-resolution PDF study guides, scalable SVG vectors, and ZIP boilertemplates secured with dynamic client-side DRM.</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-stretch justify-between p-4 bg-slate-900/10 border border-slate-900 rounded-xl">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Physics board papers, layout codes, worksheets..." className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-950 border border-slate-850 text-slate-200 placeholder:text-slate-650 focus:outline-none focus:border-indigo-500" />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="p-2.5 text-xs bg-slate-950 border border-slate-850 text-slate-300 focus:outline-none">
                  <option value="all">All File Types</option>
                  <option value="image">Drawings / Vectors</option>
                  <option value="pdf">PDF Study Notes</option>
                  <option value="zip">ZIP Boilerplates</option>
                  <option value="video">MP4 Video Lectures</option>
                </select>

                <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="p-2.5 text-xs bg-slate-950 border border-slate-850 text-slate-300 focus:outline-none">
                  <option value="all">All Pricing</option>
                  <option value="free">Free Access</option>
                  <option value="premium">Premium Only</option>
                </select>

                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="p-2.5 text-xs bg-slate-950 border border-slate-850 text-slate-300 focus:outline-none">
                  <option value="newest">Newest Listed</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((prod) => (
                  <ProductCard key={prod.id} product={prod} user={user} onSelect={() => handleProductSelect(prod)} />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center border border-dashed border-slate-900 rounded-2xl space-y-3.5 max-w-xl mx-auto">
                <ShoppingBag className="w-10 h-10 text-slate-700 mx-auto" />
                <h3 className="text-xs font-black uppercase text-white tracking-wider">No Assets Match Filters</h3>
                <p className="text-[10px] text-slate-500 leading-normal">Connect Golu's Live Google Sheets Web App URL or edit search inputs.</p>
              </div>
            )}

            <div className="border border-slate-900 bg-slate-950/20 rounded-2xl p-6 text-left max-w-2xl mx-auto space-y-4">
              <div className="space-y-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5"><Clock className="w-4 h-4" /> Student Order Tracker</h3>
                <p className="text-[10px] text-slate-400">Did you make a purchase but lost the tab? Paste your 12-digit Paytm Transaction UTR reference to unlock access!</p>
              </div>

              <form onSubmit={handleOrderTrackSearch} className="flex gap-2">
                <input type="text" value={orderSearchUtr} onChange={(e) => setOrderSearchUtr(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))} placeholder="Paste exact Paytm Transaction UTR..." className="w-full px-3.5 py-2 bg-slate-950 border border-slate-850 text-xs font-mono text-indigo-300 focus:outline-none" required />
                <button type="submit" disabled={trackLoading} className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-200 hover:text-white rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                  {trackLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Track Order"}
                </button>
              </form>

              {trackError && <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-xl text-[10px] text-rose-400 font-mono text-center">{trackError}</div>}

              {trackedOrder && (
                <div className="p-5 bg-slate-950 border border-slate-900 rounded-xl space-y-4">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div className="text-left">
                      <span className="text-[10px] font-mono text-slate-500 block">Asset Title</span>
                      <span className="text-xs font-bold text-white block">{trackedOrder.assetTitle}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${trackedOrder.status === "approved" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 animate-pulse"}`}>{trackedOrder.status}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-900 pt-3 text-[10px] font-mono text-slate-400">
                    <div>
                      <span className="block text-[8px] uppercase tracking-wider text-slate-600">Request ID</span>
                      <span className="text-slate-200">{trackedOrder.id}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] uppercase tracking-wider text-slate-600">Transaction ID (UTR)</span>
                      <span className="text-slate-200">{trackedOrder.transactionId}</span>
                    </div>
                  </div>

                  {trackedOrder.status === "approved" ? (
                    <button
                      onClick={() => {
                        const originalProduct = products.find((p) => p.id === trackedOrder.assetId);
                        if (originalProduct) {
                          handleProductSelect(originalProduct);
                        } else {
                          handleProductSelect({
                            id: trackedOrder.assetId,
                            title: trackedOrder.assetTitle,
                            type: "pdf",
                            price: 39,
                            driveId: trackedOrder.assetId
                          });
                        }
                      }}
                      className="w-full mt-2 py-2.5 bg-emerald-600 text-white font-black uppercase text-xs rounded-xl text-center flex items-center justify-center gap-1.5 shadow-lg"
                    >
                      <CheckCircle2 className="w-4 h-4" /> View Unlocked File Preview
                    </button>
                  ) : (
                    <div className="p-3 bg-yellow-950/10 border border-yellow-900/30 rounded-lg text-[9px] text-yellow-500/90 leading-relaxed font-sans">⏰ Paytm Business automations are listening. Preview will load upon UTR match!</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      <LoginModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {showAdminLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-4 text-slate-200">
            <div className="text-left space-y-1">
              <h3 className="text-xs font-black uppercase text-indigo-400 tracking-wider">Admin Authentication</h3>
              <p className="text-[10px] text-slate-400">Golu Tyagi, enter your private system pin to toggle Store Manager actions.</p>
            </div>

            <form onSubmit={handleAdminAccessSubmit} className="space-y-4">
              <input type="password" value={adminAccessKey} onChange={(e) => setAdminAccessKey(e.target.value)} placeholder="Enter admin pin..." className="w-full p-3 text-xs text-center font-mono tracking-widest bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none" required />
              {adminAccessError && <p className="text-[10px] text-rose-400 font-bold text-center">{adminAccessError}</p>}
              <div className="flex gap-2.5">
                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-md">Verify Access</button>
                <button type="button" onClick={() => setShowAdminLogin(false)} className="px-4 py-2.5 bg-slate-950 border border-slate-800 text-slate-400 text-xs font-bold uppercase rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-8 text-slate-200 my-8">
            
            <div className="flex justify-between items-start border-b border-slate-800 pb-4 text-left">
              <div className="space-y-1">
                <h2 className="text-lg font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5"><Crown className="w-5 h-5 text-amber-400" /> Unlimited Download Pass Membership</h2>
                <p className="text-xs text-slate-400">Bypass separate micro-transactions completely. Download all items directly!</p>
              </div>
              <button onClick={() => { setShowSubModal(false); setSelectedPlan(null); setSubStatus("idle"); setSubMessage(""); }} className="text-slate-400 hover:text-white text-xs font-mono uppercase tracking-widest font-bold cursor-pointer">✕ Close</button>
            </div>

            {!selectedPlan ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch text-left">
                {SUBSCRIPTION_PLANS.map((plan) => (
                  <div key={plan.name} className={`rounded-xl border p-5 flex flex-col justify-between space-y-5 bg-slate-950/30 ${plan.popular ? "border-indigo-500 shadow-xl relative scale-[1.02]" : "border-slate-800"}`}>
                    {plan.popular && <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-widest rounded-full">POPULAR CHOICE</span>}

                    <div className="space-y-3.5">
                      <div className="flex justify-between items-start">
                        <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">{plan.name}</h4>
                        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[8px] font-black uppercase rounded border border-indigo-500/20">{plan.badge}</span>
                      </div>
                      
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-white">₹{plan.price}</span>
                        <span className="text-[10px] text-slate-500">/ user</span>
                      </div>

                      <p className="text-[10px] text-slate-400 leading-normal">{plan.desc}</p>

                      <div className="border-t border-slate-900 pt-3 space-y-2 text-[10px] text-slate-400">
                        {plan.features.map((feat) => (
                          <div key={feat} className="flex items-start gap-1.5"><span className="text-indigo-400">✓</span><span>{feat}</span></div>
                        ))}
                      </div>
                    </div>

                    <button onClick={() => { if (!user) { alert("Please sign in first to link your VIP pass."); setShowAuthModal(true); return; } setSelectedPlan(plan); }} className="w-full py-2 bg-indigo-600 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg shadow cursor-pointer">Choose {plan.name}</button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center text-left max-w-4xl mx-auto border border-indigo-950 bg-slate-950/30 p-6 rounded-2xl">
                <div className="lg:col-span-5 flex flex-col items-center text-center space-y-3">
                  <span className="text-[8px] font-mono font-bold tracking-widest text-slate-500 uppercase">SCAN PAYTM VIP MEMBERSHIP QR</span>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <img src={subQrUrl} alt="Paytm Merchant QR" className="w-36 h-36" />
                  </div>
                  <div className="text-center">
                    <span className="block text-[8px] font-mono text-indigo-400 font-bold select-all">paytmqr28100505010113clkijdlzou@paytm</span>
                    <span className="block text-[8px] font-mono text-slate-500">Amount: ₹{selectedPlan.price} INR</span>
                  </div>
                </div>

                <div className="lg:col-span-7 space-y-5">
                  <div>
                    <span className="text-[8px] font-mono font-bold uppercase text-slate-500 block">SELECTED PLAN</span>
                    <h4 className="text-sm font-black text-white uppercase">{selectedPlan.name} (Valid {selectedPlan.durationDays} Days)</h4>
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal">{selectedPlan.desc}</p>
                  </div>

                  <form onSubmit={handleVIPCheckoutSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="block text-[8px] font-mono uppercase text-slate-500">WhatsApp Number (Optional)</label>
                      <input type="tel" value={subWhatsapp} onChange={(e) => setSubWhatsapp(e.target.value)} placeholder="+91 99999 88888" className="w-full p-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none" />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[8px] font-mono uppercase text-amber-500 font-bold">Paytm Transaction Ref (UTR) / 12-Digit Reference ID</label>
                      <input type="text" value={subPaymentUtr} onChange={(e) => setSubPaymentUtr(e.target.value.replace(/[^0-9]/g, ""))} placeholder="Paste exact 12-digit Paytm reference ID..." maxLength={12} className="w-full p-3 text-xs bg-slate-950 border border-indigo-950 text-slate-200 focus:outline-none text-center font-mono font-black tracking-widest" required />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button type="submit" disabled={subStatus === "submitting"} className="flex-1 py-3 bg-indigo-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-1.5 cursor-pointer">
                        {subStatus === "submitting" ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Unlock Membership Access"}
                      </button>
                      <button type="button" onClick={() => setSelectedPlan(null)} className="px-4 py-3 bg-slate-950 border border-slate-850 text-slate-400 text-xs font-black uppercase tracking-wider rounded-xl">Change Plan</button>
                    </div>
                  </form>

                  {subStatus === "success" && <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-xl text-[10px] text-emerald-400">{subMessage}</div>}
                  {subStatus === "error" && <div className="p-3 bg-rose-950/30 border border-rose-900/50 rounded-xl text-[10px] text-rose-400">{subMessage}</div>}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
