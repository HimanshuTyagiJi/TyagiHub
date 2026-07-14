// 🌐 TyagiHub Test Center & Leaderboard Synchronizer Engine — FIXED STRUCTURE EDITION
// Path: /assets/js/test-hub.js

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw9Bz1KhUlIlKgy-lOpiI70oCMm28nbqhoBVUj1eg8uEH2iUcmaDP4Si9OXh0r37wiktg/exec";

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
    } catch (e) { console.error("Error reading login:", e); }
    return null;
}

async function initializeTestHub() {
    const testCategory = document.body.dataset.testCategory;
    if (!testCategory) {
        console.error("Fatal: 'data-test-category' attribute is missing from <body>.");
        return;
    }

    const leaderboardContainer = document.getElementById('leaderboard-container');
    const testPartsContainer = document.getElementById('test-parts-container');
    const isCategoryPage = testCategory !== 'all';
    const currentUser = getLoggedUser();

    // Set User Name UI Header
    const isHindi = window.pageLangConfig === "hi";
    const nameEl = document.getElementById('hub-user-name');
    if (nameEl && currentUser) {
        nameEl.textContent = (isHindi ? "यूजर: " : "Learner: ") + currentUser.displayName;
    }

    // --- Part 1: Handle Google Sheets Based Leaderboard ---
    if (leaderboardContainer) {
        leaderboardContainer.innerHTML = '<div class="luxury-spinner"><i class="fas fa-spinner fa-spin" style="font-size:26px;"></i></div>';
        try {
            let fetchUrl = `${GOOGLE_SCRIPT_URL}?action=get_leaderboard&quizId=${testCategory}`;
            if (currentUser) { fetchUrl += `&userId=${currentUser.uid}`; }

            const response = await fetch(fetchUrl);
            const data = await response.json();
            const leaderboardData = data.leaderboard || [];
            const userLiveRank = data.myRating || 0;

            renderLeaderboard(leaderboardData, testCategory, userLiveRank, currentUser);
        } catch (error) {
            console.error("Error loading leaderboard:", error);
            leaderboardContainer.innerHTML = "<p style='color:var(--text-muted); text-align:center;'>The leaderboard could not be retrieved from database ledger.</p>";
        }
    }

    // --- Part 2: Handle Live Score Updates & Local Metric Sync Engine ---
    if (isCategoryPage && testPartsContainer && currentUser) {
        await updateUserTestStatus(testCategory, currentUser);
    }
}

function renderLeaderboard(topScores, category, userLiveRank, currentUser) {
    const leaderboardContainer = document.getElementById('leaderboard-container');
    if (!leaderboardContainer) return;

    if (topScores.length === 0) {
        const message = category === 'all' 
            ? "No scores have been recorded in the Google Sheet yet. Be the first to take a test!"
            : "No scores have been recorded in this category yet.";
        leaderboardContainer.innerHTML = `<p style='color:var(--text-muted); text-align:center; padding:10px;'>${message}</p>`;
        return;
    }

    let leaderboardHTML = '<ol class="tc-leaderboard">';
    topScores.forEach((scoreData, index) => {
        const isCurrentUser = currentUser && currentUser.uid === scoreData.userId;
        const displayName = isCurrentUser ? "You" : scoreData.userName;
        const avatar = scoreData.userPhotoURL || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23ddd"/></svg>';
        
        let finalPct = scoreData.averagePercentage;
        if (finalPct <= 1 && finalPct > 0) { finalPct = finalPct * 100; }

        leaderboardHTML += `
            <li class="${isCurrentUser ? 'active-user-row' : ''}">
                <div class="rank">${index + 1}</div>
                <div class="lb-avatar-frame">
                    <img src="${avatar}" alt="${scoreData.userName}" style="width:100%; height:100%; object-fit:cover;" loading="lazy">
                </div>
                <div class="lb-name">${displayName}</div>
                <div class="lb-score">${finalPct.toFixed(2)}%</div>
            </li>
        `;
    });
    leaderboardHTML += '</ol>';

    let userRankHTML = '';
    if (currentUser && category === 'all' && userLiveRank > topScores.length) {
        const userAvatar = currentUser.photoURL || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23ddd"/></svg>';
        const myActiveRecord = topScores[userLiveRank - 1];
        
        let myPercentageStr = "0.00%";
        if (myActiveRecord) {
            let myPct = myActiveRecord.averagePercentage;
            if (myPct <= 1 && myPct > 0) { myPct = myPct * 100; }
            myPercentageStr = myPct.toFixed(2) + "%";
        }

        userRankHTML = `
            <div class="user-rank-display" style="margin-top:20px; border-top:2px dashed var(--clr-border); padding-top:15px;">
                <h3 style="font-family:var(--font-display); font-size:15px; margin-bottom:10px; color:var(--clr-accent);">Your Overall Rank</h3>
                <ol class="tc-leaderboard">
                    <li class="active-user-row">
                        <div class="rank">${userLiveRank}</div>
                        <div class="lb-avatar-frame"><img src="${userAvatar}" style="width:100%; height:100%; object-fit:cover;"></div>
                        <div class="lb-name">You</div>
                        <div class="lb-score">${myPercentageStr}</div>
                    </li>
                </ol>
            </div>
        `;
    }
    
    leaderboardContainer.innerHTML = leaderboardHTML + userRankHTML;
}

// 🎯 SAFE THEME UPDATER WITH INTER-CATEGORY STATS AND METRICS CALCULATION
async function updateUserTestStatus(category, currentUser) {
    const testPartsContainer = document.getElementById('test-parts-container');
    const tbody = document.getElementById('hub-score-table-body');
    const playedEl = document.getElementById('analytics-total-played');
    const accuracyEl = document.getElementById('analytics-avg-accuracy');
    const scoreEl = document.getElementById('analytics-total-score');

    if (!currentUser || !testPartsContainer) return;

    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=get_user_status&userId=${currentUser.uid}`);
        const latestScoresMap = await response.json();

        let totalScore = 0;
        let playedCount = 0;
        let tableRowsHtml = "";
        const isHindi = window.pageLangConfig === "hi";

        testPartsContainer.querySelectorAll('.box[data-quiz-id]').forEach((box, i) => {
            const quizId = box.dataset.quizId;
            if (latestScoresMap && latestScoresMap[quizId]) {
                playedCount++;
                const scoreData = latestScoresMap[quizId];
                const numericScore = parseInt(scoreData.score, 10) || 0;
                totalScore += numericScore;

                const accuracyPercentage = ((numericScore / parseInt(scoreData.totalQuestions, 10)) * 100).toFixed(2);
                const displayLabel = (isHindi ? "टेस्ट - " : "Test - ") + ((i + 1) < 10 ? "0" + (i + 1) : (i + 1));

                // 1. Injected safely as clean info block element underneath anchor tags text node
                let scoreBadge = box.querySelector('.js-live-score-badge');
                if (!scoreBadge) {
                    scoreBadge = document.createElement('div');
                    scoreBadge.className = 'js-live-score-badge';
                    scoreBadge.style.fontSize = '12px';
                    scoreBadge.style.marginTop = '4px';
                    scoreBadge.style.color = 'var(--text-paragraph)';
                    scoreBadge.style.opacity = '0.8';
                    box.appendChild(scoreBadge);
                }
                scoreBadge.innerHTML = `<strong>Latest Score:</strong> ${numericScore} / ${scoreData.totalQuestions}`;

                // 2. Add structural matrix record row to analytics profile panel list
                tableRowsHtml += `
                    <tr style="border-bottom: 1px solid var(--clr-border); color: var(--text-paragraph);">
                        <td style="padding: 12px; font-weight: 600;">${displayLabel}</td>
                        <td style="padding: 12px; font-weight: bold; color: var(--clr-accent);">${numericScore} / ${scoreData.totalQuestions}</td>
                        <td style="padding: 12px; color: #28a745; font-weight: 600;">${accuracyPercentage}%</td>
                    </tr>
                `;
            }
        });

        // Sync and render compiled dashboard data metrics arrays cleanly
        if (playedCount > 0) {
            if (tbody) tbody.innerHTML = tableRowsHtml;
            if (playedEl) playedEl.textContent = playedCount;
            if (scoreEl) scoreEl.textContent = totalScore;
            if (accuracyEl) {
                accuracyEl.textContent = ((totalScore / (playedCount * 25)) * 100).toFixed(2) + "%";
            }
        }
    } catch (error) {
        console.error("Error updating user test status:", error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeTestHub();
});

window.addEventListener('pageshow', (event) => {
    if (event.persisted) { initializeTestHub(); }
});
