const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000/api' : '/api';
const token = localStorage.getItem('token');
let selectedFiles = [];

if (!token) {
    window.location.href = 'index.html';
}

// Initial Setup
document.addEventListener('DOMContentLoaded', () => {
    checkPostLimit();
    loadPublicFeed();
    loadUserInfo();
});

async function loadUserInfo() {
    try {
        const res = await fetch(`${API_URL}/users/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const user = await res.json();
        const avatarContainer = document.getElementById('user-avatar-small');
        if (user.profilePicture) {
            avatarContainer.innerHTML = `<img src="${user.profilePicture}" style="width:100%; height:100%; object-fit:cover;">`;
        }
    } catch (err) {
        console.error('Failed to load user info');
    }
}

async function checkPostLimit() {
    try {
        const res = await fetch(`${API_URL}/posts/check-limit`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        const progressBar = document.getElementById('progress-bar');
        const progressCircle = document.getElementById('progress-circle');
        const limitNum = document.getElementById('limit-num');
        const limitStatus = document.getElementById('limit-status-text');
        const trigger = document.getElementById('create-trigger');
        const submitBtn = document.getElementById('submit-post-btn');

        const limit = data.limit === Infinity ? 999 : data.limit;
        const current = data.postsToday;
        const percentage = Math.min((current / limit) * 100, 100);

        // Update UI
        progressBar.style.width = `${percentage}%`;
        progressCircle.setAttribute('stroke-dasharray', `${percentage}, 100`);
        limitNum.innerText = data.limit === Infinity ? `${current}/∞` : `${current}/${data.limit}`;

        if (data.limit === Infinity) {
            limitStatus.innerText = "Infinite Galaxy 🌌";
        } else if (data.friendCount === 0) {
            limitStatus.innerText = "Isolated Orbit 🛰️";
        } else {
            limitStatus.innerText = "Influence Growing 📈";
        }

        if (!data.canPost) {
            trigger.style.opacity = '0.5';
            trigger.style.cursor = 'not-allowed';
            trigger.onclick = () => alert(data.message);
            if (submitBtn) submitBtn.disabled = true;
        }
    } catch (err) {
        console.error('Failed to check post limit');
    }
}

async function loadPublicFeed() {
    const container = document.getElementById('public-feed');
    // Show Skeletons
    container.innerHTML = `<div class="premium-post" style="height: 400px; opacity:0.3"></div>`.repeat(3);

    try {
        const res = await fetch(`${API_URL}/posts`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!data.posts || data.posts.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 100px 20px; color: var(--text-muted);">
                    <div style="font-size: 60px; margin-bottom: 20px;">🌚</div>
                    <h3>The space is empty...</h3>
                    <p>Start the conversation first.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = data.posts.map(post => renderPremiumPost(post)).join('');
    } catch (err) {
        container.innerHTML = `<p style="text-align:center; color:red;">Failed to sync with the space.</p>`;
    }
}

function renderPremiumPost(post) {
    const isLiked = post.likes.includes(localStorage.getItem('userId'));
    return `
        <article class="premium-post" id="post-${post._id}">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                <div style="width: 40px; height: 40px; border-radius: 50%; background: #334155; overflow: hidden;">
                    <img src="${post.user.profilePicture || `https://ui-avatars.com/api/?name=${post.user.username}`}" style="width:100%; height:100%; object-fit:cover;">
                </div>
                <div>
                    <div style="font-weight: 700; font-size: 15px;">${post.user.username}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">${formatRelativeTime(post.createdAt)}</div>
                </div>
            </div>
            
            <div style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">${post.content}</div>
            
            <div class="post-media-container">
                ${post.media.map(m => {
        if (m.type === 'video') {
            return `<video src="${m.url}" controls></video>`;
        }
        return `<img src="${m.url}">`;
    }).join('')}
            </div>
            
            <div class="interaction-hub">
                <button class="btn-glass ${isLiked ? 'liked' : ''}" onclick="likePost('${post._id}')">
                    ${isLiked ? '💖' : '🤍'} ${post.likes.length}
                </button>
                <button class="btn-glass" onclick="toggleComments('${post._id}')">
                    💬 ${post.comments.length}
                </button>
                <button class="btn-glass" onclick="sharePost('${post._id}')">
                    ✨ Share
                </button>
            </div>

            <div id="comments-${post._id}" style="display:none; margin-top:20px; padding-top:20px; border-top: 1px solid var(--glass-border);">
                <div class="comments-list">
                    ${post.comments.map(c => `
                        <div style="margin-bottom:12px; font-size:14px;">
                            <span style="font-weight:700; color: #cbd5e1;">${c.user?.username || 'User'}:</span> 
                            <span style="color: #94a3b8;">${c.text}</span>
                        </div>
                    `).join('')}
                </div>
                <div style="display:flex; gap:10px; margin-top:16px;">
                    <input type="text" id="comment-input-${post._id}" placeholder="Write a comment..." 
                        style="flex:1; background: rgba(0,0,0,0.2); border: 1px solid var(--glass-border); color: white; padding: 10px; border-radius: 10px;">
                    <button onclick="addComment('${post._id}')" class="btn-primary-gradient" style="padding: 10px 20px;">Send</button>
                </div>
            </div>
        </article>
    `;
}

function formatRelativeTime(date) {
    const now = new Date();
    const then = new Date(date);
    const diff = now - then;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return then.toLocaleDateString();
}

function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    selectedFiles = [...selectedFiles, ...files];
    const previewContainer = document.getElementById('file-previews');

    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const div = document.createElement('div');
            div.className = 'preview-item';
            if (file.type.startsWith('video')) {
                div.innerHTML = `<video src="${e.target.result}"></video>`;
            } else {
                div.innerHTML = `<img src="${e.target.result}">`;
            }
            previewContainer.appendChild(div);
        };
        reader.readAsDataURL(file);
    });
}

document.getElementById('create-post-form').onsubmit = async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('submit-post-btn');
    submitBtn.disabled = true;
    submitBtn.innerText = 'Transmitting...';

    const formData = new FormData();
    formData.append('content', document.getElementById('post-content').value);
    selectedFiles.forEach(file => formData.append('media', file));

    try {
        const res = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        if (res.ok) {
            closePostModal();
            loadPublicFeed();
            checkPostLimit();
        } else {
            const data = await res.json();
            alert(data.error || 'The transmission failed.');
        }
    } catch (err) {
        alert('Cosmic error during posting.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Share Now';
    }
};

async function likePost(postId) {
    try {
        await fetch(`${API_URL}/posts/${postId}/like`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        loadPublicFeed();
    } catch (err) { console.error(err); }
}

function toggleComments(postId) {
    const el = document.getElementById(`comments-${postId}`);
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

async function addComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    if (!input.value) return;

    try {
        await fetch(`${API_URL}/posts/${postId}/comment`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: input.value })
        });
        input.value = '';
        loadPublicFeed();
    } catch (err) { console.error(err); }
}

async function sharePost(postId) {
    try {
        const res = await fetch(`${API_URL}/posts/${postId}/share`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        alert(data.message || 'Shared successfully!');
        loadPublicFeed();
    } catch (err) { console.error(err); }
}
