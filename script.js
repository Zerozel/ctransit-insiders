// ⚠️ REPLACE THIS LINK with your actual published Google Sheet CSV link
// To get it: File > Share > Publish to web > Link > Entire Document > Comma-separated values (.csv)

const rawGoogleLink = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTMTCFkmw3zYU72EJL0-qLD0TRCNiwQMrKI5NJ9iLu1Ltp28gm7mHRi95mUVmtAUenymv0dKVZdwqrV/pub?output=csv';
const CSV_URL = 'https://corsproxy.io/?' + encodeURIComponent(rawGoogleLink);


document.addEventListener('DOMContentLoaded', fetchLeaderboardData);

function fetchLeaderboardData() {
    toggleUI('loader');

    Papa.parse(CSV_URL, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            if (results.errors.length && results.data.length === 0) {
                console.error("Parse Error:", results.errors);
                toggleUI('error');
                return;
            }
            renderLeaderboard(results.data);
        },
        error: function(error) {
            console.error("Network/Fetch Error:", error);
            toggleUI('error');
        }
    });
}

function renderLeaderboard(data) {
    const container = document.getElementById('leaderboard-body');
    container.innerHTML = ''; // Clear existing content

    data.forEach(user => {
        // Ensure we have data before rendering (Google Sheets sometimes outputs blank rows at the end)
        if (!user['Rank'] || !user['Phone Number']) return;

        const maskedPhone = maskPhoneNumber(user['Phone Number']);
        
        // Create the row element
        const row = document.createElement('div');
        row.className = 'row';
        row.setAttribute('data-rank', user['Rank']);

        // Construct the internal HTML
        row.innerHTML = `
            <div class="rank-badge">${user['Rank']}</div>
            <div class="user-info">
                <div class="display-name">${escapeHTML(user['Display Name'])}</div>
                <div class="phone-mask">${maskedPhone}</div>
            </div>
            <div class="stats">
                <div class="reports">${user['Total Reports']} Reports</div>
                <div class="points">${user['Total Points']} Pts</div>
            </div>
        `;

        container.appendChild(row);
    });

    toggleUI('success');
}

// CRITICAL PRIVACY: Mask phone number (e.g., 0801***5678)
function maskPhoneNumber(phone) {
    // Strip any accidental whitespace
    const cleanPhone = String(phone).trim();
    
    if (cleanPhone.length < 8) {
        return "***"; // Fallback for unusually short data
    }
    
    // Grab first 4 and last 4 digits, put *** in the middle
    const firstPart = cleanPhone.substring(0, 4);
    const lastPart = cleanPhone.substring(cleanPhone.length - 4);
    
    return `${firstPart}***${lastPart}`;
}

// Utility: Prevent XSS attacks from raw sheet data
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Utility: Toggle between Loading, Error, and Leaderboard views
function toggleUI(state) {
    const loader = document.getElementById('loader');
    const errorMsg = document.getElementById('error-message');
    const leaderboard = document.getElementById('leaderboard-container');

    loader.classList.add('hidden');
    errorMsg.classList.add('hidden');
    leaderboard.classList.add('hidden');

    if (state === 'loader') loader.classList.remove('hidden');
    if (state === 'error') errorMsg.classList.remove('hidden');
    if (state === 'success') leaderboard.classList.remove('hidden');
}

// Automatically refresh the leaderboard data every 5 minutes (300,000 milliseconds)
setInterval(fetchLeaderboardData, 300000);
