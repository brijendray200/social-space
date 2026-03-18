const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000/api' : '/api';
let token = localStorage.getItem('token');

if (!token) {
    window.location.href = '/';
}

// Load friend requests
async function loadFriendRequests() {
    try {
        const response = await fetch(`${API_URL}/users/friend-requests`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const requests = await response.json();

        const container = document.getElementById('friend-requests');
        const badge = document.getElementById('request-badge');
        const pendingCount = document.getElementById('pending-count');

        badge.textContent = requests.length;
        pendingCount.textContent = requests.length;

        if (requests.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <p>No pending friend requests</p>
                </div>
            `;
            return;
        }

        container.innerHTML = requests.map(user => `
            <div class="friend-card">
                <div class="friend-avatar">${user.username.charAt(0).toUpperCase()}</div>
                <div class="friend-info">
                    <div class="friend-name">${user.username}</div>
                    <div class="friend-email">${user.email}</div>
                </div>
                <div class="friend-actions">
                    <button onclick="acceptFriendRequest('${user._id}')" class="btn btn-success">
                        ✓ Accept
                    </button>
                    <button onclick="rejectFriendRequest('${user._id}')" class="btn btn-danger">
                        ✗ Reject
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load friend requests:', error);
    }
}

async function acceptFriendRequest(userId) {
    try {
        const response = await fetch(`${API_URL}/users/friend-request/accept/${userId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        showNotification(data.message, 'success');
        loadFriendRequests();
        loadFriends();
        updateStats();
    } catch (error) {
        showNotification('Failed to accept friend request', 'error');
    }
}

async function rejectFriendRequest(userId) {
    try {
        const response = await fetch(`${API_URL}/users/friend-request/reject/${userId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        showNotification(data.message, 'success');
        loadFriendRequests();
        updateStats();
    } catch (error) {
        showNotification('Failed to reject friend request', 'error');
    }
}

// Search users
let searchTimeout;
document.getElementById('search-input').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();

    if (query.length < 2) {
        document.getElementById('search-results').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👋</div>
                <p>Start typing to find friends...</p>
            </div>
        `;
        return;
    }

    searchTimeout = setTimeout(() => searchUsers(query), 500);
});

async function searchUsers(query) {
    try {
        const response = await fetch(`${API_URL}/users/search?q=${encodeURIComponent(query)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const users = await response.json();

        const container = document.getElementById('search-results');

        if (users.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">😕</div>
                    <p>No users found</p>
                </div>
            `;
            return;
        }

        container.innerHTML = users.map(user => `
            <div class="friend-card">
                <div class="friend-avatar">${user.username.charAt(0).toUpperCase()}</div>
                <div class="friend-info">
                    <div class="friend-name">${user.username}</div>
                    <div class="friend-email">${user.email}</div>
                </div>
                <div class="friend-actions">
                    <button onclick="sendFriendRequest('${user._id}')" class="btn btn-primary">
                        ➕ Add Friend
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to search users:', error);
    }
}

async function sendFriendRequest(userId) {
    try {
        const response = await fetch(`${API_URL}/users/friend-request/${userId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (response.ok) {
            showNotification(data.message, 'success');
        } else {
            showNotification(data.error, 'error');
        }
    } catch (error) {
        showNotification('Failed to send friend request', 'error');
    }
}

async function loadFriends() {
    try {
        const response = await fetch(`${API_URL}/users/friends`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const friends = await response.json();

        const container = document.getElementById('friends-list');
        const badge = document.getElementById('friends-badge');
        const totalFriends = document.getElementById('total-friends');

        badge.textContent = friends.length;
        totalFriends.textContent = friends.length;

        if (friends.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">😊</div>
                    <p>No friends yet. Start adding friends!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = friends.map(friend => `
            <div class="friend-card">
                <div class="friend-avatar">${friend.username.charAt(0).toUpperCase()}</div>
                <div class="friend-info">
                    <div class="friend-name">${friend.username}</div>
                    <div class="friend-email">${friend.email}</div>
                </div>
                <div class="friend-actions">
                    <button onclick="removeFriend('${friend._id}')" class="btn btn-danger">
                        🗑️ Remove
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load friends:', error);
    }
}

async function removeFriend(userId) {
    if (!confirm('Are you sure you want to remove this friend?')) return;

    try {
        const response = await fetch(`${API_URL}/users/friend/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        showNotification(data.message, 'success');
        loadFriends();
        updateStats();
    } catch (error) {
        showNotification('Failed to remove friend', 'error');
    }
}

function scrollToSection(sectionId) {
    document.getElementById(sectionId).scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#38ef7d' : '#f45c43'};
        color: white;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

async function updateStats() {
    await loadFriendRequests();
    await loadFriends();
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    window.location.href = '/';
}

// Load user info
const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
document.getElementById('user-info').textContent = `Hi, ${userInfo.username || 'User'}!`;

// Initialize
loadFriendRequests();
loadFriends();

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
