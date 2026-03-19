const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000/api' : '/api';
let token = localStorage.getItem('token');
let currentUser = null;
let currentChatUser = null;

// Auth Functions
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (response.ok) {
            token = data.token;
            localStorage.setItem('token', token);
            localStorage.setItem('userInfo', JSON.stringify(data.user));
            currentUser = data.user;
            showMainApp();
        } else {
            showToast(data.error, 'error');
        }
    } catch (error) {
        showToast('Login failed: ' + error.message, 'error');
    }
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();
        if (response.ok) {
            token = data.token;
            localStorage.setItem('token', token);
            localStorage.setItem('userInfo', JSON.stringify(data.user));
            currentUser = data.user;
            showMainApp();
        } else {
            showToast(data.errors ? data.errors[0].msg : data.error, 'error');
        }
    } catch (error) {
        showToast('Registration failed: ' + error.message, 'error');
    }
});

function showLogin() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('forgot-password-form').style.display = 'none';
    document.getElementById('verify-otp-form').style.display = 'none';
    document.getElementById('reset-password-form').style.display = 'none';
    document.querySelectorAll('.auth-tab')[0].classList.add('active');
    document.querySelectorAll('.auth-tab')[1].classList.remove('active');
}

function showRegister() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
    document.getElementById('forgot-password-form').style.display = 'none';
    document.getElementById('verify-otp-form').style.display = 'none';
    document.getElementById('reset-password-form').style.display = 'none';
    document.querySelectorAll('.auth-tab')[0].classList.remove('active');
    document.querySelectorAll('.auth-tab')[1].classList.add('active');
}

function showMainApp() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('main-section').style.display = 'block';

    // Initialize profile photo in create post section
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const createPostAvatar = document.querySelector('.create-post-header .user-avatar');
    if (createPostAvatar && userInfo.profilePicture) {
        createPostAvatar.innerHTML = `<img src="${userInfo.profilePicture}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
    }

    loadAllData();
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    token = null;
    currentUser = null;
    location.reload();
}

// Page Navigation
function showPage(page) {
    document.querySelectorAll('.page-content').forEach(p => p.style.display = 'none');

    if (page === 'home') {
        document.getElementById('home-page').style.display = 'block';
        loadPosts();
    } else if (page === 'reels') {
        document.getElementById('reels-page').style.display = 'block';
        loadReels();
    } else if (page === 'profile') {
        document.getElementById('profile-page').style.display = 'block';
        loadProfile();
    }
}

// Load All Data
async function loadAllData() {
    loadStories();
    loadPosts();
    loadNotifications();
    loadConversations();
    loadPostLimit();

    // Refresh every 30 seconds
    setInterval(() => {
        loadNotifications();
        loadConversations();
    }, 30000);
}

// Stories
async function loadStories() {
    try {
        const response = await fetch(`${API_URL}/stories`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const storiesData = await response.json();

        const container = document.getElementById('stories-container');
        container.innerHTML = storiesData.map(userStories => {
            let avatarHTML;
            if (userStories.user.profilePicture) {
                avatarHTML = `<img src="${userStories.user.profilePicture}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
            } else {
                avatarHTML = userStories.user.username.charAt(0).toUpperCase();
            }

            return `
                <div class="story-item" onclick="viewStory('${userStories.user._id}')">
                    <div class="story-ring">
                        <div class="story-avatar">${avatarHTML}</div>
                    </div>
                    <span class="story-name">${userStories.user.username}</span>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Failed to load stories:', error);
    }
}

function showAddStoryModal() {
    document.getElementById('add-story-modal').classList.add('active');
}

async function viewStory(userId) {
    try {
        const response = await fetch(`${API_URL}/stories`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const storiesData = await response.json();
        const userStories = storiesData.find(s => s.user._id === userId);
        if (!userStories || !userStories.stories.length) return;

        const story = userStories.stories[0];
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:99999;display:flex;align-items:center;justify-content:center;flex-direction:column;';

        const mediaEl = story.media.type === 'image'
            ? `<img src="${story.media.url}" style="max-width:90vw;max-height:80vh;border-radius:12px;">`
            : `<video src="${story.media.url}" controls autoplay style="max-width:90vw;max-height:80vh;border-radius:12px;"></video>`;

        overlay.innerHTML = `
            <div style="color:white;margin-bottom:10px;font-weight:bold;">${userStories.user.username}</div>
            ${mediaEl}
            ${story.caption ? `<p style="color:white;margin-top:10px;">${story.caption}</p>` : ''}
            <button onclick="this.parentElement.remove()" style="margin-top:15px;padding:10px 25px;background:#667eea;color:white;border:none;border-radius:20px;cursor:pointer;">Close</button>
        `;
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        document.body.appendChild(overlay);

        // Mark as viewed
        fetch(`${API_URL}/stories/${story._id}/view`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => {});
    } catch (err) {
        console.error('Failed to view story:', err);
    }
}

// Compress image to base64 (max 800px, quality 0.7)
function compressImage(file, maxSize = 800, quality = 0.7) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width, h = img.height;
                if (w > maxSize || h > maxSize) {
                    if (w > h) { h = h * maxSize / w; w = maxSize; }
                    else { w = w * maxSize / h; h = maxSize; }
                }
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

document.getElementById('story-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    let file = document.getElementById('story-file').files[0];
    const caption = document.getElementById('story-caption').value;

    if (!file) {
        showToast('Please select a file', 'error');
        return;
    }

    // Compress images before upload
    if (file.type.startsWith('image/')) {
        if (file.size > 500 * 1024) { // compress if > 500KB
            showToast('Compressing image...', 'success');
            file = await compressImage(file);
        }
    } else if (file.type.startsWith('video/')) {
        if (file.size > 5 * 1024 * 1024) {
            showToast('Video too large! Max 5MB for stories.', 'error');
            return;
        }
    }

    showToast('Uploading story...', 'success');
    const formData = new FormData();
    formData.append('media', file, 'story.jpg');
    formData.append('caption', caption);

    try {
        const response = await fetch(`${API_URL}/stories`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (response.ok) {
            showToast('Story posted!', 'success');
            closeModal('add-story-modal');
            document.getElementById('story-form').reset();
            loadStories();
        } else {
            const data = await response.json();
            showToast(data.error || 'Failed to post story', 'error');
        }
    } catch (error) {
        showToast('Failed to post story', 'error');
    }
});

// Posts
async function loadPosts() {
    try {
        const response = await fetch(`${API_URL}/posts`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        const container = document.getElementById('posts-feed');

        if (data.posts.length === 0) {
            container.innerHTML = '<p class="empty-text">No posts yet. Be the first to post!</p>';
            return;
        }

        container.innerHTML = data.posts.map(post => createPostHTML(post)).join('');
    } catch (error) {
        console.error('Failed to load posts:', error);
    }
}

function createPostHTML(post) {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const isLiked = post.likes.includes(userInfo.id);

    // Determine avatar display
    let avatarHTML;
    if (post.user._id === userInfo.id && userInfo.profilePicture) {
        avatarHTML = `<img src="${userInfo.profilePicture}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
    } else if (post.user.profilePicture) {
        avatarHTML = `<img src="${post.user.profilePicture}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
    } else {
        avatarHTML = post.user.username.charAt(0).toUpperCase();
    }

    return `
        <div class="post-card">
            <div class="post-header">
                <div class="user-avatar">${avatarHTML}</div>
                <div class="post-user-info">
                    <div class="post-username">${post.user.username}</div>
                    <div class="post-time">${new Date(post.createdAt).toLocaleString()}</div>
                </div>
            </div>
            <div class="post-content">${post.content}</div>
            ${post.media.length > 0 ? `
                <div class="post-media-grid">
                    ${post.media.map(m =>
        m.type === 'image'
            ? `<img src="${m.url}" alt="Post media">`
            : `<video src="${m.url}" controls></video>`
    ).join('')}
                </div>
            ` : ''}
            <div class="post-actions">
                <button class="post-action-btn ${isLiked ? 'liked' : ''}" onclick="likePost('${post._id}')">
                    ❤️ ${post.likes.length} Likes
                </button>
                <button class="post-action-btn" onclick="toggleComments('${post._id}')">
                    💬 ${post.comments.length} Comments
                </button>
                <button class="post-action-btn" onclick="sharePost('${post._id}')">
                    🔄 ${post.shares.length} Shares
                </button>
            </div>
            <div id="comments-${post._id}" style="display:none; margin-top:15px;">
                ${post.comments.map(c => `
                    <div style="padding:10px; background:#f9f9f9; border-radius:8px; margin-bottom:8px;">
                        <strong>${c.user.username}</strong>: ${c.text}
                    </div>
                `).join('')}
                <div style="display:flex; gap:10px; margin-top:10px;">
                    <input type="text" id="comment-input-${post._id}" placeholder="Write a comment..." style="flex:1; padding:10px; border:1px solid #e0e0e0; border-radius:20px;">
                    <button onclick="addComment('${post._id}')" style="padding:10px 20px; background:#667eea; color:white; border:none; border-radius:20px; cursor:pointer;">Post</button>
                </div>
            </div>
        </div>
    `;
}

function showCreatePostModal() {
    document.getElementById('create-post-modal').classList.add('active');
}

document.getElementById('post-files').addEventListener('change', function (e) {
    const files = e.target.files;
    const preview = document.getElementById('post-preview');
    preview.innerHTML = '';

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function (e) {
            const div = document.createElement('div');
            if (file.type.startsWith('image/')) {
                div.innerHTML = `<img src="${e.target.result}">`;
            } else if (file.type.startsWith('video/')) {
                div.innerHTML = `<video src="${e.target.result}"></video>`;
            }
            preview.appendChild(div);
        };
        reader.readAsDataURL(file);
    });
});

document.getElementById('create-post-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const content = document.getElementById('post-text').value;
    const files = Array.from(document.getElementById('post-files').files);

    if (!content.trim() && files.length === 0) {
        showToast('Write something or add a photo!', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('content', content);

    // Compress images before upload
    for (let file of files) {
        if (file.type.startsWith('image/') && file.size > 500 * 1024) {
            const compressed = await compressImage(file);
            formData.append('media', compressed, 'photo.jpg');
        } else if (file.type.startsWith('video/') && file.size > 10 * 1024 * 1024) {
            showToast('Video too large! Max 10MB.', 'error');
            return;
        } else {
            formData.append('media', file);
        }
    }

    showToast('Posting...', 'success');
    try {
        const response = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        const data = await response.json();
        if (response.ok) {
            showToast('Post created!', 'success');
            closeModal('create-post-modal');
            document.getElementById('create-post-form').reset();
            document.getElementById('post-preview').innerHTML = '';
            loadPosts();
            loadPostLimit();
        } else {
            showToast(data.error, 'error');
        }
    } catch (error) {
        showToast('Failed to create post: ' + error.message, 'error');
    }
});

async function likePost(postId) {
    try {
        await fetch(`${API_URL}/posts/${postId}/like`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        loadPosts();
    } catch (error) {
        console.error('Failed to like post:', error);
    }
}

function toggleComments(postId) {
    const commentsDiv = document.getElementById(`comments-${postId}`);
    commentsDiv.style.display = commentsDiv.style.display === 'none' ? 'block' : 'none';
}

async function addComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const text = input.value.trim();

    if (!text) return;

    try {
        await fetch(`${API_URL}/posts/${postId}/comment`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text })
        });

        input.value = '';
        loadPosts();
    } catch (error) {
        console.error('Failed to add comment:', error);
    }
}

async function sharePost(postId) {
    try {
        const response = await fetch(`${API_URL}/posts/${postId}/share`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        showToast(data.message, response.ok ? 'success' : 'error');
        if (response.ok) loadPosts();
    } catch (error) {
        console.error('Failed to share post:', error);
    }
}

async function loadPostLimit() {
    try {
        const response = await fetch(`${API_URL}/posts/check-limit`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        // Update friends count in profile stats if visible
        const fc = document.getElementById('friends-count');
        if (fc) fc.textContent = data.friendCount;
    } catch (error) {
        console.error('Failed to load post limit:', error);
    }
}

// Notifications
async function loadNotifications() {
    try {
        const response = await fetch(`${API_URL}/notifications`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        document.getElementById('notif-badge').textContent = data.unreadCount;

        const container = document.getElementById('notifications-list');

        if (data.notifications.length === 0) {
            container.innerHTML = '<p class="empty-text">No notifications</p>';
            return;
        }

        container.innerHTML = data.notifications.map(notif => `
            <div class="notif-item ${notif.read ? '' : 'unread'}" onclick="markNotifRead('${notif._id}')">
                <strong>${notif.sender.username}</strong> ${notif.message}
                <div style="font-size:12px; color:#666; margin-top:5px;">
                    ${new Date(notif.createdAt).toLocaleString()}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load notifications:', error);
    }
}

function toggleNotifications() {
    const dropdown = document.getElementById('notifications-dropdown');
    const isVisible = dropdown.style.display === 'block';

    // Close all dropdowns
    document.querySelectorAll('.dropdown-panel').forEach(d => d.style.display = 'none');

    if (!isVisible) {
        dropdown.style.display = 'block';
        loadNotifications();
    }
}

async function markNotifRead(notifId) {
    try {
        await fetch(`${API_URL}/notifications/${notifId}/read`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        loadNotifications();
    } catch (error) {
        console.error('Failed to mark notification as read:', error);
    }
}

async function markAllRead() {
    try {
        await fetch(`${API_URL}/notifications/read-all`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        loadNotifications();
    } catch (error) {
        console.error('Failed to mark all as read:', error);
    }
}

// Messages
async function loadConversations() {
    try {
        const response = await fetch(`${API_URL}/messages/conversations`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const conversations = await response.json();

        const unreadResponse = await fetch(`${API_URL}/messages/unread/count`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const unreadData = await unreadResponse.json();

        document.getElementById('msg-badge').textContent = unreadData.count;

        const container = document.getElementById('conversations-list');

        if (conversations.length === 0) {
            container.innerHTML = '<p class="empty-text">No messages</p>';
            return;
        }

        container.innerHTML = conversations.map(conv => {
            let avatarHTML;
            if (conv._id.profilePicture) {
                avatarHTML = `<img src="${conv._id.profilePicture}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
            } else {
                avatarHTML = conv._id.username.charAt(0).toUpperCase();
            }

            return `
                <div class="conv-item" onclick="openChat('${conv._id._id}', '${conv._id.username}')">
                    <div class="conv-avatar">${avatarHTML}</div>
                    <div class="conv-info">
                        <div class="conv-name">${conv._id.username}</div>
                        <div class="conv-last-msg">${conv.lastMessage.message}</div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Failed to load conversations:', error);
    }
}

function toggleMessages() {
    const dropdown = document.getElementById('messages-dropdown');
    const isVisible = dropdown.style.display === 'block';

    // Close all dropdowns
    document.querySelectorAll('.dropdown-panel').forEach(d => d.style.display = 'none');

    if (!isVisible) {
        dropdown.style.display = 'block';
        loadConversations();
    }
}

async function openChat(userId, username) {
    currentChatUser = userId;
    document.getElementById('chat-username').textContent = username;
    document.getElementById('chat-modal').classList.add('active');

    // Close dropdowns
    document.querySelectorAll('.dropdown-panel').forEach(d => d.style.display = 'none');

    loadChatMessages(userId);
}

async function loadChatMessages(userId) {
    try {
        const response = await fetch(`${API_URL}/messages/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const messages = await response.json();

        const container = document.getElementById('chat-messages');
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

        container.innerHTML = messages.map(msg => `
            <div class="chat-message ${msg.sender._id === userInfo.id ? 'sent' : ''}">
                <div class="chat-bubble">${msg.message}</div>
            </div>
        `).join('');

        container.scrollTop = container.scrollHeight;
    } catch (error) {
        console.error('Failed to load messages:', error);
    }
}

document.getElementById('chat-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message) return;

    try {
        await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                recipientId: currentChatUser,
                message
            })
        });

        input.value = '';
        loadChatMessages(currentChatUser);
    } catch (error) {
        console.error('Failed to send message:', error);
    }
});

// Reels
async function loadReels() {
    try {
        const response = await fetch(`${API_URL}/reels`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const reels = await response.json();

        const container = document.getElementById('reels-feed');

        if (reels.length === 0) {
            container.innerHTML = '<p class="empty-text">No reels yet</p>';
            return;
        }

        container.innerHTML = reels.map(reel => {
            let avatarHTML;
            if (reel.user.profilePicture) {
                avatarHTML = `<img src="${reel.user.profilePicture}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
            } else {
                avatarHTML = reel.user.username.charAt(0).toUpperCase();
            }

            return `
                <div class="reel-card">
                    <div class="post-header">
                        <div class="user-avatar">${avatarHTML}</div>
                        <div class="post-user-info">
                            <div class="post-username">${reel.user.username}</div>
                            <div class="post-time">${new Date(reel.createdAt).toLocaleString()}</div>
                        </div>
                    </div>
                    <video class="reel-video" src="${reel.video}" controls></video>
                    ${reel.caption ? `<div style="padding:15px;">${reel.caption}</div>` : ''}
                    <div class="post-actions" style="padding:15px;">
                        <button class="post-action-btn" onclick="likeReel('${reel._id}')">
                            ❤️ ${reel.likes.length}
                        </button>
                        <button class="post-action-btn">
                            💬 ${reel.comments.length}
                        </button>
                        <button class="post-action-btn">
                            👁️ ${reel.views}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Failed to load reels:', error);
    }
}

function showAddReelModal() {
    document.getElementById('add-reel-modal').classList.add('active');
}

document.getElementById('reel-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const video = document.getElementById('reel-video').files[0];
    const caption = document.getElementById('reel-caption').value;

    if (!video) {
        showToast('Please select a video', 'error');
        return;
    }

    if (video.size > 10 * 1024 * 1024) {
        showToast('Video too large! Max 10MB for reels.', 'error');
        return;
    }

    showToast('Uploading reel...', 'success');
    const formData = new FormData();
    formData.append('video', video);
    formData.append('caption', caption);

    try {
        const response = await fetch(`${API_URL}/reels`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (response.ok) {
            showToast('Reel posted!', 'success');
            closeModal('add-reel-modal');
            document.getElementById('reel-form').reset();
            loadReels();
        } else {
            const data = await response.json();
            showToast(data.error || 'Failed to post reel', 'error');
        }
    } catch (error) {
        showToast('Failed to post reel: ' + error.message, 'error');
    }
});

async function likeReel(reelId) {
    try {
        await fetch(`${API_URL}/reels/${reelId}/like`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        loadReels();
    } catch (error) {
        console.error('Failed to like reel:', error);
    }
}

// Profile
async function loadProfile() {
    try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

        document.getElementById('profile-username').textContent = userInfo.username;
        document.getElementById('profile-email').textContent = userInfo.email;

        // Load profile picture
        const profileImg = document.getElementById('profile-avatar-img');
        if (profileImg) {
            if (userInfo.profilePicture) {
                profileImg.src = userInfo.profilePicture;
            } else {
                profileImg.src = 'https://via.placeholder.com/100/667eea/ffffff?text=👤';
            }
        }

        const statsResponse = await fetch(`${API_URL}/users/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const stats = await statsResponse.json();

        document.getElementById('profile-friends').textContent = stats.friendCount;
        document.getElementById('profile-posts').textContent = stats.postCount;
        document.getElementById('profile-likes').textContent = stats.totalLikes;

        loadUserPosts();
        loadUserFriends();
    } catch (error) {
        console.error('Failed to load profile:', error);
    }
}

async function loadUserPosts() {
    try {
        const response = await fetch(`${API_URL}/posts/my-posts`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const posts = await response.json();
        const container = document.getElementById('user-posts');

        if (posts.length === 0) {
            container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:40px;">No posts yet</p>';
            return;
        }

        // Instagram-style 3-column grid thumbnails
        container.innerHTML = posts.map(post => {
            const media = post.media && post.media[0];
            if (media) {
                const el = media.type === 'image'
                    ? `<img src="${media.url}" alt="post">`
                    : `<video src="${media.url}"></video>`;
                return `<div class="ig-post-thumb" onclick="showPostDetail('${post._id}')">${el}</div>`;
            } else {
                return `<div class="ig-post-thumb" onclick="showPostDetail('${post._id}')">
                    <div class="ig-post-thumb-text">${post.content.substring(0, 60)}</div>
                </div>`;
            }
        }).join('');
    } catch (error) {
        console.error('Failed to load user posts:', error);
    }
}

async function loadUserFriends() {
    try {
        const response = await fetch(`${API_URL}/users/friends`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const friends = await response.json();
        const container = document.getElementById('user-friends');

        if (friends.length === 0) {
            container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:40px;">No friends yet</p>';
            return;
        }

        container.innerHTML = `<div class="ig-friends-list">${friends.map(friend => {
            const avatarHTML = friend.profilePicture
                ? `<img src="${friend.profilePicture}" alt="${friend.username}">`
                : friend.username.charAt(0).toUpperCase();
            return `<div class="ig-friend-item">
                <div class="ig-friend-avatar">${avatarHTML}</div>
                <div class="ig-friend-name">${friend.username}</div>
            </div>`;
        }).join('')}</div>`;
    } catch (error) {
        console.error('Failed to load friends:', error);
    }
}

function igSwitchTab(tab, btn) {
    document.querySelectorAll('.ig-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.ig-tab-content').forEach(c => c.style.display = 'none');
    btn.classList.add('active');
    document.getElementById(`profile-${tab}-tab`).style.display = 'block';
}

function showProfileTab(tab) {
    document.querySelectorAll('.ig-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.ig-tab-content').forEach(c => c.style.display = 'none');
    const idx = tab === 'posts' ? 0 : 1;
    const tabs = document.querySelectorAll('.ig-tab');
    if (tabs[idx]) tabs[idx].classList.add('active');
    const tabEl = document.getElementById(`profile-${tab}-tab`);
    if (tabEl) tabEl.style.display = 'block';
}

function showPostDetail(postId) {
    // Show post in a modal overlay
    const allPosts = document.querySelectorAll('.ig-post-thumb');
    // just navigate to home and highlight — simple approach
    showPage('home');
}

// Utility Functions
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function showToast(message, type) {
    const toast = document.createElement('div');
    // OTP messages stay longer (10s), others 3s
    const duration = message.includes('OTP') ? 10000 : 3000;
    toast.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#38ef7d' : '#f45c43'};
        color: white;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10001;
        animation: slideIn 0.3s ease;
        max-width: 350px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
    `;
    toast.textContent = message;
    toast.onclick = () => toast.remove();

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-icon-btn') && !e.target.closest('.dropdown-panel')) {
        document.querySelectorAll('.dropdown-panel').forEach(d => d.style.display = 'none');
    }
});

// Toggle password visibility
function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
    } else {
        input.type = 'password';
        btn.textContent = '👁️';
    }
}

// Initialize
if (token) {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    if (userInfo.username) {
        currentUser = userInfo;
        showMainApp();
    }
}


// ========== FORGOT PASSWORD FUNCTIONALITY ==========

let forgotPasswordEmail = '';

function showForgotPassword() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('forgot-password-form').style.display = 'block';
    document.getElementById('verify-otp-form').style.display = 'none';
    document.getElementById('reset-password-form').style.display = 'none';
    document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
}

// Send OTP
document.getElementById('forgot-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value;
    forgotPasswordEmail = email;

    try {
        const response = await fetch(`${API_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();
        if (response.ok) {
            if (data.otp) {
                // Show OTP on screen prominently
                showToast(`Your OTP is: ${data.otp} (check email too)`, 'success');
                // Also auto-fill the OTP input
                setTimeout(() => {
                    const otpInput = document.getElementById('otp-input');
                    if (otpInput) otpInput.value = data.otp;
                }, 500);
            } else {
                showToast('OTP sent to your email!', 'success');
            }

            // Show verify OTP form
            document.getElementById('forgot-password-form').style.display = 'none';
            document.getElementById('verify-otp-form').style.display = 'block';
        } else {
            showToast(data.error, 'error');
        }
    } catch (error) {
        showToast('Failed to send OTP: ' + error.message, 'error');
    }
});

// Verify OTP
document.getElementById('verify-otp-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const otp = document.getElementById('otp-input').value;

    try {
        const response = await fetch(`${API_URL}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: forgotPasswordEmail, otp })
        });

        const data = await response.json();
        if (response.ok) {
            showToast('OTP verified successfully!', 'success');

            // Show reset password form
            document.getElementById('verify-otp-form').style.display = 'none';
            document.getElementById('reset-password-form').style.display = 'block';
        } else {
            showToast(data.error, 'error');
        }
    } catch (error) {
        showToast('Failed to verify OTP: ' + error.message, 'error');
    }
});

// Reset Password
document.getElementById('reset-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const otp = document.getElementById('otp-input').value;

    if (newPassword !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: forgotPasswordEmail,
                otp,
                newPassword
            })
        });

        const data = await response.json();
        if (response.ok) {
            showToast('Password reset successfully! Please login.', 'success');

            // Reset forms and show login
            document.getElementById('reset-password-form').reset();
            document.getElementById('verify-otp-form').reset();
            document.getElementById('forgot-password-form').reset();
            forgotPasswordEmail = '';

            setTimeout(() => {
                showLogin();
            }, 2000);
        } else {
            showToast(data.error, 'error');
        }
    } catch (error) {
        showToast('Failed to reset password: ' + error.message, 'error');
    }
});

// Resend OTP
async function resendOTP() {
    if (!forgotPasswordEmail) {
        showToast('Email not found. Please start again.', 'error');
        showForgotPassword();
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: forgotPasswordEmail })
        });

        const data = await response.json();
        if (response.ok) {
            showToast('New OTP sent to your email!', 'success');

            // Show OTP in console for development
            if (data.otp) {
                console.log('🔑 New OTP:', data.otp);
                showToast(`Development Mode - OTP: ${data.otp}`, 'info');
            }

            // Clear OTP input
            document.getElementById('otp-input').value = '';
        } else {
            showToast(data.error, 'error');
        }
    } catch (error) {
        showToast('Failed to resend OTP: ' + error.message, 'error');
    }
}


// ========== PROFILE PHOTO FUNCTIONALITY ==========

function openProfilePhotoModal() {
    document.getElementById('profile-photo-modal').classList.add('active');
}

function closeProfilePhotoModal() {
    document.getElementById('profile-photo-modal').classList.remove('active');
}

async function uploadProfilePhotoMain(event) {
    const file = event.target.files[0];

    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error');
        return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        showToast('Image size must be less than 5MB', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
        const response = await fetch(`${API_URL}/users/profile-picture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Profile photo updated successfully!', 'success');

            // Update profile picture in UI
            const profileImg = document.getElementById('profile-avatar-img');
            if (profileImg) {
                profileImg.src = data.profilePicture;
            }

            // Update user info in localStorage
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            userInfo.profilePicture = data.profilePicture;
            localStorage.setItem('userInfo', JSON.stringify(userInfo));

            // Update all avatars on the page
            updateAllAvatars(data.profilePicture);

            closeProfilePhotoModal();

            // Reload current page to show updated photo
            const currentPage = document.querySelector('.page-content[style*="display: block"]');
            if (currentPage && currentPage.id === 'home-page') {
                loadPosts();
            } else if (currentPage && currentPage.id === 'profile-page') {
                loadProfile();
            }

            // Reset file input
            event.target.value = '';
        } else {
            showToast(data.error || 'Failed to upload photo', 'error');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showToast('Failed to upload photo: ' + error.message, 'error');
    }
}

async function removeProfilePhotoMain() {
    if (!confirm('Are you sure you want to remove your profile photo?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/users/profile-picture`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Profile photo removed successfully!', 'success');

            // Update profile picture in UI to placeholder
            const profileImg = document.getElementById('profile-avatar-img');
            if (profileImg) {
                profileImg.src = 'https://via.placeholder.com/100/667eea/ffffff?text=👤';
            }

            // Update user info in localStorage
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            userInfo.profilePicture = null;
            localStorage.setItem('userInfo', JSON.stringify(userInfo));

            // Update all avatars on the page
            updateAllAvatars(null);

            closeProfilePhotoModal();

            // Reload current page to show updated photo
            const currentPage = document.querySelector('.page-content[style*="display: block"]');
            if (currentPage && currentPage.id === 'home-page') {
                loadPosts();
            } else if (currentPage && currentPage.id === 'profile-page') {
                loadProfile();
            }
        } else {
            showToast(data.error || 'Failed to remove photo', 'error');
        }
    } catch (error) {
        console.error('Remove error:', error);
        showToast('Failed to remove photo: ' + error.message, 'error');
    }
}

// Helper function to update all avatar instances
function updateAllAvatars(profilePicture) {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

    // Update create post avatar
    const createPostAvatar = document.querySelector('.create-post-header .user-avatar');
    if (createPostAvatar) {
        if (profilePicture) {
            createPostAvatar.innerHTML = `<img src="${profilePicture}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
        } else {
            createPostAvatar.innerHTML = userInfo.username ? userInfo.username.charAt(0).toUpperCase() : '👤';
        }
    }
}
