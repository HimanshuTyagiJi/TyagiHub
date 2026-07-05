import React, { useState } from "react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile, 
  GoogleAuthProvider,  
  signInWithPopup 
} from "firebase/auth";
import { auth } from "/assets/js/stock/services/firebase.js";

export default function LoginModal({ isOpen, onClose }) {
  const [tab, setTab] = useState("login"); // "login" | "register"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (tab === "register" && !name.trim()) {
      setError("कृपया अपना पूरा नाम दर्ज करें। (Please enter your full name.)");
      setLoading(false);
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError("ईमेल और पासवर्ड आवश्यक हैं। (Email and Password are required.)");
      setLoading(false);
      return;
    }

    try {
      if (tab === "register") {
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          email.trim(), 
          password.trim()
        );
        await updateProfile(userCredential.user, { 
          displayName: name.trim() 
        });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password.trim());
      }
      
      // Reset state and close
      setName("");
      setEmail("");
      setPassword("");
      onClose();
    } catch (err) {
      console.error("Firebase Auth Error:", err);
      let errMsg = err.message;
      
      if (err.code === "auth/email-already-in-use") {
        errMsg = "यह ईमेल पहले से ही उपयोग में है। (This email is already registered.)";
      } else if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        errMsg = "गलत ईमेल या पासवर्ड। कृपया पुनः प्रयास करें। (Incorrect email or password.)";
      } else if (err.code === "auth/weak-password") {
        errMsg = "पासवर्ड कम से कम 6 अक्षरों का होना चाहिए। (Password must be at least 6 characters.)";
      } else if (err.code === "auth/invalid-email") {
        errMsg = "कृपया एक मान्य ईमेल दर्ज करें। (Please enter a valid email.)";
      }
      
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      onClose();
    } catch (err) {
      console.error("Google Sign-In Error:", err);
      if (err.code !== "auth/popup-closed-by-user") {
        setError(err.message || "Google लॉगिन विफल रहा। (Google Login failed.)");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-6 md:p-8 space-y-6 text-slate-200">
        
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex gap-4">
            <button
              onClick={() => {
                setTab("login");
                setError("");
              }}
              className={`text-sm font-black uppercase tracking-wider pb-1.5 border-b-2 transition-all ${
                tab === "login" 
                  ? "border-indigo-500 text-white" 
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setTab("register");
                setError("");
              }}
              className={`text-sm font-black uppercase tracking-wider pb-1.5 border-b-2 transition-all ${
                tab === "register" 
                  ? "border-indigo-500 text-white" 
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Sign Up
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xs uppercase tracking-widest font-mono font-bold"
          >
            ✕ Close
          </button>
        </div>

        {error && (
          <div className="p-3.5 text-xs text-rose-400 bg-rose-950/30 border border-rose-900/50 rounded-xl leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === "register" && (
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">
                Full Name (पूरा नाम)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Golu Tyagi"
                className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">
              Email Address (ईमेल पता)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">
              Password (पासवर्ड)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer text-xs"
          >
            {loading ? (
              <div className="w-4 h-4 rounded-full border border-indigo-400 border-t-white animate-spin" />
            ) : tab === "login" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-3 text-[10px] font-mono uppercase text-slate-500 tracking-widest">
            Or
          </span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg"
            className="w-4 h-4"
            alt="Google logo"
          />
          Continue with Google
        </button>

      </div>
    </div>
  );
}
