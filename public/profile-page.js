const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000/api' : '/api';
let token = localStorage.getItem('token');
let currentTab = 'posts';

if (!token) {
    window.location.href = '/';
}

// Load Profile Data
async function loadProfile() {
    try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

        // Set basic info
        document.getElementById('profile-username').textContent = userInfo.username || 'username';
        document.getElementById('profile-name').textContent = userInfo.name || 'Name';
        document.getElementById('profile-bio').textContent = userInfo.bio || 'Bio goes here...';

        if (userInfo.website) {
            document.getElementById('profile-website').textContent = userInfo.website;
            document.getElementById('profile-website').href = userInfo.website;
            document.getElementById('profile-website').style.display = 'block';
        }

        if (userInfo.profilePicture) {
            document.getElementById('profile-pic').src = userInfo.profilePicture;
        }

        // Load stats
        const statsResponse = await fetch(`${API_URL}/users/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const stats = await statsResponse.json();

        document.getElementById('posts-count').textContent = stats.postCount || 0;
        document.getElementById('followers-count').textContent = stats.friendCount || 0;
        document.getElementById('following-count').textContent = stats.friendCount || 0;

        // Load content
        loadPosts();
        loadHighlights();
    } catch (error) {
        console.error('Failed to load profile:', error);
    }
}

// Load Posts
async function loadPosts() {
    try {
        const response = await fetch(`${API_URL}/posts/my-posts`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const posts = await response.json();

        const container = document.getElementById('posts-grid');

        if (posts.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <div class="empty-icon">📷</div>
                    <p>No posts yet</p>
                </div>
            `;
            return;
        }

        container.innerHTML = posts.map(post => {
            const media = post.media[0];
            return `
                <div class="grid-item" onclick="viewPost('${post._id}')">
                    ${media ? (
                    media.type === 'image'
                        ? `<img src="${media.url}" alt="Post">`
                        : `<video src="${media.url}"></video>`
                ) : `<div style="background:#f0f0f0; width:100%; height:100%;"></div>`}
                    <div class="grid-item-overlay">
                        <span>❤️ ${post.likes.length}</span>
                        <span>💬 ${post.comments.length}</span>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Failed to load posts:', error);
    }
}

// Load Reels
async function loadReels() {
    try {
        const response = await fetch(`${API_URL}/reels`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const reels = await response.json();

        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const myReels = reels.filter(r => r.user._id === userInfo.id);

        const container = document.getElementById('reels-grid');

        if (myReels.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <div class="empty-icon">🎬</div>
                    <p>No reels yet</p>
                </div>
            `;
            return;
        }

        container.innerHTML = myReels.map(reel => `
            <div class="grid-item">
                <video src="${reel.video}"></video>
                <div class="grid-item-overlay">
                    <span>❤️ ${reel.likes.length}</span>
                    <span>💬 ${reel.comments.length}</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load reels:', error);
    }
}

// Load Highlights
async function loadHighlights() {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const highlights = userInfo.highlights || [];

    const container = document.getElementById('highlights-container');
    container.innerHTML = highlights.map(h => `
        <div class="highlight-item">
            <div class="highlight-circle">
                <img src="${h.cover}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">
            </div>
            <span class="highlight-name">${h.title}</span>
        </div>
    `).join('');
}

// Switch Tabs
function switchTab(tab) {
    currentTab = tab;

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tab) {
            btn.classList.add('active');
        }
    });

    // Hide all grids
    document.querySelectorAll('.content-grid').forEach(grid => {
        grid.style.display = 'none';
    });

    // Show selected grid
    if (tab === 'posts') {
        document.getElementById('posts-grid').style.display = 'grid';
        loadPosts();
    } else if (tab === 'reels') {
        document.getElementById('reels-grid').style.display = 'grid';
        loadReels();
    } else if (tab === 'videos') {
        document.getElementById('videos-grid').style.display = 'grid';
        document.getElementById('videos-grid').innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-icon">📹</div>
                <p>No videos yet</p>
            </div>
        `;
    } else if (tab === 'tagged') {
        document.getElementById('tagged-grid').style.display = 'grid';
        document.getElementById('tagged-grid').innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-icon">👤</div>
                <p>No tagged posts yet</p>
            </div>
        `;
    }
}

// Edit Profile
function showEditProfileModal() {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

    document.getElementById('edit-name').value = userInfo.name || '';
    document.getElementById('edit-username').value = userInfo.username || '';
    document.getElementById('edit-bio').value = userInfo.bio || '';
    document.getElementById('edit-website').value = userInfo.website || '';
    document.getElementById('edit-location').value = userInfo.location || '';

    document.getElementById('edit-profile-modal').classList.add('active');
}

document.getElementById('edit-profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        name: document.getElementById('edit-name').value,
        username: document.getElementById('edit-username').value,
        bio: document.getElementById('edit-bio').value,
        website: document.getElementById('edit-website').value,
        location: document.getElementById('edit-location').value
    };

    try {
        const response = await fetch(`${API_URL}/users/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const updatedUser = await response.json();
            localStorage.setItem('userInfo', JSON.stringify(updatedUser));
            showToast('Profile updated!', 'success');
            closeModal('edit-profile-modal');
            loadProfile();
        } else {
            showToast('Failed to update profile', 'error');
        }
    } catch (error) {
        showToast('Error updating profile', 'error');
    }
});

// Profile Picture
function showProfilePicModal() {
    document.getElementById('profile-pic-modal').classList.add('active');
}

document.getElementById('profile-pic-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
        const response = await fetch(`${API_URL}/users/profile-picture`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            document.getElementById('profile-pic').src = data.profilePicture;

            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            userInfo.profilePicture = data.profilePicture;
            localStorage.setItem('userInfo', JSON.stringify(userInfo));

            showToast('Profile picture updated!', 'success');
            closeModal('profile-pic-modal');
        }
    } catch (error) {
        showToast('Failed to upload picture', 'error');
    }
});

async function removeProfilePic() {
    try {
        const response = await fetch(`${API_URL}/users/profile-picture`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            document.getElementById('profile-pic').src = 'https://via.placeholder.com/150';
            showToast('Profile picture removed', 'success');
            closeModal('profile-pic-modal');
        }
    } catch (error) {
        showToast('Failed to remove picture', 'error');
    }
}

// Highlights
function showAddHighlightModal() {
    document.getElementById('add-highlight-modal').classList.add('active');
}

document.getElementById('add-highlight-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('highlight-name').value;
    const cover = document.getElementById('highlight-cover').files[0];

    const formData = new FormData();
    formData.append('title', title);
    formData.append('cover', cover);

    try {
        const response = await fetch(`${API_URL}/users/highlights`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (response.ok) {
            showToast('Highlight created!', 'success');
            closeModal('add-highlight-modal');
            document.getElementById('add-highlight-form').reset();
            loadHighlights();
        }
    } catch (error) {
        showToast('Failed to create highlight', 'error');
    }
});

// Settings
function showSettings() {
    document.getElementById('settings-modal').classList.add('active');
}

function showChangePassword() {
    alert('Change password feature coming soon!');
}

function showPrivacySettings() {
    alert('Privacy settings coming soon!');
}

function showNotificationSettings() {
    alert('Notification settings coming soon!');
}

function showAccountSettings() {
    alert('Account settings coming soon!');
}

function showHelpCenter() {
    alert('Help center coming soon!');
}

// Followers/Following
function showFollowersModal() {
    document.getElementById('followers-modal').classList.add('active');
    loadFollowers();
}

function showFollowingModal() {
    document.getElementById('following-modal').classList.add('active');
    loadFollowing();
}

async function loadFollowers() {
    try {
        const response = await fetch(`${API_URL}/users/friends`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const friends = await response.json();

        const container = document.getElementById('followers-list');

        if (friends.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No followers yet</p></div>';
            return;
        }

        container.innerHTML = friends.map(friend => `
            <div class="user-item">
                <div class="user-avatar">${friend.username.charAt(0).toUpperCase()}</div>
                <div class="user-info">
                    <div class="user-username">${friend.username}</div>
                    <div class="user-name">${friend.name || friend.email}</div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load followers:', error);
    }
}

async function loadFollowing() {
    loadFollowers(); // Same as followers for now
    document.getElementById('following-list').innerHTML = document.getElementById('followers-list').innerHTML;
}

// Share Profile
function shareProfile() {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const profileUrl = `${window.location.origin}/profile/${userInfo.username}`;

    if (navigator.share) {
        navigator.share({
            title: `${userInfo.username}'s Profile`,
            text: `Check out ${userInfo.username} on Social Space!`,
            url: profileUrl
        });
    } else {
        navigator.clipboard.writeText(profileUrl);
        showToast('Profile link copied!', 'success');
    }
}

// Utility Functions
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#38ef7d' : '#ed4956'};
        color: white;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10001;
        animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    window.location.href = '/';
}

function toggleNotifications() {
    alert('Notifications feature - check main page');
}

function toggleMessages() {
    alert('Messages feature - check main page');
}

// Initialize
loadProfile();
