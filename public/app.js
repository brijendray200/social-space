const API_URL = 'http://localhost:5000/api';
let token = localStorage.getItem('token');
let currentUser = null;

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Setup event listeners
    setupAuthListeners();
    setupPostListener();
    
    // Check if already logged in
    if (token) {
        checkExistingSession();
    }
}

function setupAuthListeners() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

function setupPostListener() {
    const postForm = document.getElementById('post-form');
    if (postForm) {
        postForm.addEventListener('submit', handleCreatePost);
    }
}

async function handleLogin(e) {
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
            showMainApp(data.user);
        } else {
            alert(data.error || 'Login failed');
        }
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
}

async function handleRegister(e) {
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
            showMainApp(data.user);
        } else {
            alert(data.errors ? data.errors[0].msg : data.error);
        }
    } catch (error) {
        alert('Registration failed: ' + error.message);
    }
}

function showLogin() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
    document.querySelectorAll('.tab')[0].classList.add('active');
    document.querySelectorAll('.tab')[1].classList.remove('active');
}

function showRegister() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
    document.querySelectorAll('.tab')[0].classList.remove('active');
    document.querySelectorAll('.tab')[1].classList.add('active');
}

function showMainApp(user) {
    const authSection = document.getElementById('auth-section');
    const mainSection = document.getElementById('main-section');
    const userInfo = document.getElementById('user-info');
    
    if (authSection) authSection.style.display = 'none';
    if (mainSection) mainSection.style.display = 'block';
    if (userInfo) {
        userInfo.innerHTML = `<a href="profile.html">Welcome, ${user.username}!</a>`;
    }
    
    loadPostLimit();
    loadPosts();
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    token = null;
    currentUser = null;
    
    const authSection = document.getElementById('auth-section');
    const mainSection = document.getElementById('main-section');
    
    if (authSection) authSection.style.display = 'flex';
    if (mainSection) mainSection.style.display = 'none';
    
    window.location.reload();
}

async function handleCreatePost(e) {
    e.preventDefault();
    const content = document.getElementById('post-content').value;
    const mediaFiles = document.getElementById('post-media').files;

    const formData = new FormData();
    formData.append('content', content);
    
    for (let file of mediaFiles) {
        formData.append('media', file);
    }

    try {
        const response = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        const data = await response.json();
        if (response.ok) {
            showMessage('Post created successfully!', 'success');
            document.getElementById('post-form').reset();
            loadPosts();
            loadPostLimit();
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('Failed to create post: ' + error.message, 'error');
    }
}

async function loadPostLimit() {
    try {
        const response = await fetch(`${API_URL}/posts/check-limit`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        const limitInfo = document.getElementById('post-limit-info');
        if (limitInfo) {
            limitInfo.innerHTML = `
                <strong>Post Status:</strong><br>
                Friends: ${data.friendCount}<br>
                ${data.message}
            `;
        }
        
        const createPostSection = document.getElementById('create-post-section');
        const postButton = document.querySelector('#post-form button[type="submit"]');
        
        if (!data.canPost) {
            if (createPostSection) createPostSection.style.opacity = '0.5';
            if (postButton) postButton.disabled = true;
        } else {
            if (createPostSection) createPostSection.style.opacity = '1';
            if (postButton) postButton.disabled = false;
        }
    } catch (error) {
        console.error('Failed to load post limit:', error);
    }
}

async function loadPosts() {
    try {
        const response = await fetch(`${API_URL}/posts`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        const postsContainer = document.getElementById('posts-container');
        if (!postsContainer) return;
        
        postsContainer.innerHTML = '';

        if (!data.posts || data.posts.length === 0) {
            postsContainer.innerHTML = '<p class="loading">No posts yet. Be the first to post!</p>';
            return;
        }

        data.posts.forEach(post => {
            const postElement = createPostElement(post);
            postsContainer.appendChild(postElement);
        });
    } catch (error) {
        console.error('Failed to load posts:', error);
        const postsContainer = document.getElementById('posts-container');
        if (postsContainer) {
            postsContainer.innerHTML = '<p class="loading">Failed to load posts. Please refresh.</p>';
        }
    }
}

function createPostElement(post) {
    const div = document.createElement('div');
    div.className = 'post';
    
    const mediaHTML = post.media && post.media.length > 0 ? post.media.map(m => {
        if (m.type === 'image') {
            return `<img src="${m.url}" alt="Post media">`;
        } else {
            return `<video src="${m.url}" controls></video>`;
        }
    }).join('') : '';

    const commentsHTML = post.comments && post.comments.length > 0 ? post.comments.map(c => `
        <div class="comment">
            <strong>${c.user.username}</strong>: ${c.text}
            <span style="color: #999; font-size: 12px; margin-left: 10px;">
                ${new Date(c.createdAt).toLocaleString()}
            </span>
        </div>
    `).join('') : '';

    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const isLiked = post.likes && post.likes.includes(userInfo.id);

    div.innerHTML = `
        <div class="post-header">
            <strong>${post.user.username}</strong>
            <span style="margin-left: auto; color: #999; font-size: 14px;">
                ${new Date(post.createdAt).toLocaleString()}
            </span>
        </div>
        <div class="post-content">${post.content}</div>
        ${mediaHTML ? `<div class="post-media">${mediaHTML}</div>` : ''}
        <div class="post-actions">
            <button onclick="likePost('${post._id}')" class="${isLiked ? 'liked' : ''}">
                👍 Like (${post.likes ? post.likes.length : 0})
            </button>
            <button onclick="toggleComments('${post._id}')">
                💬 Comment (${post.comments ? post.comments.length : 0})
            </button>
            <button onclick="sharePost('${post._id}')">
                🔄 Share (${post.shares ? post.shares.length : 0})
            </button>
        </div>
        <div class="comments" id="comments-${post._id}" style="display:none;">
            ${commentsHTML}
            <div class="comment-form">
                <input type="text" id="comment-input-${post._id}" placeholder="Write a comment...">
                <button onclick="addComment('${post._id}')">Post</button>
            </div>
        </div>
    `;
    
    return div;
}

async function likePost(postId) {
    try {
        const response = await fetch(`${API_URL}/posts/${postId}/like`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            loadPosts();
        }
    } catch (error) {
        console.error('Failed to like post:', error);
    }
}

function toggleComments(postId) {
    const commentsDiv = document.getElementById(`comments-${postId}`);
    if (commentsDiv) {
        commentsDiv.style.display = commentsDiv.style.display === 'none' ? 'block' : 'none';
    }
}

async function addComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    if (!input) return;
    
    const text = input.value.trim();
    if (!text) return;

    try {
        const response = await fetch(`${API_URL}/posts/${postId}/comment`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text })
        });

        if (response.ok) {
            input.value = '';
            loadPosts();
        }
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
        showMessage(data.message || data.error, response.ok ? 'success' : 'error');
        if (response.ok) {
            loadPosts();
        }
    } catch (error) {
        console.error('Failed to share post:', error);
    }
}

function showFriendRequests() {
    window.location.href = 'friends.html';
}

function showSearchUsers() {
    window.location.href = 'friends.html';
}

function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
    messageDiv.textContent = message;
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '20px';
    messageDiv.style.right = '20px';
    messageDiv.style.zIndex = '9999';
    messageDiv.style.padding = '15px 25px';
    messageDiv.style.borderRadius = '8px';
    messageDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

async function checkExistingSession() {
    try {
        const response = await fetch(`${API_URL}/posts/check-limit`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            if (userInfo.username) {
                showMainApp(userInfo);
            }
        } else {
            throw new Error('Invalid token');
        }
    } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        token = null;
    }
}

async function addComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    if (!input) return;
    
    const text = input.value.trim();
    if (!text) return;

    try {
        const response = await fetch(`${API_URL}/posts/${postId}/comment`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text })
        });

        if (response.ok) {
            input.value = '';
            loadPosts();
        }
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
        showMessage(data.message || data.error, response.ok ? 'success' : 'error');
        if (response.ok) {
            loadPosts();
        }
    } catch (error) {
        console.error('Failed to share post:', error);
    }
}

function showFriendRequests() {
    window.location.href = 'friends.html';
}

function showSearchUsers() {
    window.location.href = 'friends.html';
}

function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
    messageDiv.textContent = message;
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '20px';
    messageDiv.style.right = '20px';
    messageDiv.style.zIndex = '9999';
    messageDiv.style.padding = '15px 25px';
    messageDiv.style.borderRadius = '8px';
    messageDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

async function checkExistingSession() {
    try {
        const response = await fetch(`${API_URL}/posts/check-limit`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            if (userInfo.username) {
                showMainApp(userInfo);
            }
        } else {
            throw new Error('Invalid token');
        }
    } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        token = null;
    }
}


// File preview functionality
document.getElementById('post-media').addEventListener('change', function(e) {
    const files = e.target.files;
    const preview = document.getElementById('file-preview');
    preview.innerHTML = '';
    
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const div = document.createElement('div');
            if (file.type.startsWith('image/')) {
                div.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            } else if (file.type.startsWith('video/')) {
                div.innerHTML = `<video src="${e.target.result}"></video>`;
            }
            preview.appendChild(div);
        };
        reader.readAsDataURL(file);
    });
});
