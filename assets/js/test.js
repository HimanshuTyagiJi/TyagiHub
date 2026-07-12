// 🌐 TyagiHub Live Quiz Engine & Google Sheet Core Pipe
// Path: /assets/js/test.js

// Connected cleanly to your newly deployed auto-injecting Apps Script URL
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw9Bz1KhUlIlKgy-lOpiI70oCMm28nbqhoBVUj1eg8uEH2iUcmaDP4Si9OXh0r37wiktg/exec";

document.addEventListener('DOMContentLoaded', () => {
    const quizId = document.body.dataset.quizId;
    if (!quizId) return;

    // --- State Management ---
    let timerInterval;
    let timeTaken = 0;
    let currentQuestionIndex = 0;
    let userAnswers = []; 
    let shuffledQuestions = [];

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

    // 🎯 REPLACED FIREBASE AUTH WITH NATIVE LOCALSTORAGE LOGGED-IN USER MATRIX
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
        } catch (e) {
            console.error("Error reading local login session:", e);
        }
        return null;
    }

    function startQuiz() {
        if(startModal) startModal.classList.remove('active');
        if(quizSection) quizSection.style.display = "block";
        
        shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);
        userAnswers = new Array(shuffledQuestions.length).fill(null);
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
                        <h4>Questions</h4>
                        <button class="submit-btn" id="main-submit-btn" title="Submit Test">Submit</button>
                    </div>
                    <div id="question-palette"></div>
                </div>
            </div>
        `;
        
        document.getElementById('main-submit-btn').addEventListener('click', () => {
             if (confirm("Are you sure you want to submit the test?")) {
                calculateResult();
            }
        });

        displayQuestion(currentQuestionIndex);
    }

    function displayQuestion(index) {
        currentQuestionIndex = index;
        const questionsContainer = document.getElementById('questions-container');
        const navigationContainer = document.getElementById('question-navigation-buttons');
        if (!questionsContainer || !navigationContainer) return;

        const q = shuffledQuestions[index];
        
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
        
        let navHTML = `<button type="button" class="skip-btn">Skip</button>`;
        if (index < shuffledQuestions.length - 1) {
            navHTML += `<button type="button" class="next-btn">Next</button>`;
        } else {
            navHTML += `<button type="button" class="submit-btn">Submit</button>`;
        }
        navigationContainer.innerHTML = navHTML;

        navigationContainer.querySelector('.skip-btn').addEventListener('click', skipQuestion);
        if (index < shuffledQuestions.length - 1) {
            navigationContainer.querySelector('.next-btn').addEventListener('click', nextQuestion);
        } else {
            navigationContainer.querySelector('.submit-btn').addEventListener('click', () => {
                if (confirm("Are you sure you want to submit the test?")) {
                    calculateResult();
                }
            });
        }

        updatePalette();
    }

    function updatePalette() {
        const paletteContainer = document.getElementById('question-palette');
        if (!paletteContainer) return;
        
        let paletteHTML = '';
        for (let i = 0; i < shuffledQuestions.length; i++) {
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
        if (currentQuestionIndex < shuffledQuestions.length - 1) {
            displayQuestion(currentQuestionIndex + 1);
        }
    }

    function skipQuestion() {
        userAnswers[currentQuestionIndex] = 'skipped';
        if (currentQuestionIndex < shuffledQuestions.length - 1) {
            nextQuestion();
        } else {
            if (confirm("This is the last question. Are you sure you want to submit the test?")) {
                calculateResult();
            }
        }
    }
    
    function startTimer() {
        let seconds = 0;
        const timerElement = document.getElementById("timer");
        timerInterval = setInterval(() => {
            seconds++;
            timeTaken = seconds;
            let min = Math.floor(seconds / 60);
            let sec = seconds % 60;
            if (timerElement) {
                timerElement.innerHTML = `<strong>Time:</strong> ${min}:${sec < 10 ? "0" + sec : sec}`;
            }
        }, 1000);
    }
    
    function calculateResult() {
        clearInterval(timerInterval);
        let correctCount = 0;
        let incorrectCount = 0;
        let skippedCount = 0;

        shuffledQuestions.forEach((q, index) => {
            const userAnswer = userAnswers[index];
            if (userAnswer === 'skipped' || userAnswer === null) {
                skippedCount++;
            } else if (userAnswer === q.correctOption) {
                correctCount++;
            } else {
                incorrectCount++;
            }
        });

        const totalQuestions = shuffledQuestions.length;
        const percentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

        const greenDashArray = `${percentage}, 100`;
        const incorrectPercentageForSVG = totalQuestions > 0 ? (incorrectCount / totalQuestions) * 100 : 0;
        const redDashArray = `${incorrectPercentageForSVG}, 100`;
        const redDashOffset = `-${percentage}`;
        
        if(quizForm) quizForm.innerHTML = ''; 

        if (resultContent) {
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
                    <p>Total Questions: ${totalQuestions}</p>
                    <p style="color: var(--success-color, #28a745); font-weight: bold;">Correct: ${correctCount}</p>
                    <p style="color: var(--danger-color, #dc3545); font-weight: bold;">Incorrect: ${incorrectCount}</p>
                    <p style="color: var(--secondary-color, #6c757d);">Skipped: ${skippedCount}</p>
                    <p>Total Time: ${Math.floor(timeTaken / 60)} min ${timeTaken % 60} sec</p>
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
        if (!shuffledQuestions || !userAnswers) {
            if(reviewContainer) reviewContainer.innerHTML = "<p>Review data is incomplete.</p>";
            if(reviewSection) reviewSection.style.display = "block";
            return;
        }

        shuffledQuestions.forEach((q, index) => {
            const userAnswer = userAnswers[index];
            reviewHTML += `
                <div class="question-block review">
                    <p class="question">${index + 1}. ${q.question}</p>
                    <div class="options">
                        ${q.options.map(opt => {
                            const isUserAnswer = userAnswer === opt.value;
                            const isOriginalCorrect = opt.value === q.correctOption;
                            let className = '';
                            if (isOriginalCorrect) className = 'correct-option';
                            else if (isUserAnswer && !isOriginalCorrect) className = 'incorrect-option';
                            
                            return `<label class="${className}">
                                        <input type="radio" name="review${index}" value="${opt.value}" ${isUserAnswer ? 'checked' : ''} disabled> 
                                        <span>${opt.text}</span>
                                    </label>`;
                        }).join('')}
                    </div>
                    <div class="explanation"><strong>Explanation:</strong> ${q.explanation}</div>
                </div>`;
        });

        if(reviewContainer) reviewContainer.innerHTML = reviewHTML;
        if(reviewSection) reviewSection.style.display = "block";
    }

    if (startBtn) startBtn.addEventListener('click', startQuiz);
    if (reviewBtn) reviewBtn.addEventListener('click', reviewQuestions);
    if (retryBtn) retryBtn.addEventListener('click', retryQuiz);
    if (reviewRetryBtn) reviewRetryBtn.addEventListener('click', retryQuiz);
    
    if(startModal) startModal.classList.add('active');
});
