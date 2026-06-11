/**
 * TyagiHub — GK Quiz JavaScript
 * File: assets/js/gk-quiz.js
 * ============================================================
 * Features:
 *  1. Language toggle (English/Hindi)
 *  2. Category search
 *  3. Quiz player (load JSON, show questions, score)
 *  4. Keyboard shortcuts (A/B/C/D, Next, Prev)
 *  5. Results screen
 * ============================================================
 */

'use strict';

/* ============================================================
   1. LANGUAGE TOGGLE (Hub page)
   ============================================================ */
const LangToggle = (() => {
  const STORAGE_KEY = 'th-quiz-lang';
  let lang = localStorage.getItem(STORAGE_KEY) || 'en';

  function apply() {
    document.querySelectorAll('.lang-toggle__btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    // Show/hide language sections
    document.querySelectorAll('[data-lang-section]').forEach(el => {
      el.style.display = el.dataset.langSection === lang ? '' : 'none';
    });

    // Update hreflang canonical hint in URL
    // (actual hreflang is in page <head>)
  }

  function init() {
    apply();
    document.querySelectorAll('.lang-toggle__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        lang = btn.dataset.lang;
        localStorage.setItem(STORAGE_KEY, lang);
        apply();
      });
    });
  }

  function getLang() { return lang; }

  return { init, getLang };
})();

/* ============================================================
   2. CATEGORY SEARCH (Hub page)
   ============================================================ */
const QuizSearch = (() => {
  function init() {
    const input = document.getElementById('quiz-search-input');
    if (!input) return;

    input.addEventListener('input', () => {
      const q = input.value.toLowerCase().trim();
      document.querySelectorAll('.quiz-cat-card').forEach(card => {
        const name = card.querySelector('.quiz-cat-card__name')?.textContent.toLowerCase() || '';
        card.style.display = (!q || name.includes(q)) ? '' : 'none';
      });

      // Hide section if all cards hidden
      document.querySelectorAll('[data-lang-section]').forEach(section => {
        if (section.style.display === 'none') return;
        const visible = [...section.querySelectorAll('.quiz-cat-card')]
          .some(c => c.style.display !== 'none');
        section.closest('.quiz-section').style.display = visible ? '' : 'none';
      });
    });
  }

  return { init };
})();

/* ============================================================
   3. QUIZ PLAYER
   ============================================================ */
const QuizPlayer = (() => {
  let questions   = [];
  let currentIdx  = 0;
  let answered    = []; // null | 'correct' | 'wrong' | 'skip'
  let lang        = 'en';
  let score       = 0;

  // DOM refs
  const progressFill   = document.getElementById('quiz-progress-fill');
  const progressLabel  = document.getElementById('quiz-progress-label');
  const questionNum    = document.getElementById('quiz-question-num');
  const questionText   = document.getElementById('quiz-question-text');
  const optionsWrap    = document.getElementById('quiz-options');
  const explanation    = document.getElementById('quiz-explanation');
  const explanationTxt = document.getElementById('quiz-explanation-text');
  const resultScreen   = document.getElementById('quiz-result');
  const scoreDisplay   = document.getElementById('quiz-score-display');
  const scoreCorrect   = document.getElementById('score-correct');
  const scoreWrong     = document.getElementById('score-wrong');
  const scoreSkip      = document.getElementById('score-skip');
  const totalDisplay   = document.getElementById('quiz-total');
  const nextBtn        = document.getElementById('quiz-next-btn');
  const prevBtn        = document.getElementById('quiz-prev-btn');
  const skipBtn        = document.getElementById('quiz-skip-btn');
  const restartBtn     = document.getElementById('quiz-restart-btn');

  /* ---- Load questions from data attribute ---- */
  async function loadQuestions() {
    const el = document.getElementById('quiz-data');
    if (!el) return;

    const dataFile = el.dataset.file; // e.g. "/assets/quiz-data/history.json" but we use _data
    // Questions are embedded as JSON in the page via Jekyll
    const raw = el.textContent.trim();
    if (!raw) return;

    try {
      const data  = JSON.parse(raw);
      questions   = data.questions || [];
      answered    = new Array(questions.length).fill(null);
      lang        = localStorage.getItem('th-quiz-lang') || 'en';
      renderQuestion(0);
    } catch(e) {
      console.error('Quiz data parse error', e);
    }
  }

  /* ---- Render question ---- */
  function renderQuestion(idx) {
    if (!questions.length) return;
    currentIdx = idx;
    const q = questions[idx];
    if (!q) return;

    const total = questions.length;
    const pct   = ((idx) / total) * 100;

    // Progress
    if (progressFill)  progressFill.style.width = pct + '%';
    if (progressLabel) {
      progressLabel.innerHTML = `
        <span>Question ${idx + 1} of ${total}</span>
        <span>Score: ${score}/${total}</span>
      `;
    }

    // Question
    if (questionNum)  questionNum.textContent  = `Q${idx + 1}`;
    if (questionText) questionText.textContent = lang === 'hi' ? q.q_hi : q.q_en;

    // Options
    if (optionsWrap) {
      const opts = lang === 'hi' ? q.opts_hi : q.opts_en;
      const keys = ['A', 'B', 'C', 'D'];
      optionsWrap.innerHTML = opts.map((opt, i) => `
        <button class="quiz-option ${getOptionClass(idx, i)}"
                data-idx="${i}"
                ${answered[idx] !== null ? 'disabled' : ''}
                onclick="QuizPlayer.selectOption(${i})">
          <span class="quiz-option__key">${keys[i]}</span>
          ${opt}
        </button>
      `).join('');
    }

    // Explanation
    if (answered[idx] !== null) {
      const exp = lang === 'hi' ? q.exp_hi : q.exp_en;
      if (explanation)    explanation.classList.add('visible');
      if (explanationTxt) explanationTxt.textContent = exp;
    } else {
      if (explanation)    explanation.classList.remove('visible');
    }

    // Buttons
    if (prevBtn) prevBtn.disabled = idx === 0;
    if (nextBtn) nextBtn.textContent = idx === total - 1 ? (lang === 'hi' ? 'परिणाम देखें' : 'See Results') : (lang === 'hi' ? 'अगला →' : 'Next →');
    if (skipBtn) skipBtn.style.display = answered[idx] !== null ? 'none' : '';
  }

  function getOptionClass(qIdx, optIdx) {
    if (answered[qIdx] === null) return '';
    const q = questions[qIdx];
    if (optIdx === q.answer) return 'correct';
    if (answered[qIdx] === optIdx) return 'wrong';
    return '';
  }

  /* ---- Select option ---- */
  function selectOption(optIdx) {
    if (answered[currentIdx] !== null) return;
    const q = questions[currentIdx];
    answered[currentIdx] = optIdx;

    if (optIdx === q.answer) {
      score++;
    }

    renderQuestion(currentIdx);
    updateScoreBar();
  }

  function updateScoreBar() {
    const correct = answered.filter(a => {
      if (a === null) return false;
      return questions[answered.indexOf(a)]?.answer === a;
    }).length;
    // Simple count
    const c = answered.filter((a, i) => a !== null && a === questions[i]?.answer).length;
    const w = answered.filter((a, i) => a !== null && a !== questions[i]?.answer).length;
    const s = answered.filter(a => a === 'skip').length;
    if (scoreCorrect) scoreCorrect.textContent = c;
    if (scoreWrong)   scoreWrong.textContent   = w;
    if (scoreSkip)    scoreSkip.textContent     = s;
  }

  /* ---- Navigation ---- */
  function nextQuestion() {
    if (currentIdx >= questions.length - 1) {
      showResult();
      return;
    }
    renderQuestion(currentIdx + 1);
  }

  function prevQuestion() {
    if (currentIdx <= 0) return;
    renderQuestion(currentIdx - 1);
  }

  function skipQuestion() {
    if (answered[currentIdx] === null) {
      answered[currentIdx] = 'skip';
    }
    nextQuestion();
  }

  /* ---- Result screen ---- */
  function showResult() {
    const total   = questions.length;
    const correct = answered.filter((a, i) => a !== null && a !== 'skip' && a === questions[i]?.answer).length;
    const wrong   = answered.filter((a, i) => a !== null && a !== 'skip' && a !== questions[i]?.answer).length;
    const skipped = answered.filter(a => a === 'skip' || a === null).length;
    const pct     = Math.round((correct / total) * 100);

    const playerArea = document.getElementById('quiz-player-area');
    if (playerArea) playerArea.style.display = 'none';
    if (resultScreen) resultScreen.classList.add('visible');

    if (scoreDisplay) scoreDisplay.textContent = `${correct}/${total}`;
    if (totalDisplay) totalDisplay.textContent = `${pct}%`;
    if (scoreCorrect) scoreCorrect.textContent = correct;
    if (scoreWrong)   scoreWrong.textContent   = wrong;
    if (scoreSkip)    scoreSkip.textContent     = skipped;

    // Emoji based on score
    const icon = document.getElementById('quiz-result-icon');
    if (icon) {
      if (pct >= 80)      icon.textContent = '🏆';
      else if (pct >= 60) icon.textContent = '👍';
      else if (pct >= 40) icon.textContent = '📚';
      else                icon.textContent = '💪';
    }

    // Message
    const msg = document.getElementById('quiz-result-msg');
    if (msg) {
      if (lang === 'hi') {
        msg.textContent = pct >= 80 ? 'शानदार! बहुत अच्छा प्रदर्शन।' :
                          pct >= 60 ? 'अच्छा प्रयास! और अभ्यास करें।' :
                          'और मेहनत करें। आप कर सकते हैं!';
      } else {
        msg.textContent = pct >= 80 ? 'Excellent! Great performance.' :
                          pct >= 60 ? 'Good attempt! Keep practicing.' :
                          'Keep trying! You can do better.';
      }
    }
  }

  /* ---- Keyboard shortcuts ---- */
  function initKeyboard() {
    document.addEventListener('keydown', e => {
      if (!questions.length) return;
      const map = { 'a': 0, 'b': 1, 'c': 2, 'd': 3,
                    'A': 0, 'B': 1, 'C': 2, 'D': 3 };
      if (e.key in map && answered[currentIdx] === null) {
        selectOption(map[e.key]);
      }
      if (e.key === 'ArrowRight' || e.key === 'Enter') nextQuestion();
      if (e.key === 'ArrowLeft')  prevQuestion();
    });
  }

  /* ---- Init ---- */
  function init() {
    loadQuestions();
    initKeyboard();

    nextBtn?.addEventListener('click',    nextQuestion);
    prevBtn?.addEventListener('click',    prevQuestion);
    skipBtn?.addEventListener('click',    skipQuestion);
    restartBtn?.addEventListener('click', () => location.reload());
  }

  return { init, selectOption };
})();

window.QuizPlayer = QuizPlayer;

/* ============================================================
   4. INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  LangToggle.init();
  QuizSearch.init();

  // Only init player if on quiz player page
  if (document.getElementById('quiz-player-area')) {
    QuizPlayer.init();
  }
});
