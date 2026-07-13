// 🌐 TyagiHub Live Quiz Engine & Google Sheet Core Pipe — Instant Bilingual Sync Edition
// Path: /assets/js/test.js

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw9Bz1KhUlIlKgy-lOpiI70oCMm28nbqhoBVUj1eg8uEH2iUcmaDP4Si9OXh0r37wiktg/exec";

document.addEventListener('DOMContentLoaded', () => {
    const quizId = document.body.dataset.quizId;
    if (!quizId) return;

    // --- Language State Sync Setup ---
    let currentLang = localStorage.getItem('th-quiz-lang') || 'en';

    // --- State Management ---
    let timerInterval;
    let timeTaken = 0;
    let currentQuestionIndex = 0;
    let userAnswers = []; 
    let shuffledIndices = [];

    // --- DOM Elements ---
    const quizForm = document.getElementById("quiz-form");
    const startModal = document.getElementById("startModal");
    const resultModal = document.getElementById("resultModal");
    const resultContent = document.getElementById("resultContent");
    const reviewSection = document.getElementById("review-questions");
    const quizSection = document.getElementById("quiz-section");
    const startBtn = document.getElementById("start-btn");
    const reviewBtn = document.getElementById("review-btn");
    const retryBtn = document.getElementById("retry-btn");
    const reviewRetryBtn = document.getElementById("review-retry-btn");

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
        } catch (e) { console.error("Error reading session:", e); }
        return null;
    }

    // Dynamic localization text sync handler
    function syncLanguageUI() {
        const titleEl = document.getElementById('player-dynamic-title');
        const labelTime = document.getElementById('label-time');
        const labelReview = document.getElementById('label-review-title');
        
        if (titleEl) titleEl.textContent = titleEl.getAttribute(`data-${currentLang}`);
        if (labelTime) labelTime.textContent = labelTime.getAttribute(`data-${currentLang}`);
        if (labelReview) labelReview.textContent = labelReview.getAttribute(`data-${currentLang}`);
        
        // Modal & buttons text rewrite hooks
        document.querySelectorAll('[data-en]').forEach(el => {
            if(el.id !== 'player-dynamic-title' && el.id !== 'label-time' && el.id !== 'label-review-title') {
                el.textContent = el.getAttribute(`data-${currentLang}`);
            }
        });

        // Rules modal text updater
        const rulesUl = document.getElementById('modal-start-rules');
        if (rulesUl) {
            const count = rulesUl.getAttribute('data-count');
            if (currentLang === 'hi') {
                rulesUl.innerHTML = `
                    <li>इस टेस्ट में कुल ${count} महत्वपूर्ण बहुविकल्पीय प्रश्न शामिल हैं।</li>
                    <li>टाइमर सक्रिय टेस्टिंग सेकंड की गणना निरंतर करता रहेगा।</li>
                    <li>एक बार सबमिट करने के बाद, परिणाम लॉक हो जाएंगे।</li>
                    <li>आपका स्कोर लाइव Google Sheets लीडरबोर्ड पर अपडेट किया जाएगा।</li>
                `;
            } else {
                rulesUl.innerHTML = `
                    <li>This test contains ${count} curated questions.</li>
                    <li>The timer tracks cumulative active testing seconds.</li>
                    <li>Once submitted, entries lock cleanly across state lists.</li>
                    <li>Authentication syncing stores metrics into Google Sheets ledger.</li>
                `;
            }
        }

        // Toggle active button style
        const btnEn = document.getElementById('pl-btn-en');
        const btnHi = document.getElementById('pl-btn-hi');
        if(btnEn && btnHi) {
            btnEn.classList.toggle('active', currentLang === 'en');
            btnHi.classList.toggle('active', currentLang === 'hi');
        }
    }

    function initLanguageSwitcher() {
        const btnEn = document.getElementById('pl-btn-en');
        const btnHi = document.getElementById('pl-btn-hi');
        
        if(btnEn && btnHi) {
            btnEn.addEventListener('click', () => switchLanguage('en'));
            btnHi.addEventListener('click', () => switchLanguage('hi'));
        }
        syncLanguageUI();
    }

    function switchLanguage(targetLang) {
        if (currentLang === targetLang) return;
        currentLang = targetLang;
        localStorage.setItem('th-quiz-lang', targetLang);
        
        syncLanguageUI();
        
        // अगर टेस्ट चल रहा है या रिव्यू मोड खुला है, तो यूआई को दोबारा रिफ्रेस करेंगे बिना स्टेट खोए
        if (quizSection && quizSection.style.display === "block") {
            displayQuestion(currentQuestionIndex);
        } else if (reviewSection && reviewSection.style.display === "block") {
            reviewQuestions();
        }
    }

    function startQuiz() {
        if(startModal) startModal.classList.remove('active');
        if(quizSection) quizSection.style.display = "block";
        
        // सवालों के मूल रेपो की साइज के अनुसार इंडेक्स जनरेट करके शफल करना
        const len = window.questionsRepo.en.length;
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
                        <h4 data-en="Questions" data-hi="प्रश्न सूची">${currentLang === 'hi' ? 'प्रश्न सूची' : 'Questions'}</h4>
                        <button class="submit-btn" id="main-submit-btn" data-en="Submit" data-hi="सबमिट करें">${currentLang === 'hi' ? 'सबमिट करें' : 'Submit'}</button>
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

        // करंट एक्टिव भाषा के रेपो से शफल्ड इंडेक्स का सवाल निकालना
        const actualIdx = shuffledIndices[index];
        const q = window.questionsRepo[currentLang][actualIdx];
        
        const questionHTML = `
            <div class="question-block" id="question-${index}">
                <p class="question">${index + 1}. ${q.question}</p>
                <div class="options">
                    ${q.options.map(option => `
                        <label>
                            <input type="radio" name="question${index}" value="${option.value}" ${userAnswers[index] === option.value ? 'checked' : ''}>
                            <span>${option.text}</span>
                        </label>`).join("")}
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
            // सही विकल्प का मिलान बेस इंग्लिश डेटा से ही करेंगे क्योंकि दोनों भाषाओँ का आर्किटेक्चर अलाइन है
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
        const percentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

        const greenDashArray = `${percentage}, 100`;
        const incorrectPercentageForSVG = totalQuestions > 0 ? (incorrectCount / totalQuestions) * 100 : 0;
        const redDashArray = `${incorrectPercentageForSVG}, 100`;
        const redDashOffset = `-${percentage}`;
        
        if(quizForm) quizForm.innerHTML = ''; 

        if (resultContent) {
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
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 1.5rem; font-weight: bold; color: var(--text-color);">${percentage.toFixed(2)}%</div>
                    </div>
                    <p>${txtTotal}: ${totalQuestions}</p>
                    <p style="color: var(--success-color, #28a745); font-weight: bold;">${txtCorrect}: ${correctCount}</p>
                    <p style="color: var(--danger-color, #dc3545); font-weight: bold;">${txtIncorrect}: ${incorrectCount}</p>
                    <p style="color: var(--secondary-color, #6c757d);">${txtSkipped}: ${skippedCount}</p>
                    <p>${txtTime}: ${Math.floor(timeTaken / 60)} ${txtMin} ${timeTaken % 60} ${txtSec}</p>
                </div>`;
        }
        
        if (resultModal) resultModal.classList.add('active');
        
        const currentUser = getLoggedUser();
        if (currentUser) {
            saveScoreToGoogleSheet(correctCount, totalQuestions, currentUser);
        }
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
            console.log("Score cleanly piped to Google Sheet Pipeline Ledger ✅");
        } catch (error) {
            console.error("Network fault pushing score parameters to Google Script Engine:", error);
        }
    }

    function retryQuiz() { location.reload(); }
    
    function reviewQuestions() {
        if(startModal) startModal.classList.remove('active');
        if(quizSection) quizSection.style.display = "none";
        if(resultModal) resultModal.classList.remove('active');
        const reviewContainer = document.getElementById("review-container");

        let reviewHTML = "";
        if (!shuffledIndices || !userAnswers) {
            if(reviewContainer) reviewContainer.innerHTML = "<p>Review data is incomplete.</p>";
            if(reviewSection) reviewSection.style.display = "block";
            return;
        }

        shuffledIndices.forEach((actualIdx, index) => {
            const q = window.questionsRepo[currentLang][actualIdx];
            const qEn = window.questionsRepo.en[actualIdx]; // सही विकल्प का मिलान हमेशा बेस की से होगा
            const userAnswer = userAnswers[index];
            
            let labelExp = currentLang === 'hi' ? 'व्याख्या:' : 'Explanation:';

            reviewHTML += `
                <div class="question-block review">
                    <p class="question">${index + 1}. ${q.question}</p>
                    <div class="options">
                        ${q.options.map(opt => {
                            const isUserAnswer = userAnswer === opt.value;
                            const isOriginalCorrect = opt.value === qEn.correctOption;
                            let className = '';
                            if (isOriginalCorrect) className = 'correct-option';
                            else if (isUserAnswer && !isOriginalCorrect) className = 'incorrect-option';
                            
                            return `<label class="${className}">
                                        <input type="radio" name="review${index}" value="${opt.value}" ${isUserAnswer ? 'checked' : ''} disabled> 
                                        <span>${opt.text}</span>
                                    </label>`;
                        }).join('')}
                    </div>
                    <div class="explanation"><strong>${labelExp}</strong> ${q.explanation}</div>
                </div>`;
        });

        if(reviewContainer) reviewContainer.innerHTML = reviewHTML;
        if(reviewSection) reviewSection.style.display = "block";
    }

    if (startBtn) startBtn.addEventListener('click', startQuiz);
    if (reviewBtn) reviewBtn.addEventListener('click', reviewQuestions);
    if (retryBtn) retryBtn.addEventListener('click', retryQuiz);
    if (reviewRetryBtn) reviewRetryBtn.addEventListener('click', retryQuiz);
    
    initLanguageSwitcher();
});
