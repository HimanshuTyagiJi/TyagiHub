/**
 * TyagiHub GK Quiz Player
 * File: assets/js/gk-quiz-player.js
 * ============================================================
 * Style: GKLearnStudy — saare questions list mein dikhte hain
 * Ek page pe max 25 questions, next page ke liye pagination
 * Koi Skip/Next button nahi — scroll karo, click karo
 * ============================================================
 */

'use strict';

(function() {

  /* ---- Config ---- */
  const PER_PAGE = 25;

  /* ---- State ---- */
  let allQuestions = [];
  let answered     = {}; // { globalIndex: optionIndex }
  let currentPage  = 1;
  let totalPages   = 1;

  /* ---- Init ---- */
  function init() {
    const jsonUrl = window.QUIZ_JSON_URL;
    if (!jsonUrl) { showError('Quiz data URL missing.'); return; }

    showLoading(true);

    fetch(jsonUrl)
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(data => {
        allQuestions = data.questions || [];
        if (!allQuestions.length) { showError('No questions found.'); return; }

        totalPages  = Math.max(1, Math.ceil(allQuestions.length / PER_PAGE));
        currentPage = getPageFromURL();

        showLoading(false);
        renderPage();
        initSidebar();
      })
      .catch(err => {
        showError('Could not load questions. Error: ' + err.message);
      });
  }

  /* ---- URL helpers ---- */
  function getPageFromURL() {
    const p = parseInt(new URLSearchParams(location.search).get('page')) || 1;
    return Math.min(Math.max(p, 1), totalPages);
  }

  function setPageInURL(p) {
    const url = new URL(location.href);
    if (p === 1) url.searchParams.delete('page');
    else         url.searchParams.set('page', p);
    history.pushState({}, '', url);
  }

  /* ---- Render full page of questions ---- */
  function renderPage() {
    const wrap = document.getElementById('quiz-questions-wrap');
    if (!wrap) return;

    const start  = (currentPage - 1) * PER_PAGE;
    const end    = Math.min(start + PER_PAGE, allQuestions.length);
    const pageQs = allQuestions.slice(start, end);

    // Update header meta
    const metaEl = document.getElementById('quiz-total-count');
    if (metaEl) metaEl.textContent = allQuestions.length;

    const pageMetaEl = document.getElementById('quiz-page-info');
    if (pageMetaEl) {
      pageMetaEl.textContent = totalPages > 1
        ? `Page ${currentPage} of ${totalPages} · Q${start+1}–Q${end}`
        : `${allQuestions.length} Questions`;
    }

    // Build all question cards
    wrap.innerHTML = pageQs.map((q, localIdx) => {
      const gIdx = start + localIdx;
      return buildQuestionCard(q, gIdx, localIdx);
    }).join('');

    // Restore any already-answered states
    Object.entries(answered).forEach(([gIdxStr, chosenOpt]) => {
      const gIdx = parseInt(gIdxStr);
      if (gIdx >= start && gIdx < end) {
        applyAnswer(gIdx, chosenOpt, allQuestions[gIdx].ans);
      }
    });

    renderPagination();
    updateScoreBar();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---- Build one question card ---- */
  function buildQuestionCard(q, gIdx, localIdx) {
    const start = (currentPage - 1) * PER_PAGE;
    const qNum  = start + localIdx + 1;
    const keys  = ['A', 'B', 'C', 'D'];

    const optsHtml = q.opts.map((opt, i) => `
      <button class="quiz-opt"
              id="opt-${gIdx}-${i}"
              onclick="QuizPlayer.answer(${gIdx}, ${i})"
              aria-label="Option ${keys[i]}: ${opt.replace(/"/g,"'")}">
        <span class="quiz-opt__key">${keys[i]}</span>
        <span class="quiz-opt__text">${opt}</span>
      </button>
    `).join('');

    return `
      <div class="quiz-qcard" id="qcard-${gIdx}" data-gidx="${gIdx}">
        <div class="quiz-qcard__num">
          <span class="quiz-qcard__badge">Q${qNum}</span>
        </div>
        <div class="quiz-qcard__question">${q.q}</div>
        <div class="quiz-qcard__opts" id="opts-${gIdx}">
          ${optsHtml}
        </div>
        <div class="quiz-qcard__exp" id="exp-${gIdx}">
          <span class="quiz-qcard__exp-label">💡 Explanation</span>
          <span class="quiz-qcard__exp-text">${q.exp || ''}</span>
        </div>
      </div>
    `;
  }

  /* ---- Handle answer click ---- */
  function answer(gIdx, chosenOpt) {
    // Already answered? Ignore
    if (answered[gIdx] !== undefined) return;

    const q = allQuestions[gIdx];
    if (!q) return;

    answered[gIdx] = chosenOpt;
    applyAnswer(gIdx, chosenOpt, q.ans);
    updateScoreBar();
  }

  /* ---- Apply visual state to answered question ---- */
  function applyAnswer(gIdx, chosenOpt, correctOpt) {
    const q = allQuestions[gIdx];

    // Disable all options for this question
    for (let i = 0; i < 4; i++) {
      const btn = document.getElementById(`opt-${gIdx}-${i}`);
      if (!btn) continue;
      btn.disabled = true;

      if (i === correctOpt) {
        btn.classList.add('correct');
      } else if (i === chosenOpt && chosenOpt !== correctOpt) {
        btn.classList.add('wrong');
      } else {
        btn.classList.add('dimmed');
      }
    }

    // Show explanation
    const expEl = document.getElementById(`exp-${gIdx}`);
    if (expEl && q.exp) {
      expEl.classList.add('show');
    }

    // Add result indicator to card
    const card = document.getElementById(`qcard-${gIdx}`);
    if (card) {
      card.classList.add(chosenOpt === correctOpt ? 'answered-correct' : 'answered-wrong');
    }
  }

  /* ---- Score bar ---- */
  function updateScoreBar() {
    let correct = 0, wrong = 0;
    Object.entries(answered).forEach(([gIdx, chosen]) => {
      const q = allQuestions[parseInt(gIdx)];
      if (!q) return;
      if (chosen === q.ans) correct++;
      else wrong++;
    });

    const el = document.getElementById('quiz-score-correct');
    const el2 = document.getElementById('quiz-score-wrong');
    const el3 = document.getElementById('quiz-score-total');
    if (el)  el.textContent  = correct;
    if (el2) el2.textContent = wrong;
    if (el3) el3.textContent = Object.keys(answered).length;
  }

  /* ---- Pagination ---- */
  function renderPagination() {
    const el = document.getElementById('quiz-pagination');
    if (!el) return;

    if (totalPages <= 1) {
      el.innerHTML = '';
      return;
    }

    let html = `<button class="quiz-pg-btn" onclick="QuizPlayer.goPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>← Prev</button>`;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
        html += `<button class="quiz-pg-btn ${i === currentPage ? 'active' : ''}" onclick="QuizPlayer.goPage(${i})">${i}</button>`;
      } else if (Math.abs(i - currentPage) === 2) {
        html += `<span class="quiz-pg-dots">…</span>`;
      }
    }

    html += `<button class="quiz-pg-btn" onclick="QuizPlayer.goPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next →</button>`;
    el.innerHTML = html;
  }

  function goPage(p) {
    if (p < 1 || p > totalPages) return;
    currentPage = p;
    setPageInURL(p);
    renderPage();
  }

  /* ---- Loading / Error states ---- */
  function showLoading(show) {
    const el = document.getElementById('quiz-loading');
    if (el) el.style.display = show ? 'flex' : 'none';
  }

  function showError(msg) {
    showLoading(false);
    const el = document.getElementById('quiz-questions-wrap');
    if (el) el.innerHTML = `<div class="quiz-error">⚠️ ${msg}</div>`;
  }

  /* ---- Sidebar toggle ---- */
  function initSidebar() {
    const toggle  = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('quiz-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const closeBtn= document.getElementById('sidebar-close');

    function open()  { sidebar?.classList.add('open'); overlay?.classList.add('open'); document.body.style.overflow='hidden'; }
    function close() { sidebar?.classList.remove('open'); overlay?.classList.remove('open'); document.body.style.overflow=''; }

    toggle?.addEventListener('click', open);
    overlay?.addEventListener('click', close);
    closeBtn?.addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  /* ---- Keyboard shortcuts ---- */
  document.addEventListener('keydown', e => {
    if (document.activeElement?.tagName === 'INPUT') return;
    // Find last unanswered visible question
    const start = (currentPage - 1) * PER_PAGE;
    const end   = Math.min(start + PER_PAGE, allQuestions.length);
    for (let gIdx = start; gIdx < end; gIdx++) {
      if (answered[gIdx] === undefined) {
        const map = { a:0, b:1, c:2, d:3, A:0, B:1, C:2, D:3 };
        if (e.key in map) {
          answer(gIdx, map[e.key]);
        }
        break;
      }
    }
  });

  /* ---- Expose globally ---- */
  window.QuizPlayer = { answer, goPage };

  /* ---- Boot ---- */
  document.addEventListener('DOMContentLoaded', init);

})();