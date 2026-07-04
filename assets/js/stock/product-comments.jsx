import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Trash2, Send, CornerDownRight, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';

const FALLBACK_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzLt6yxrdohBhdhOlxhKwSi1SRL1kr0xEVADmEsHFWyzIaCsuwLyQ4ewFrSE2Bk4Z1l/exec";
const getScriptUrl = () => {
  return localStorage.getItem("tyagihub_gas_url") || FALLBACK_SCRIPT_URL;
};
const ADMIN_EMAIL = "tyagihub.core@gmail.com";

export default function ProductComments({ productUrl, currentUser }) {
  const [comments, setComments] = useState([]);
  const [avgRating, setAvgRating] = useState("0.0");
  const [totalVotes, setTotalVotes] = useState(0);
  const [myRating, setMyRating] = useState(0);
  const [inputText, setInputText] = useState("");
  const [ratingInput, setRatingInput] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    fetchComments();
  }, [productUrl, currentUser]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const emailParam = currentUser ? `&email=${encodeURIComponent(currentUser.email)}` : "";
      const res = await fetch(`${getScriptUrl()}?url=${encodeURIComponent(productUrl)}${emailParam}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
        setAvgRating(data.avgRating || "0.0");
        setTotalVotes(data.totalVotes || 0);
        setMyRating(data.myRating || 0);
      }
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    } finally {
      setLoading(false);
    }
  };

  const submitRating = async (rating) => {
    if (!currentUser) {
      alert("Please sign in or register to rate products.");
      return;
    }
    setMyRating(rating);
    const payload = {
      url: productUrl,
      email: currentUser.email,
      name: currentUser.displayName || currentUser.email.split("@")[0],
      rating: rating,
      comment: "__RATING_ONLY__",
      pic: currentUser.photoURL || "https://tyagihub.in/assets/images/icon-192.png",
      action: "add"
    };
    try {
      await fetch(getScriptUrl(), {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(payload)
      });
      setTimeout(fetchComments, 1000);
    } catch (err) {
      console.error("Failed to submit rating:", err);
    }
  };

  const submitComment = async (e, parentId = "0") => {
    if (e) e.preventDefault();
    if (!currentUser) {
      alert("Please sign in or register to write comments.");
      return;
    }
    const text = parentId === "0" ? inputText.trim() : replyText.trim();
    if (!text) return;

    const payload = {
      url: productUrl,
      email: currentUser.email,
      name: currentUser.displayName || currentUser.email.split("@")[0],
      comment: text,
      parentId: parentId,
      rating: parentId === "0" ? String(ratingInput) : "0",
      pic: currentUser.photoURL || "https://tyagihub.in/assets/images/icon-192.png",
      action: "add"
    };

    const tempComment = {
      rowId: "temp_" + Date.now(),
      name: payload.name,
      comment: text,
      parentId: parentId,
      date: "Just now",
      pic: payload.pic,
      userRating: parentId === "0" ? ratingInput : 0,
      likes: 0,
      dislikes: 0,
      myReaction: "none",
      isAdmin: currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
    };

    setComments(prev => [tempComment, ...prev]);
    if (parentId === "0") {
      setInputText("");
      setRatingInput(0);
    } else {
      setReplyText("");
      setReplyingTo(null);
    }

    try {
      await fetch(getScriptUrl(), {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(payload)
      });
      setTimeout(fetchComments, 1500);
    } catch (err) {
      console.error("Failed to submit comment:", err);
    }
  };

  const deleteComment = async (rowId) => {
    if (!currentUser) return;
    if (!confirm("Are you sure you want to delete this comment?")) return;

    setComments(prev => prev.filter(c => c.rowId !== rowId));

    try {
      await fetch(getScriptUrl(), {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
          action: "delete",
          rowId: rowId,
          email: currentUser.email
        })
      });
      setTimeout(fetchComments, 1000);
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  };

  const handleReaction = async (rowId, reactionType) => {
    if (!currentUser) {
      alert("Please sign in or register to react to comments.");
      return;
    }

    setComments(prev => prev.map(c => {
      if (c.rowId === rowId) {
        let likes = c.likes;
        let dislikes = c.dislikes;
        let myReaction = c.myReaction;

        if (myReaction === reactionType) {
          myReaction = "none";
          if (reactionType === "like") likes--;
          else dislikes--;
        } else {
          if (myReaction === "like") likes--;
          if (myReaction === "dislike") dislikes--;

          myReaction = reactionType;
          if (reactionType === "like") likes++;
          else dislikes++;
        }

        return { ...c, likes, dislikes, myReaction };
      }
      return c;
    }));

    try {
      await fetch(getScriptUrl(), {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
          action: "reaction",
          rowId: rowId,
          email: currentUser.email,
          reactionType: reactionType
        })
      });
    } catch (err) {
      console.error("Failed to post reaction:", err);
    }
  };

  const topLevelComments = comments.filter(c => c.parentId === "0" || !c.parentId);
  const getRepliesFor = (id) => comments.filter(c => c.parentId === id);

  return (
    <div id="product-comments-section" className="border rounded-2xl p-5 md:p-6 space-y-6 bg-slate-900/20 border-slate-900">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-900">
        <div className="space-y-1">
          <h3 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-500" />
            Product Discussion & Reviews
          </h3>
          <p className="text-[11px] text-slate-400">Share your thoughts, ask questions, or rate this digital resource.</p>
        </div>

        {/* Rating Summary Block */}
        <div className="flex items-center gap-3 bg-slate-950/45 border border-slate-900/50 p-2.5 rounded-xl px-4">
          <span className="text-3xl font-black font-mono text-white leading-none">{avgRating}</span>
          <div className="flex flex-col">
            <div className="flex text-amber-400 text-xs tracking-wider">
              {Array.from({ length: 5 }).map((_, idx) => {
                const filled = idx < Math.round(parseFloat(avgRating));
                return <Star key={idx} className={`w-3 h-3 ${filled ? 'fill-amber-400' : 'text-slate-700'}`} />;
              })}
            </div>
            <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider mt-0.5">{totalVotes} verified reviews</span>
          </div>
        </div>
      </div>

      {/* User Quick Rating Row */}
      {currentUser && (
        <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-slate-850 bg-slate-950/20 text-center space-y-1.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your rating for this asset:</p>
          <div className="flex gap-1.5">
            {Array.from({ length: 5 }).map((_, idx) => {
              const ratingVal = idx + 1;
              const active = ratingVal <= (hoveredStar || myRating);
              return (
                <button
                  key={idx}
                  onClick={() => submitRating(ratingVal)}
                  onMouseEnter={() => setHoveredStar(ratingVal)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="transition-transform active:scale-95 cursor-pointer"
                  title={`Rate ${ratingVal} stars`}
                >
                  <Star className={`w-6 h-6 transition-colors ${active ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Write Comment Form */}
      {currentUser ? (
        <form onSubmit={(e) => submitComment(e)} className="space-y-3">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Comment Rating:</p>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, idx) => {
                const val = idx + 1;
                const active = val <= ratingInput;
                return (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setRatingInput(val)}
                    className="text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star className={`w-3.5 h-3.5 ${active ? 'fill-amber-400' : 'text-slate-700'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Join the discussion... Type your review or query here..."
              className="w-full h-20 border rounded-xl p-3 pr-12 text-xs transition-colors bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none font-sans"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="absolute right-3 bottom-3 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-40 disabled:hover:bg-indigo-600 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 rounded-xl border border-dashed border-slate-850 bg-slate-950/40 text-center">
          <p className="text-xs text-slate-400">Please sign in from the sidebar filter panel to join the discussion and post reviews.</p>
        </div>
      )}

      {/* Discussion Feed */}
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
        {loading && comments.length === 0 ? (
          <div className="text-center py-4 text-xs text-slate-500 animate-pulse">Loading discussion logs...</div>
        ) : topLevelComments.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500 border border-dashed border-slate-850 rounded-xl">
            No reviews logged for this product. Be the first to share your experience!
          </div>
        ) : (
          topLevelComments.map((c) => {
            const commentReplies = getRepliesFor(c.rowId);
            const isOwner = currentUser && currentUser.email.toLowerCase() === c.email.toLowerCase();
            const isAdmin = c.isAdmin || c.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

            return (
              <div key={c.rowId} className="space-y-2 border-b pb-4 border-slate-900 last:border-0 last:pb-0">
                {/* Main Comment */}
                <div className="flex items-start gap-3">
                  <img src={c.pic || "https://tyagihub.in/assets/images/icon-192.png"} className="w-8 h-8 rounded-full ring-1 ring-slate-800 shrink-0" alt="" referrerPolicy="no-referrer" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-200">{c.name}</span>
                        {isAdmin && (
                          <span className="bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-[8px] font-black uppercase px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Sparkles className="w-2 h-2 text-indigo-400 animate-pulse" /> Admin
                          </span>
                        )}
                        {parseFloat(c.userRating) > 0 && (
                          <div className="flex text-amber-400 gap-0.5 ml-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-2.5 h-2.5 ${i < Math.round(parseFloat(c.userRating)) ? 'fill-amber-400' : 'text-slate-700'}`} />
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] font-mono text-slate-500">{c.date}</span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-300">{c.comment}</p>

                    {/* Reactions & Actions Row */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleReaction(c.rowId, "like")}
                          className={`flex items-center gap-1 text-[10px] font-bold cursor-pointer transition-colors ${c.myReaction === 'like' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-350'}`}
                        >
                          <ThumbsUp className="w-3 h-3" />
                          <span>{c.likes}</span>
                        </button>
                        <button
                          onClick={() => handleReaction(c.rowId, "dislike")}
                          className={`flex items-center gap-1 text-[10px] font-bold cursor-pointer transition-colors ${c.myReaction === 'dislike' ? 'text-rose-450' : 'text-slate-500 hover:text-slate-350'}`}
                        >
                          <ThumbsDown className="w-3 h-3" />
                          <span>{c.dislikes}</span>
                        </button>
                        {currentUser && (
                          <button
                            onClick={() => {
                              setReplyingTo(replyingTo === c.rowId ? null : c.rowId);
                              setReplyText("");
                            }}
                            className="text-[10px] font-extrabold text-indigo-400 hover:text-indigo-300 uppercase tracking-wide cursor-pointer"
                          >
                            Reply
                          </button>
                        )}
                      </div>
                      {(isOwner || (currentUser && currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase())) && !c.rowId.startsWith("temp_") && (
                        <button
                          onClick={() => deleteComment(c.rowId)}
                          className="text-slate-600 hover:text-rose-400 transition-colors p-1 rounded-md"
                          title="Delete Comment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Inline Reply Input */}
                {replyingTo === c.rowId && (
                  <form onSubmit={(e) => submitComment(e, c.rowId)} className="ml-11 flex gap-2 pt-1">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Reply to ${c.name}...`}
                      className="flex-1 border rounded-xl px-3 py-1.5 text-xs transition-colors bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-sans"
                    />
                    <button
                      type="submit"
                      disabled={!replyText.trim()}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-45 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-wide transition-all shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-2.5 h-2.5" /> Send
                    </button>
                  </form>
                )}

                {/* Sub-Replies List */}
                {commentReplies.length > 0 && (
                  <div className="space-y-2.5 mt-2 ml-11 border-l-2 border-slate-900 pl-4">
                    {commentReplies.map((reply) => {
                      const isReplyOwner = currentUser && currentUser.email.toLowerCase() === reply.email.toLowerCase();
                      const isReplyAdmin = reply.isAdmin || reply.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

                      return (
                        <div key={reply.rowId} className="flex items-start gap-2.5">
                          <CornerDownRight className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-1" />
                          <img src={reply.pic || "https://tyagihub.in/assets/images/icon-192.png"} className="w-6 h-6 rounded-full ring-1 ring-slate-850 shrink-0" alt="" referrerPolicy="no-referrer" />
                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <span className="text-[11px] font-bold text-slate-200">{reply.name}</span>
                                {isReplyAdmin && (
                                  <span className="bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-[7px] font-black uppercase px-1.5 py-0.2 rounded scale-90">
                                    Admin
                                  </span>
                                )}
                              </div>
                              <span className="text-[8px] font-mono text-slate-500">{reply.date}</span>
                            </div>
                            <p className="text-xs leading-normal text-slate-350">{reply.comment}</p>
                            <div className="flex items-center justify-between pt-0.5">
                              <div className="flex items-center gap-2.5">
                                <button
                                  onClick={() => handleReaction(reply.rowId, "like")}
                                  className={`flex items-center gap-0.5 text-[9px] font-bold cursor-pointer transition-colors ${reply.myReaction === 'like' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-350'}`}
                                >
                                  <ThumbsUp className="w-2.5 h-2.5" />
                                  <span>{reply.likes}</span>
                                </button>
                                <button
                                  onClick={() => handleReaction(reply.rowId, "dislike")}
                                  className={`flex items-center gap-0.5 text-[9px] font-bold cursor-pointer transition-colors ${reply.myReaction === 'dislike' ? 'text-rose-450' : 'text-slate-500 hover:text-slate-350'}`}
                                >
                                  <ThumbsDown className="w-2.5 h-2.5" />
                                  <span>{reply.dislikes}</span>
                                </button>
                              </div>
                              {(isReplyOwner || (currentUser && currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase())) && !reply.rowId.startsWith("temp_") && (
                                <button
                                  onClick={() => deleteComment(reply.rowId)}
                                  className="text-slate-600 hover:text-rose-400 transition-colors p-0.5 rounded-md"
                                  title="Delete Reply"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
