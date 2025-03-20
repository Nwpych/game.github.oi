// Leaderboard functions for 吃货球球

// DOM Elements
const leaderboardBtn = document.getElementById('leaderboardBtn');
const leaderboardModal = document.getElementById('leaderboardModal');
const leaderboardList = document.getElementById('leaderboardList');
const closeLeaderboardBtn = document.getElementById('closeLeaderboardBtn');

// Show leaderboard modal
function showLeaderboard() {
    leaderboardModal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    
    // Fetch and display leaderboard
    fetchLeaderboard();
}

// Hide leaderboard modal
function hideLeaderboard() {
    leaderboardModal.classList.add('hidden');
    document.body.classList.remove('modal-open');
}

// Fetch leaderboard data
function fetchLeaderboard() {
    // Show loading state
    leaderboardList.innerHTML = `
        <tr>
            <td colspan="3" class="py-4 text-center text-gray-400">加载中...</td>
        </tr>
    `;
    
    // Fetch leaderboard data
    fetch('/api/scores')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.rankings) {
                renderLeaderboard(data.rankings);
            } else {
                leaderboardList.innerHTML = `
                    <tr>
                        <td colspan="3" class="py-4 text-center text-gray-400">暂无数据</td>
                    </tr>
                `;
            }
        })
        .catch(error => {
            console.error("Failed to fetch leaderboard:", error);
            leaderboardList.innerHTML = `
                <tr>
                    <td colspan="3" class="py-4 text-center text-red-500">加载排行榜失败</td>
                </tr>
            `;
        });
}

// Render leaderboard data
function renderLeaderboard(rankings) {
    if (!rankings || rankings.length === 0) {
        leaderboardList.innerHTML = `
            <tr>
                <td colspan="3" class="py-4 text-center text-gray-400">暂无数据</td>
            </tr>
        `;
        return;
    }
    
    // Sort rankings by score in descending order
    rankings.sort((a, b) => b.score - a.score);
    
    // Generate HTML for rankings
    let html = '';
    
    rankings.forEach((entry, index) => {
        const isCurrentUser = entry.username === localStorage.getItem('username');
        const rowClass = isCurrentUser ? 'bg-blue-900 bg-opacity-30' : '';
        const rankClass = index < 3 ? 'font-bold text-amber-400' : 'text-gray-400';
        
        html += `
            <tr class="hover:bg-gray-800 ${rowClass}">
                <td class="py-2">
                    <span class="${rankClass}">#${index + 1}</span>
                </td>
                <td class="py-2 ${isCurrentUser ? 'font-medium text-white' : ''}">${entry.username}</td>
                <td class="py-2 text-right ${isCurrentUser ? 'font-medium text-white' : ''}">${parseFloat(entry.score).toFixed(1)}</td>
            </tr>
        `;
    });
    
    leaderboardList.innerHTML = html;
}

// Submit score to leaderboard
function submitScore(score) {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        console.error("Cannot submit score: No authentication token");
        return;
    }
    
    fetch('/api/scores', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ score })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Show leaderboard after submitting
            showLeaderboard();
        } else {
            console.error("Failed to submit score:", data.message);
        }
    })
    .catch(error => {
        console.error("Error submitting score:", error);
    });
}

// Event Listeners
leaderboardBtn.addEventListener('click', showLeaderboard);
closeLeaderboardBtn.addEventListener('click', hideLeaderboard);

// Close modal when clicking outside
leaderboardModal.addEventListener('click', (e) => {
    if (e.target === leaderboardModal) {
        hideLeaderboard();
    }
});

// Mock leaderboard API functions for testing
function mockGetLeaderboard() {
    // Get stored scores
    let scores = JSON.parse(localStorage.getItem('mockScores') || '[]');
    
    // Sort by score in descending order
    scores.sort((a, b) => b.score - a.score);
    
    return Promise.resolve({
        json: () => Promise.resolve({
            success: true,
            rankings: scores
        })
    });
}

function mockSubmitScore(options) {
    const token = options.headers.Authorization.split(' ')[1];
    const { score } = JSON.parse(options.body);
    
    // Extract username from token
    const username = localStorage.getItem('username');
    
    if (!username) {
        return Promise.resolve({
            json: () => Promise.resolve({
                success: false,
                message: "Invalid token"
            })
        });
    }
    
    // Get stored scores
    let scores = JSON.parse(localStorage.getItem('mockScores') || '[]');
    
    // Check if user already has a score
    const userScoreIndex = scores.findIndex(entry => entry.username === username);
    
    if (userScoreIndex !== -1) {
        // Update score if new score is higher
        if (score > scores[userScoreIndex].score) {
            scores[userScoreIndex].score = score;
        }
    } else {
        // Add new score
        scores.push({ username, score });
    }
    
    // Save updated scores
    localStorage.setItem('mockScores', JSON.stringify(scores));
    
    return Promise.resolve({
        json: () => Promise.resolve({
            success: true,
            message: "Score submitted successfully",
            score
        })
    });
}
