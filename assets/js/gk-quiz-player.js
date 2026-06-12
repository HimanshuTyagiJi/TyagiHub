/**
 * TyagiHub GK Quiz - Interactive Quiz JS
 * Handles: option selection, correct/wrong reveal, explanation display,
 *          answer persistence (sessionStorage), lang-sync, mobile sidebar
 */

(function () {
  'use strict';

  // ------------------------------------------------------------------
  // CONSTANTS
  // ------------------------------------------------------------------
  const STORAGE_KEY_PREFIX = 'tyagihub_quiz_';
  const CURRENT_PAGE_KEY   = 'tyagihub_current_page';

  // ------------------------------------------------------------------
  // UTILS
  // ------------------------------------------------------------------
  function getPageId() {
    // Use the canonical path as the unique page identifier
    return window.location.pathname;
  }

  function loadPageAnswers() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY_PREFIX + getPageId());
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }

  function savePageAnswers(answers) {
    try {
      sessionStorage.setItem(STORAGE_KEY_PREFIX + getPageId(), JSON.stringify(answers));
    } catch (e) {}
  }

  // ------------------------------------------------------------------
  // QUIZ CORE
  // ------------------------------------------------------------------
  function initQuiz() {
    const savedAnswers = loadPageAnswers();

    document.querySelectorAll('.question-card').forEach(function (card) {
      const qIdx     = card.dataset.qindex;
      const correct  = card.dataset.correct;
      const options  = card.querySelectorAll('.option-btn');
      const expBox   = card.querySelector('.explanation-box');

      // Restore saved state
      if (savedAnswers[qIdx] !== undefined) {
        applyAnswer(card, options, expBox, correct, savedAnswers[qIdx], false);
      }

      // Attach click handlers
      options.forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (card.dataset.answered === 'true') return; // lock once answered
          const chosen = btn.dataset.option;
          // save
          savedAnswers[qIdx] = chosen;
          savePageAnswers(savedAnswers);
          applyAnswer(card, options, expBox, correct, chosen, true);
        });
      });
    });
  }

  function applyAnswer(card, options, expBox, correct, chosen, animate) {
    card.dataset.answered = 'true';

    options.forEach(function (btn) {
      btn.disabled = true;
      if (btn.dataset.option === correct) {
        btn.classList.add('correct');
      } else if (btn.dataset.option === chosen && chosen !== correct) {
        btn.classList.add('wrong');
      }
    });

    if (expBox) {
      expBox.classList.add('show');
      if (animate) {
        expBox.style.opacity = '0';
        expBox.style.transform = 'translateY(8px)';
        requestAnimationFrame(function () {
          expBox.style.transition = 'opacity .3s ease, transform .3s ease';
          expBox.style.opacity = '1';
          expBox.style.transform = 'translateY(0)';
        });
      }
    }

    // Update live score strip if present
    updateScoreStrip();
  }

  function updateScoreStrip() {
    const strip = document.getElementById('score-strip');
    if (!strip) return;

    const cards   = document.querySelectorAll('.question-card[data-answered="true"]');
    

    // Count correct selections
    let correctCount = 0;
    document.querySelectorAll('.question-card').forEach(function (card) {
      if (card.dataset.answered !== 'true') return;
      const correctBtn = card.querySelector('.option-btn.correct');
      // check if user selected correct (correct btn also has 'correct' class only when user selected it OR it's revealed)
      // We differentiate: if wrong class exists on a DIFFERENT option, user was wrong
      const hasWrong = card.querySelector('.option-btn.wrong');
      if (!hasWrong) correctCount++; // no wrong means user picked correct
    });

    const total    = document.querySelectorAll('.question-card').length;
    const answered = document.querySelectorAll('.question-card[data-answered="true"]').length;

    strip.querySelector('.score-correct').textContent  = correctCount;
    strip.querySelector('.score-answered').textContent = answered;
    strip.querySelector('.score-total').textContent    = total;
  }

  // ------------------------------------------------------------------
  // LANGUAGE SYNC
  // ------------------------------------------------------------------
  /**
   * When user switches language, we try to detect which question they
   * were on and auto-tick the same question index on the equivalent
   * page in the other language.
   *
   * Implementation:
   * - Each lang-switch link carries data-sync-target (URL of counterpart page)
   * - On click we write the current page's answers to sessionStorage under
   *   a SHARED cross-page key so the target page can read it on load.
   * - When a quiz page loads, it checks if cross-page answers exist for the
   *   SAME question indices and applies them.
   *
   * Answers are stored per question INDEX (position), so Q3 in English maps
   * to Q3 in Hindi regardless of content difference.
   *
   * Data is scoped to sessionStorage → clears on tab close / new tab.
   * When user navigates to ANY OTHER page (not lang counterpart), old session
   * data stays but is keyed per page-path so it doesn't bleed.
   */

  const LANG_SYNC_KEY = 'tyagihub_lang_sync';

  function initLangSync() {
    // On page load: check if sync data exists from a lang switch
    try {
      const syncRaw = sessionStorage.getItem(LANG_SYNC_KEY);
      if (!syncRaw) return;
      const sync = JSON.parse(syncRaw);
      // Only apply once to target page
      if (sync.target !== getPageId()) return;

      // Merge into this page's answers
      const myAnswers = loadPageAnswers();
      let changed = false;
      Object.keys(sync.answers).forEach(function (idx) {
        if (myAnswers[idx] === undefined) {
          myAnswers[idx] = sync.answers[idx];
          changed = true;
        }
      });
      if (changed) savePageAnswers(myAnswers);

      // Clean up sync key after consuming
      sessionStorage.removeItem(LANG_SYNC_KEY);
    } catch (e) {}
  }

  function bindLangSwitchSync() {
    // Lang switch links inside sidebar and header
    document.querySelectorAll('[data-lang-switch]').forEach(function (link) {
      link.addEventListener('click', function () {
        const target = link.dataset.langSwitch; // target page path
        if (!target) return;
        // Save current answers to sync key
        const answers = loadPageAnswers();
        try {
          sessionStorage.setItem(LANG_SYNC_KEY, JSON.stringify({
            target: target,
            answers: answers
          }));
        } catch (e) {}
        // Track current page so we know we came from a lang switch
        sessionStorage.setItem(CURRENT_PAGE_KEY, getPageId());
      });
    });
  }

  // ------------------------------------------------------------------
  // MOBILE SIDEBAR
  // ------------------------------------------------------------------
  function initMobileSidebar() {
    const toggle  = document.getElementById('menuToggle');
    const sidebar = document.getElementById('gkSidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (!toggle || !sidebar) return;

    function openSidebar() {
      sidebar.classList.add('open');
      if (overlay) overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      toggle.setAttribute('aria-expanded', 'true');
    }

    function closeSidebar() {
      sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('active');
      document.body.style.overflow = '';
      toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', function () {
      sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
    });

    if (overlay) overlay.addEventListener('click', closeSidebar);

    // Close on ESC
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeSidebar();
    });
  }

  // ------------------------------------------------------------------
  // INIT
  // ------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', function () {
    initLangSync();   // must run before initQuiz so answers are merged
    initQuiz();
    bindLangSwitchSync();
    initMobileSidebar();
  });

})();
