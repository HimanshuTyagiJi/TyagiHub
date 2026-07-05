import React, { useState, useEffect } from "react";
import { SCRIPT_URL } from "../services/api";

export default function ProductComments({ product, user, openLogin }) {
  const [comments, setComments] = useState([]);
  const [tempLocal, setTempLocal] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentRating, setCurrentRating] = useState(0);
  const [avgRating, setAvgRating] = useState("0.0");
  const [totalVotes, setTotalVotes] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [replyToId, setReplyToId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const [hoveredStars, setHoveredStars] = useState(0);

  const getPageUrl = () => {
    return window.location.pathname + window.location.search;
  };

  const sync = async () => {
    try {
      const emailParam = user ? "&email=" + encodeURIComponent(user.email) : "";
      const url = `${SCRIPT_URL}?url=${encodeURIComponent(getPageUrl())}${emailParam}`;
      const response = await fetch(url);
      const data = await response.json();
      setComments(data.comments || []);
      setTempLocal([]);
      if (user && data.myRating > 0) {
        setCurrentRating(data.myRating);
      }
      setAvgRating(data.avgRating || "0.0");
      setTotalVotes(data.totalVotes || 0);
    } catch (e) {
      console.error("Error syncing comments:", e);
    }
  };

  useEffect(() => {
    sync();
    const interval = setInterval(() => {
      if (!isTyping) sync();
    }, 15000);
    return () => clearInterval(interval);
  }, [product, user, isTyping]);

  const handleStar = async (rating) => {
    if (!user) {
      openLogin();
      return;
    }
    setCurrentRating(rating);
    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
          url: getPageUrl(),
          email: user.email,
          name: user.displayName,
          rating: rating,
          comment: "__RATING_ONLY__",
        }),
      });
      setTimeout(sync, 1500);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePostComment = async () => {
    if (!user) {
      openLogin();
      return;
    }
    const msg = newComment.trim();
    if (!msg) return;

    const tempId = "temp_" + Date.now();
    setTempLocal((prev) => [
      ...prev,
      {
        rowId: tempId,
        name: user.displayName,
        comment: msg,
        parentId: "0",
        pic: user.photoURL || "https://tyagihub.in/assets/images/icon-192.png",
        date: "Saving...",
        pending: true,
        isAdmin: false,
        email: user.email,
      },
    ]);
    setNewComment("");

    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
          url: getPageUrl(),
          name: user.displayName,
          email: user.email,
          pic: user.photoURL || "https://tyagihub.in/assets/images/icon-192.png",
          comment: msg,
          parentId: "0",
          rating: currentRating,
        }),
      });
      setTimeout(sync, 1500);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePostReply = async (parentId) => {
    if (!user) {
      openLogin();
      return;
    }
    const msg = replyText.trim();
    if (!msg) return;

    const tempId = "temp_" + Date.now();
    setTempLocal((prev) => [
      ...prev,
      {
        rowId: tempId,
        name: user.displayName,
        comment: msg,
        parentId: String(parentId),
        pic: user.photoURL || "https://tyagihub.in/assets/images/icon-192.png",
        date: "Saving...",
        pending: true,
        isAdmin: false,
        email: user.email,
      },
    ]);
    setReplyText("");
    setReplyToId(null);
    setIsTyping(false);

    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
          url: getPageUrl(),
          name: user.displayName,
          email: user.email,
          pic: user.photoURL || "https://tyagihub.in/assets/images/icon-192.png",
          comment: msg,
          parentId: String(parentId),
          rating: currentRating,
        }),
      });
      setTimeout(sync, 1500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateComment = async (rowId, parentId) => {
    if (!user) {
      openLogin();
      return;
    }
    const msg = editText.trim();
    if (!msg) return;

    setComments((prev) =>
      prev.map((c) =>
        c.rowId == rowId ? { ...c, comment: msg, date: "Updating..." } : c
      )
    );
    setEditText("");
    setEditId(null);
    setIsTyping(false);

    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
          action: "edit",
          rowId: rowId,
          url: getPageUrl(),
          name: user.displayName,
          email: user.email,
          pic: user.photoURL || "https://tyagihub.in/assets/images/icon-192.png",
          comment: msg,
          parentId: String(parentId),
          rating: currentRating,
        }),
      });
      setTimeout(sync, 1500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteComment = async (rowId) => {
    if (
      !confirm(
        "Are you sure you want to delete this comment permanently? (क्या आप वाकई इस टिप्पणी को स्थायी रूप से हटाना चाहते हैं?)"
      )
    )
      return;
    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
          action: "delete",
          rowId: rowId,
          email: user.email,
        }),
      });
      setTimeout(sync, 1000);
    } catch (e) {
      console.error(e);
    }
  };

  const renderCard = (c, allList) => {
    const isReply = c.parentId !== "0";
    const canEdit = user && user.email.toLowerCase() === c.email.toLowerCase();
    const hasStars = c.userRating > 0;

    return (
      <div
        key={c.rowId}
        className={`p-4 border-b border-slate-900 transition-opacity ${
          isReply ? "ml-8 pl-4 border-l-2 border-slate-800 bg-slate-950/25" : ""
        } ${c.pending ? "opacity-60 border-l-3 border-amber-500" : ""}`}
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <img
              src={c.pic}
              className="w-8 h-8 rounded-full object-cover border border-slate-800"
              onError={(e) => {
                e.target.src = "https://tyagihub.in/assets/images/icon-192.png";
              }}
              alt={c.name}
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-200">{c.name}</span>
                {c.isAdmin && (
                  <span className="text-[9px] bg-indigo-600 text-white font-mono font-bold px-1.5 py-0.5 rounded shadow">
                    ADMIN ⭐
                  </span>
                )}
              </div>
              {hasStars && (
                <span className="text-amber-400 text-xs tracking-wider">
                  {"★".repeat(c.userRating)}
                </span>
              )}
            </div>
          </div>
          <small className="text-[11px] font-mono text-slate-500">{c.date}</small>
        </div>
        <div className="mt-2.5 ml-10 text-xs leading-relaxed text-slate-300 whitespace-pre-wrap text-left">
          {c.comment}
        </div>
        <div className="mt-2 ml-10 flex items-center gap-4 text-[11px] font-bold uppercase tracking-wider text-indigo-400 select-none">
          <span
            className="hover:text-indigo-300 cursor-pointer text-left"
            onClick={() => {
              if (!user) {
                openLogin();
                return;
              }
              setIsTyping(true);
              setReplyToId(c.rowId);
              setReplyText("");
              setEditId(null);
            }}
          >
            Reply
          </span>
          {canEdit && (
            <span
              className="hover:text-indigo-300 cursor-pointer text-left"
              onClick={() => {
                setIsTyping(true);
                setEditId(c.rowId);
                setEditText(c.comment);
                setReplyToId(null);
              }}
            >
              Edit
            </span>
          )}
          {canEdit && (
            <span
              className="hover:text-rose-400 text-rose-500 cursor-pointer text-left"
              onClick={() => handleDeleteComment(c.rowId)}
            >
              Delete
            </span>
          )}
        </div>

        {replyToId === c.rowId && (
          <div className="mt-3 ml-10 space-y-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply... (उत्तर लिखें...)"
              className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none h-16"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setReplyToId(null);
                  setIsTyping(false);
                }}
                className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold text-slate-400 hover:text-white cursor-pointer bg-slate-900 border border-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePostReply(c.rowId)}
                className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg cursor-pointer"
              >
                Reply
              </button>
            </div>
          </div>
        )}

        {editId === c.rowId && (
          <div className="mt-3 ml-10 space-y-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 resize-none h-16"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setEditId(null);
                  setIsTyping(false);
                }}
                className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold text-slate-400 hover:text-white cursor-pointer bg-slate-900 border border-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateComment(c.rowId, c.parentId)}
                className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg cursor-pointer"
              >
                Update
              </button>
            </div>
          </div>
        )}

        {allList
          .filter((r) => String(r.parentId) === String(c.rowId))
          .map((r) => renderCard(r, allList))}
      </div>
    );
  };

  const combined = comments.concat(tempLocal);
  const mains = combined.filter((c) => String(c.parentId) === "0");
  const displayStars = hoveredStars > 0 ? hoveredStars : currentRating;

  return (
    <div className="border rounded-2xl overflow-hidden w-full shadow-2xl transition-colors bg-slate-900 border-slate-800/60 p-6 md:p-8 space-y-6 text-slate-200 mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1.5 text-left">
          <h3 className="text-base font-extrabold text-white uppercase tracking-wider">
            Discussion & Reviews
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-white">{avgRating}</span>
            <div className="flex flex-col">
              <div className="text-amber-400 text-xs tracking-wider">
                {"★".repeat(Math.round(parseFloat(avgRating)))}
                {"☆".repeat(5 - Math.round(parseFloat(avgRating)))}
              </div>
              <span className="text-[10px] text-slate-500 font-mono text-left">
                {totalVotes} reviews
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center sm:items-end gap-1 p-3 rounded-xl bg-slate-950 border border-slate-850">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
            Tap stars to rate this page
          </span>
          <div
            className="flex items-center gap-1.5 text-xl select-none cursor-pointer"
            onMouseLeave={() => setHoveredStars(0)}
          >
            {[1, 2, 3, 4, 5].map((num) => (
              <span
                key={num}
                className={`transition-all duration-150 hover:scale-110 ${
                  num <= displayStars ? "text-amber-400" : "text-slate-700"
                }`}
                onMouseEnter={() => setHoveredStars(num)}
                onClick={() => handleStar(num)}
              >
                ★
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <textarea
          value={newComment}
          onChange={(e) => {
            setNewComment(e.target.value);
            setIsTyping(e.target.value.length > 0);
          }}
          placeholder="Join the discussion or ask a question about this product..."
          className="w-full p-4 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none h-20"
        />
        <div className="flex justify-end items-center gap-3">
          {!user && (
            <p className="text-[11px] text-slate-400 font-mono">
              Login required to post a review.
            </p>
          )}
          <button
            onClick={handlePostComment}
            className="px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
          >
            Post Comment
          </button>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto rounded-xl border border-slate-900 bg-slate-950/25 scrollbar-thin divide-y divide-slate-900">
        {mains.length > 0 ? (
          mains.map((m) => renderCard(m, combined))
        ) : (
          <div className="p-8 text-center text-xs text-slate-500 font-mono space-y-1">
            <p>No reviews or questions yet.</p>
            <p className="text-[10px] text-slate-600">
              Be the first to share your thoughts!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
