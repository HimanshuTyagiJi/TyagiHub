// 🌐 TyagiHub Test Center & Leaderboard Synchronizer Engine
// Path: /assets/js/test-hub.js

import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

// Connected cleanly to your Google Apps Script URL
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwr8_llEQIDs_5kNWV-PL3diYZB2OYJ_sJzEVSs0JzAJiwgUDOHVEdBtU55AFgkgCFHwQ/exec";

// 🎯 CORRECTED: Synced strictly with default.html layout credentials
const firebaseConfig = {
    apiKey: "AIzaSyBE0uXhh8ePOQH6FBdhRCZrRgRkUTwCWws",
    authDomain: "tyagi-hub.firebaseapp.com",
    projectId: "tyagi-hub",
    storageBucket: "tyagi-hub.firebasestorage.app",
    messagingSenderId: "1052184634573",
    appId: "1:1052184634573:web:077135d1bc4f321688b584"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
let currentUser = null;

function resetCategoryPageUI() {
    const testPartsContainer = document.getElementById('test-parts-container');
    if (!testPartsContainer) return;
    testPartsContainer.querySelectorAll('.box[data-quiz-id]').forEach(box => {
        if (box.dataset.originalHtml) {
            box.innerHTML = box.dataset.originalHtml;
        }
    });
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

    // --- Part 1: Handle Google Sheets Based Leaderboard ---
    if (leaderboardContainer) {
        leaderboardContainer.innerHTML = '<div class="luxury-spinner"><i class="fas fa-spinner fa-spin" style="font-size:26px;"></i></div>';
        try {
            let fetchUrl = `${GOOGLE_SCRIPT_URL}?action=get_leaderboard&quizId=${testCategory}`;
            if (currentUser) {
                fetchUrl += `&userId=${currentUser.uid}`;
            }

            const response = await fetch(fetchUrl);
            const data = await response.json();
            const leaderboardData = data.leaderboard || [];
            const userLiveRank = data.myRating || 0;

            renderLeaderboard(leaderboardData, testCategory, userLiveRank);
        } catch (error) {
            console.error(`Error loading leaderboard from Google Sheet for '${testCategory}':`, error);
            leaderboardContainer.innerHTML = "<p style='color:var(--text-muted); text-align:center;'>The leaderboard could not be retrieved from database ledger.</p>";
        }
    }

    // --- Part 2: Handle User-Specific Score Boxes from Google Sheets ---
    if (isCategoryPage && testPartsContainer) {
        resetCategoryPageUI();
        if (currentUser) {
            await updateUserTestStatus(testCategory);
        }
    }
}

function renderLeaderboard(topScores, category, userLiveRank) {
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
        
        leaderboardHTML += `
            <li class="${isCurrentUser ? 'active-user-row' : ''}">
                <div class="rank">${index + 1}</div>
                <div class="lb-avatar-frame">
                    <img src="${avatar}" alt="${scoreData.userName}" style="width:100%; height:100%; object-fit:cover;" loading="lazy">
                </div>
                <div class="lb-name">${displayName}</div>
                <div class="lb-score">${scoreData.averagePercentage.toFixed(2)}%</div>
            </li>
        `;
    });
    leaderboardHTML += '</ol>';

    let userRankHTML = '';
    if (currentUser && category === 'all' && userLiveRank > topScores.length) {
        const userAvatar = currentUser.photoURL || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23ddd"/></svg>';
        const myActiveRecord = topScores[userLiveRank - 1];
        const myPercentageStr = myActiveRecord ? myActiveRecord.averagePercentage.toFixed(2) + "%" : "0.00%";

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

async function updateUserTestStatus(category) {
    const testPartsContainer = document.getElementById('test-parts-container');
    if (!currentUser || !testPartsContainer) return;

    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=get_user_status&userId=${currentUser.uid}`);
        const latestScoresMap = await response.json();

        testPartsContainer.querySelectorAll('.box[data-quiz-id]').forEach(box => {
            const quizId = box.dataset.quizId;
            if (latestScoresMap && latestScoresMap[quizId]) {
                const scoreData = latestScoresMap[quizId];
                const partName = box.dataset.partName || "Test Part";
                
                const tempDiv = document.createElement('div');
                if (box.dataset.originalHtml) {
                    tempDiv.innerHTML = box.dataset.originalHtml;
                }
                const originalLink = tempDiv.querySelector('a');
                if (!originalLink) return;

                box.innerHTML = `
                    <div class="user-score-display" style="text-align:left; margin-bottom:12px;">
                        <h4 style="margin:0 0 4px 0; font-family:var(--font-display); color:var(--text-heading);">${partName}</h4>
                        <p style="margin:0; font-size:13px; color:var(--text-paragraph);"><strong>Your Latest Score:</strong> ${scoreData.score} / ${scoreData.totalQuestions}</p>
                    </div>
                    <div class="button-group" style="display:flex; gap:10px;">
                        <button class="tc-action-btn retry-btn" style="cursor:pointer; background:var(--clr-accent); color:#000; border-color:var(--clr-accent);">Play Again</button>
                    </div>
                `;

                box.querySelector('.retry-btn').onclick = () => {
                    sessionStorage.removeItem(`review_${quizId}`);
                    sessionStorage.removeItem('reviewDataForNextPage');
                    window.location.href = originalLink.href;
                };
            }
        });
    } catch (error) {
        console.error("Error updating user test status from Google Sheet Ledger:", error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('#test-parts-container .box[data-quiz-id]').forEach(box => {
        if (!box.dataset.originalHtml) {
            box.dataset.originalHtml = box.innerHTML;
        }
    });

    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        initializeTestHub();
    });
});

window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        currentUser = auth.currentUser;
        initializeTestHub();
    }
});
