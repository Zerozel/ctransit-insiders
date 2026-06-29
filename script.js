// The Google Visualization API endpoint bypasses redirects and proxies entirely.
const SHEET_ID = '1lbHYvt5MaUBn4RwVOXse-6z0g6QxuTDDQ_R70OzjSvg';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

document.addEventListener('DOMContentLoaded', fetchLeaderboardData);

function fetchLeaderboardData() {
    toggleUI('loader');

    // We can confidently use PapaParse natively again without fetch() wrappers
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
        // Ensure we have data before rendering
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
    const cleanPhone = String(phone).trim();
    
    if (cleanPhone.length < 8) {
        return "***"; 
    }
    
    const firstPart = cleanPhone.substring(0, 4);
    const lastPart = cleanPhone.substring(cleanPhone.length - 4);
    
    return `${firstPart}***${lastPart}`;
}

// Utility: Prevent XSS attacks
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Utility: Toggle views
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

// Automatically refresh data every 5 minutes
setInterval(fetchLeaderboardData, 300000);
