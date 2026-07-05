import React from "react";
import { motion } from "motion/react";
import { Crown, ArrowRight } from "lucide-react";
import SecurePreview from "./SecurePreview";
import { resolveThumbnailUrl } from "../utils/drm";

export default function ProductCard({ product, user, onSelect }) {
  const isFree = product.price === 0;
  const hasSubscription = user && user.subscription;
  const surchargedPrice = parseFloat((product.price * 1.15).toFixed(2));

  // Determine complexity level and styling based on product price
  const getComplexityTag = (price) => {
    if (price === 0) {
      return {
        name: "Free Utility",
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      };
    } else if (price <= 19) {
      return {
        name: "Low Complexity SVG",
        color: "text-sky-400 bg-sky-500/10 border-sky-500/20",
      };
    } else if (price <= 39) {
      return {
        name: "Medium Complexity SVG",
        color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
      };
    } else if (price <= 79) {
      return {
        name: "Heavy Complexity SVG",
        color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      };
    } else {
      return {
        name: "High-End Motion SVG",
        color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      };
    }
  };

  const tag = getComplexityTag(product.price);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onSelect}
      className="rounded-xl overflow-hidden transition-all flex flex-col group relative cursor-pointer h-full border bg-slate-900/30 border-slate-900/80 hover:border-slate-800 hover:shadow-lg hover:shadow-indigo-950/10"
    >
      {/* Thumbnail with Secure Watermark Preview */}
      <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
        <SecurePreview
          src={resolveThumbnailUrl(product)}
          alt={product.title}
          isFree={isFree || !!hasSubscription}
          type={product.type}
          className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-300 ${
            isFree ? "" : "contrast-[1.03] brightness-[0.88]"
          }`}
        />
        
        {/* Soft shadow overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 z-20 pointer-events-none" />

        {/* Floating Category/Status Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-30 items-start">
          <span
            className={`px-2 py-0.5 text-[9px] font-mono font-black uppercase rounded tracking-wider border ${
              isFree
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : hasSubscription
                ? "bg-gradient-to-r from-amber-500 to-indigo-600 text-white border-indigo-500/25 shadow-sm font-bold animate-pulse"
                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
            }`}
          >
            {isFree ? "Free Access" : hasSubscription ? "👑 Sub Unlocked" : "Premium File"}
          </span>
          <span className={`px-1.5 py-0.5 text-[8px] font-extrabold uppercase rounded border ${tag.color}`}>
            {tag.name}
          </span>
        </div>

        {/* Asset metadata badge */}
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-slate-950/95 px-2 py-0.5 rounded text-[9px] font-mono text-slate-300 border border-slate-850 z-30 font-bold uppercase">
          {product.type} • {product.size || "KB"}
        </div>
      </div>

      {/* Product Information and Description */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5 transition-colors bg-slate-950/20">
        <div className="space-y-1.5 flex-1 text-left">
          <h3
            className="text-xs font-bold leading-relaxed transition-colors line-clamp-2 text-white group-hover:text-indigo-400"
            title={product.title}
          >
            {product.title}
          </h3>
          {product.description && (
            <p className="text-[10px] line-clamp-2 leading-normal transition-colors text-slate-400">
              {product.description}
            </p>
          )}
        </div>

        {/* Price and Claim CTA Button */}
        <div className="flex items-center justify-between pt-3 mt-auto border-t border-slate-900/60">
          <div>
            <p className="text-[8px] font-mono uppercase tracking-widest text-slate-500 text-left">PRICE</p>
            {isFree ? (
              <p className="text-xs font-mono font-black text-emerald-500 text-left">FREE</p>
            ) : hasSubscription ? (
              <p className="text-xs font-mono font-black text-emerald-400 flex items-center gap-1 text-left">
                <Crown className="w-3 h-3 text-amber-400" /> ₹0 (VIP Pass)
              </p>
            ) : user ? (
              <p className="text-xs font-mono font-black text-indigo-300 text-left">
                ₹{product.price} <span className="text-[9px] font-normal text-slate-500">(Base)</span>
              </p>
            ) : (
              <div className="flex flex-col text-left">
                <p className="text-xs font-mono font-black text-amber-500">
                  ₹{surchargedPrice}{" "}
                  <span className="text-[9px] font-bold text-rose-500/80">(Surcharged)</span>
                </p>
                <p className="text-[8px] text-slate-500 leading-none">
                  VIP Members: ₹{product.price}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-0.5 text-[10px] font-bold transition-colors text-indigo-400 group-hover:text-indigo-300">
            <span>{isFree || hasSubscription ? "Get Now" : "Claim Now"}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
