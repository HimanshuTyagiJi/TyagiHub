// 🌐 TyagiHub Test Center Engine — Secure Block Layout Matrix Edition
// Path: /assets/js/test.js

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw9Bz1KhUlIlKgy-lOpiI70oCMm28nbqhoBVUj1eg8uEH2iUcmaDP4Si9OXh0r37wiktg/exec";

document.addEventListener('DOMContentLoaded', () => {
    const quizId = document.body.dataset.quizId;
    if (!quizId) return;

    let currentLang = localStorage.getItem('th-quiz-lang') || 'en';
    let timerInterval;
    let timeTaken = 0;
    let currentQuestionIndex = 0;
    let userAnswers = []; 
    let shuffledIndices = [];

    const quizForm = document.getElementById("quiz-form");
    const startModal = document.getElementById("startModal");
    const resultModal = document.getElementById("resultModal");
    const resultContent = document.getElementById("resultContent");
    const reviewSection = document.getElementById("review-questions");
    const quizSection = document.getElementById("quiz-section");
    const startBtn = document.getElementById("start-btn");

    function getLoggedUser() {
        try {
            const storedUser = localStorage.getItem("tc_user");
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                return {
                    uid: parsed.uid || parsed.e.replace(/[^a-zA-Z0-9]/g, ""), 
                    displayName: parsed.n || "Learner",
                    photoURL: parsed.p || ""
                };
            }
        } catch (e) { }
        return null;
    }

    function syncLanguageUI() {
        const titleEl = document.getElementById('player-dynamic-title');
        const labelTime = document.getElementById('label-time');
        const labelReview = document.getElementById('label-review-title');
        const startTitle = document.getElementById('modal-start-title');
        const resultTitle = document.getElementById('modal-result-title');
        const startBtnEl = document.getElementById('start-btn');
        
        if (titleEl) titleEl.textContent = titleEl.getAttribute(`data-${currentLang}`);
        if (labelTime) labelTime.textContent = labelTime.getAttribute(`data-${currentLang}`);
        if (labelReview) labelReview.textContent = labelReview.getAttribute(`data-${currentLang}`);
        if (startTitle) startTitle.textContent = startTitle.getAttribute(`data-${currentLang}`);
        if (resultTitle) resultTitle.textContent = resultTitle.getAttribute(`data-${currentLang}`);
        if (startBtnEl) startBtnEl.textContent = startBtnEl.getAttribute(`data-${currentLang}`);

        // 🎯 FULLPROOF DOM LOCK: जावास्क्रिप्ट अब innerHTML को हाथ नहीं लगाएगा
        // यह सिर्फ CSS के जरिए लेआउट में बने-बनाए div ब्लॉक्स को ऑन/ऑफ (Show/Hide) करेगा
        const enRules = document.querySelectorAll('.rule-line-item-en');
        const hiRules = document.querySelectorAll('.rule-line-item-hi');
        
        if (currentLang === 'hi') {
            enRules.forEach(el => el.style.setProperty('display', 'none', 'important'));
            hiRules.forEach(el => el.style.setProperty('display', 'block', 'important'));
        } else {
            enRules.forEach(el => el.style.setProperty('display', 'block', 'important'));
            hiRules.forEach(el => el.style.setProperty('display', 'none', 'important'));
        }

        ['player-language-switcher-bar', 'review-language-switcher-bar'].forEach(barId => {
            const bar = document.getElementById(barId);
            if (bar) {
                const btnEn = bar.querySelector('.player-lang-btn[id*="-en"]');
                const btnHi = bar.querySelector('.player-lang-btn[id*="-hi"]');
                if (btnEn && btnHi) {
                    btnEn.classList.toggle('active', currentLang === 'en');
                    btnHi.classList.toggle('active', currentLang === 'hi');
                }
            }
        });
    }

    function initLanguageSwitcher() {
        ['player-language-switcher-bar', 'review-language-switcher-bar'].forEach(barId => {
            const bar = document.getElementById(barId);
            if (bar) {
                const btnEn = bar.querySelector('.player-lang-btn[id*="-en"]');
                const btnHi = bar.querySelector('.player-lang-btn[id*="-hi"]');
                if (btnEn && btnHi) {
                    btnEn.addEventListener('click', () => switchLanguage('en'));
                    btnHi.addEventListener('click', () => switchLanguage('hi'));
                }
            }
        });
        syncLanguageUI();
    }

    function switchLanguage(targetLang) {
        if (currentLang === targetLang) return;
        currentLang = targetLang;
        localStorage.setItem('th-quiz-lang', targetLang);
        syncLanguageUI();
        
        if (quizSection && quizSection.style.display === "block") {
            displayQuestion(currentQuestionIndex);
        } else if (reviewSection && reviewSection.style.display === "block") {
            reviewQuestions();
        } else if (resultModal && resultModal.classList.contains('active')) {
            const scorePayload = resultContent.dataset.lastScore || 0;
            const totalPayload = shuffledIndices.length;
            renderResultContentDOM(parseInt(scorePayload, 10), totalPayload);
            renderResultActionsBlockDOM();
        }
    }

    function startQuiz() {
        if(startModal) startModal.classList.remove('active');
        if(quizSection) quizSection.style.display = "block";
        
        let len = 0;
        if (window.questionsRepo && window.questionsRepo.en) {
            len = window.questionsRepo.en.length;
        }
        
        if (len === 0) {
            const qContainer = document.getElementById('questions-container');
            if(qContainer) qContainer.innerHTML = "<p style='color:red; text-align:center;'>प्रश्नों का डेटा लोड नहीं हो सका।</p>";
            return;
        }

        shuffledIndices = Array.from({length: len}, (_, i) => i);
        shuffledIndices.sort(() => Math.random() - 0.5);
        
        userAnswers = new Array(len).fill(null);
        currentQuestionIndex = 0;

        renderQuizUI();
        startTimer();
    }

    function renderQuizUI() {
        if (!quizForm) return;
        quizForm.innerHTML = `
            <div id="quiz-layout">
                <div id="question-area">
                    <div id="questions-container"></div>
                    <div id="question-navigation-buttons"></div>
                </div>
                <div id="question-palette-container">
                    <div class="palette-header">
                        <h4>${currentLang === 'hi' ? 'प्रश्न सूची' : 'Questions'}</h4>
                        <button class="submit-btn" id="main-submit-btn">${currentLang === 'hi' ? 'सबमिट' : 'Submit'}</button>
                    </div>
                    <div id="question-palette"></div>
                </div>
            </div>
        `;
        
        document.getElementById('main-submit-btn').addEventListener('click', () => {
             const msg = currentLang === 'hi' ? "क्या आप वाकई टेस्ट सबमिट करना चाहते हैं?" : "Are you sure you want to submit the test?";
             if (confirm(msg)) { calculateResult(); }
        });
        displayQuestion(currentQuestionIndex);
    }

    function displayQuestion(index) {
        currentQuestionIndex = index;
        const questionsContainer = document.getElementById('questions-container');
        const navigationContainer = document.getElementById('question-navigation-buttons');
        if (!questionsContainer || !navigationContainer) return;

        const actualIdx = shuffledIndices[index];
        const qEn = window.questionsRepo.en[actualIdx];
        const qActive = window.questionsRepo[currentLang][actualIdx];
        
        const questionHTML = `
            <div class="question-block" id="question-${index}">
                <p class="question">${index + 1}. ${qActive.question}</p>
                <div class="options">
                    ${qEn.options.map((option, optIdx) => {
                        const activeOptionText = qActive.options[optIdx].text;
                        return `
                        <label>
                            <input type="radio" name="question${index}" value="${option.value}" ${userAnswers[index] === option.value ? 'checked' : ''}>
                            <span>${activeOptionText}</span>
                        </label>`;
                    }).join("")}
                </div>
            </div>`;
        questionsContainer.innerHTML = questionHTML;

        questionsContainer.querySelectorAll(`input[name="question${index}"]`).forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    userAnswers[index] = e.target.value;
                    updatePalette();
                }
            });
        });
        
        let labelSkip = currentLang === 'hi' ? 'छोड़ें' : 'Skip';
        let labelNext = currentLang === 'hi' ? 'अगला' : 'Next';
        let labelSubmit = currentLang === 'hi' ? 'सबमिट करें' : 'Submit';

        let navHTML = `<button type="button" class="skip-btn">${labelSkip}</button>`;
        if (index < shuffledIndices.length - 1) {
            navHTML += `<button type="button" class="next-btn">${labelNext}</button>`;
        } else {
            navHTML += `<button type="button" class="submit-btn">${labelSubmit}</button>`;
        }
        navigationContainer.innerHTML = navHTML;

        navigationContainer.querySelector('.skip-btn').addEventListener('click', skipQuestion);
        if (index < shuffledIndices.length - 1) {
            navigationContainer.querySelector('.next-btn').addEventListener('click', nextQuestion);
        } else {
            navigationContainer.querySelector('.submit-btn').addEventListener('click', () => {
                const msg = currentLang === 'hi' ? "क्या आप वाकई टेस्ट सबमिट करना चाहते हैं?" : "Are you sure you want to submit the test?";
                if (confirm(msg)) { calculateResult(); }
            });
        }
        updatePalette();
    }

    function updatePalette() {
        const paletteContainer = document.getElementById('question-palette');
        if (!paletteContainer) return;
        
        let paletteHTML = '';
        for (let i = 0; i < shuffledIndices.length; i++) {
            let statusClass = 'unvisited';
            if (userAnswers[i] === 'skipped') statusClass = 'skipped';
            else if (userAnswers[i] !== null) statusClass = 'answered';

            if (i === currentQuestionIndex) statusClass += ' current';
            paletteHTML += `<div class="palette-item ${statusClass}" data-index="${i}">${i + 1}</div>`;
        }
        paletteContainer.innerHTML = paletteHTML;

        paletteContainer.querySelectorAll('.palette-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index, 10);
                displayQuestion(index);
            });
        });
    }

    function nextQuestion() {
        if (currentQuestionIndex < shuffledIndices.length - 1) {
            displayQuestion(currentQuestionIndex + 1);
        }
    }

    function skipQuestion() {
        userAnswers[currentQuestionIndex] = 'skipped';
        if (currentQuestionIndex < shuffledIndices.length - 1) {
            nextQuestion();
        } else {
            const msg = currentLang === 'hi' ? "यह अंतिम प्रश्न है। क्या आप टेस्ट सबमिट करना चाहते हैं?" : "This is the last question. Are you sure you want to submit the test?";
            if (confirm(msg)) { calculateResult(); }
        }
    }
    
    function startTimer() {
        let seconds = 0;
        const timerClock = document.getElementById("timer-clock");
        timerInterval = setInterval(() => {
            seconds++;
            timeTaken = seconds;
            let min = Math.floor(seconds / 60);
            let sec = seconds % 60;
            if (timerClock) {
                timerClock.textContent = `${min}:${sec < 10 ? "0" + sec : sec}`;
            }
        }, 1000);
    }
    
    function calculateResult() {
        clearInterval(timerInterval);
        let correctCount = 0;
        let incorrectCount = 0;
        let skippedCount = 0;

        shuffledIndices.forEach((actualIdx, index) => {
            const q = window.questionsRepo.en[actualIdx];
            const userAnswer = userAnswers[index];
            if (userAnswer === 'skipped' || userAnswer === null) {
                skippedCount++;
            } else if (userAnswer === q.correctOption) {
                correctCount++;
            } else {
                incorrectCount++;
            }
        });

        const totalQuestions = shuffledIndices.length;
        if(resultContent) resultContent.dataset.lastScore = correctCount;

        if(quizForm) quizForm.innerHTML = ''; 
        renderResultContentDOM(correctCount, totalQuestions, incorrectCount, skippedCount);
        renderResultActionsBlockDOM();
        
        if (resultModal) resultModal.classList.add('active');
        
        const currentUser = getLoggedUser();
        if (currentUser) {
            saveScoreToGoogleSheet(correctCount, totalQuestions, currentUser);
        }
    }

    function renderResultContentDOM(correctCount, totalQuestions, incorrectCount, skippedCount) {
        if (!resultContent) return;
        
        if (incorrectCount === undefined) {
            incorrectCount = 0; skippedCount = 0;
            shuffledIndices.forEach((actualIdx, index) => {
                const q = window.questionsRepo.en[actualIdx];
                const userAnswer = userAnswers[index];
                if (userAnswer === 'skipped' || userAnswer === null) skippedCount++;
                else if (userAnswer !== q.correctOption) incorrectCount++;
            });
        }

        const percentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
        const greenDashArray = `${percentage}, 100`;
        const incorrectPercentageForSVG = totalQuestions > 0 ? (incorrectCount / totalQuestions) * 100 : 0;
        const redDashArray = `${incorrectPercentageForSVG}, 100`;
        const redDashOffset = `-${percentage}`;

        let txtTotal = currentLang === 'hi' ? 'कुल प्रश्न' : 'Total Questions';
        let txtCorrect = currentLang === 'hi' ? 'सही उत्तर' : 'Correct';
        let txtIncorrect = currentLang === 'hi' ? 'गलत उत्तर' : 'Incorrect';
        let txtSkipped = currentLang === 'hi' ? 'छोड़े गए' : 'Skipped';
        let txtTime = currentLang === 'hi' ? 'कुल समय' : 'Total Time';
        let txtMin = currentLang === 'hi' ? 'मिनट' : 'min';
        let txtSec = currentLang === 'hi' ? 'सेकंड' : 'sec';

        resultContent.innerHTML = `
            <div style="text-align: center;">
                <div style="position: relative; width: 150px; height: 150px; margin: 1rem auto;">
                     <svg viewBox="0 0 36 36" style="transform: rotate(-90deg); width: 100%; height: 100%;">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e6e6e6" stroke-width="3"></path>
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--success-color, #28a745)" stroke-width="3" stroke-dasharray="${greenDashArray}"></path>
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--danger-color, #dc3545)" stroke-width="3" stroke-dasharray="${redDashArray}" stroke-dashoffset="${redDashOffset}"></path>
                     </svg>
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 1.5rem; font-weight: bold; color: var(--text-heading) !important;">${percentage.toFixed(2)}%</div>
                </div>
                <p>${txtTotal}: ${totalQuestions}</p>
                <p style="color: var(--success-color, #28a745); font-weight: bold;">${txtCorrect}: ${correctCount}</p>
                <p style="color: var(--danger-color, #dc3545); font-weight: bold;">${txtIncorrect}: ${incorrectCount}</p>
                <p style="color: var(--secondary-color, #6c757d);">${txtSkipped}: ${skippedCount}</p>
                <p>${txtTime}: ${Math.floor(timeTaken / 60)} ${txtMin} ${timeTaken % 60} ${txtSec}</p>
            </div>`;
    }

    function renderResultActionsBlockDOM() {
        const actionsWrap = document.getElementById('modal-result-actions-container');
        if (!actionsWrap) return;

        let labelReview = currentLang === 'hi' ? 'उत्तर देखें' : 'Review Answers';
        let labelRetry = currentLang === 'hi' ? 'पुनः प्रयास' : 'Try Again';
        let labelPrevPart = currentLang === 'hi' ? '← पिछला भाग' : '← Prev Part';
        let labelNextPart = currentLang === 'hi' ? 'अगला भाग →' : 'Next Part →';

        let html = `
            <button id="review-btn" class="skip-btn" style="border-color:var(--clr-border-2); color:var(--text-heading);">${labelReview}</button>
            <button id="retry-btn" class="submit-btn" style="color:#FFFFFF !important;">${labelRetry}</button>
        `;

        if (window.routingConfig && window.routingConfig.prevUrl) {
            html += `<a href="${window.routingConfig.prevUrl}" class="skip-btn" style="text-decoration:none; display:inline-block; border-color:var(--clr-accent); color:var(--clr-accent);">${labelPrevPart}</a>`;
        }
        if (window.routingConfig && window.routingConfig.nextUrl) {
            html += `<a href="${window.routingConfig.nextUrl}" class="submit-btn" style="text-decoration:none; display:inline-block; color:#FFFFFF !important; background:var(--clr-accent);">${labelNextPart}</a>`;
        }
        actionsWrap.innerHTML = html;

        document.getElementById('review-btn').addEventListener('click', reviewQuestions);
        document.getElementById('retry-btn').addEventListener('click', retryQuiz);
    }

    async function saveScoreToGoogleSheet(score, totalQuestions, currentUser) {
        const payload = {
            action: "save_score",
            userId: currentUser.uid,
            userName: currentUser.displayName,
            userPhotoURL: currentUser.photoURL,
            score: score,
            totalQuestions: totalQuestions,
            quizId: quizId
        };
        try {
            await fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } catch (error) { }
    }

    function retryQuiz() { location.reload(); }
    
    function reviewQuestions() {
        if(startModal) startModal.classList.remove('active');
        if(quizSection) quizSection.style.display = "none";
        if(resultModal) resultModal.classList.remove('active');
        
        const revLangBar = document.getElementById('review-language-switcher-bar');
        if (revLangBar) revLangBar.style.display = 'inline-flex';

        const reviewContainer = document.getElementById("review-container");
        let reviewHTML = "";
        if (!shuffledIndices || !userAnswers) return;

        shuffledIndices.forEach((actualIdx, index) => {
            const qActive = window.questionsRepo[currentLang][actualIdx];
            const qEn = window.questionsRepo.en[actualIdx]; 
            const userAnswer = userAnswers[index];
            let labelExp = currentLang === 'hi' ? 'व्याख्या:' : 'Explanation:';

            reviewHTML += `
                <div class="question-block review">
                    <p class="question">${index + 1}. ${qActive.question}</p>
                    <div class="options">
                        ${qEn.options.map((opt, optIdx) => {
                            const isUserAnswer = userAnswer === opt.value;
                            const isOriginalCorrect = opt.value === qEn.correctOption;
                            let className = '';
                            if (isOriginalCorrect) className = 'correct-option';
                            else if (isUserAnswer && !isOriginalCorrect) className = 'incorrect-option';
                            const activeOptionText = qActive.options[optIdx].text;
                            return `<label class="${className}">
                                        <input type="radio" name="review${index}" value="${opt.value}" ${isUserAnswer ? 'checked' : ''} disabled> 
                                        <span>${activeOptionText}</span>
                                    </label>`;
                        }).join('')}
                    </div>
                    <div class="explanation"><strong>${labelExp}</strong> ${qActive.explanation}</div>
                </div>`;
        });

        if(reviewContainer) reviewContainer.innerHTML = reviewHTML;
        
        const reviewActionsTop = document.getElementById('review-actions-top-layer-buttons');
        if(reviewActionsTop) {
            let labelRetry = currentLang === 'hi' ? 'पुनः प्रयास' : 'Test Again';
            let labelPrevPart = currentLang === 'hi' ? '← पिछला भाग' : '← Prev Part';
            let labelNextPart = currentLang === 'hi' ? 'अगला भाग →' : 'Next Part →';
            
            let topHtml = `<button id="review-top-retry-btn" class="submit-btn" style="color:#FFFFFF !important; margin-right:10px;">${labelRetry}</button>`;
            if (window.routingConfig && window.routingConfig.prevUrl) {
                topHtml += `<a href="${window.routingConfig.prevUrl}" class="skip-btn" style="text-decoration:none; display:inline-block; border-color:var(--clr-accent); color:var(--clr-accent); margin-right:10px;">${labelPrevPart}</a>`;
            }
            if (window.routingConfig && window.routingConfig.nextUrl) {
                topHtml += `<a href="${window.routingConfig.nextUrl}" class="submit-btn" style="text-decoration:none; display:inline-block; color:#FFFFFF !important; background:var(--clr-accent);">${labelNextPart}</a>`;
            }
            reviewActionsTop.innerHTML = topHtml;
            document.getElementById('review-top-retry-btn').addEventListener('click', retryQuiz);
        }
        if(reviewSection) reviewSection.style.display = "block";
    }

    if (startBtn) startBtn.addEventListener('click', startQuiz);
    initLanguageSwitcher();
});
