const API_URL = 'http://localhost:5000/api';
let token = localStorage.getItem('token');

if (!token) {
    window.location.href = '/';
}

let currentTab = 'posts';

function goBack() {
    window.history.back();
}

async function loadProfile() {
    try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const userId = userInfo.id;

        // Get profile data
        const profileResponse = await fetch(`${API_URL}/users/profile/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const profile = await profileResponse.json();

        // Get stats
        const statsResponse = await fetch(`${API_URL}/users/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const stats = await statsResponse.json();

        // Update UI
        document.getElementById('profile-username').textContent = profile.username;
        document.getElementById('profile-bio').textContent = profile.bio || 'No bio yet';
        document.getElementById('profile-location').textContent = profile.location || 'Not specified';
        document.getElementById('profile-website').textContent = profile.website || 'No website';
        document.getElementById('profile-website').href = profile.website || '#';
        document.getElementById('profile-joined').textContent = new Date(profile.createdAt).toLocaleDateString();

        // Update avatar
        if (profile.profilePicture) {
            document.getElementById('profile-avatar').src = profile.profilePicture;
        }

        // Update cover photo
        if (profile.coverPhoto) {
            document.getElementById('cover-photo').src = profile.coverPhoto;
        }

        // Update stats
        document.getElementById('post-count').textContent = stats.postCount;
        document.getElementById('followers-count').textContent = stats.followersCount;
        document.getElementById('following-count').textContent = stats.followingCount;
        document.getElementById('friend-count').textContent = stats.friendCount;

        // Load posts
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
        const photosContainer = document.getElementById('user-photos');
        const videosContainer = document.getElementById('user-videos');
        
        if (posts.length === 0) {
            container.innerHTML = '<p class="empty-state"><i class="fas fa-image"></i><br>No posts yet</p>';
            return;
        }

        container.innerHTML = '';
        photosContainer.innerHTML = '';
        videosContainer.innerHTML = '';

        posts.forEach(post => {
            // Posts grid
            const postCard = createPostCard(post);
            container.appendChild(postCard);

            // Photos and videos
            if (post.media && post.media.length > 0) {
                post.media.forEach(m => {
                    const mediaCard = document.createElement('div');
                    mediaCard.className = 'media-card';
                    
                    if (m.type === 'image') {
                        mediaCard.innerHTML = `<img src="${m.url}" alt="Photo" onclick="openMediaModal('${m.url}', 'image')">`;
                        photosContainer.appendChild(mediaCard.cloneNode(true));
                    } else {
                        mediaCard.innerHTML = `<video src="${m.url}" onclick="openMediaModal('${m.url}', 'video')"></video>`;
                        videosContainer.appendChild(mediaCard.cloneNode(true));
                    }
                });
            }
        });

        if (photosContainer.children.length === 0) {
            photosContainer.innerHTML = '<p class="empty-state"><i class="fas fa-images"></i><br>No photos yet</p>';
        }
        if (videosContainer.children.length === 0) {
            videosContainer.innerHTML = '<p class="empty-state"><i class="fas fa-video"></i><br>No videos yet</p>';
        }

    } catch (error) {
        console.error('Failed to load posts:', error);
    }
}

function createPostCard(post) {
    const div = document.createElement('div');
    div.className = 'post-card';
    
    const mediaHTML = post.media && post.media.length > 0 ? 
        (post.media[0].type === 'image' ? 
            `<img src="${post.media[0].url}" alt="Post">` : 
            `<video src="${post.media[0].url}"></video>`) : 
        '<div class="no-media"><i class="fas fa-file-alt"></i></div>';

    div.innerHTML = `
        ${mediaHTML}
        <div class="post-card-overlay">
            <div class="post-card-stats">
                <span><i class="fas fa-heart"></i> ${post.likes ? post.likes.length : 0}</span>
                <span><i class="fas fa-comment"></i> ${post.comments ? post.comments.length : 0}</span>
            </div>
            <p class="post-card-content">${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}</p>
            <button class="delete-post-btn" onclick="deletePost('${post._id}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return div;
}

async function loadUserFriends() {
    try {
        const response = await fetch(`${API_URL}/users/friends`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const friends = await response.json();
        
        const container = document.getElementById('user-friends');
        
        if (friends.length === 0) {
            container.innerHTML = '<p class="empty-state"><i class="fas fa-user-friends"></i><br>No friends yet</p>';
            return;
        }

        container.innerHTML = friends.map(friend => `
            <div class="friend-card-profile">
                <img src="${friend.profilePicture || 'https://ui-avatars.com/api/?name=' + friend.username}" alt="${friend.username}">
                <h4>${friend.username}</h4>
                <button onclick="removeFriend('${friend._id}')" class="ripple">
                    <i class="fas fa-user-minus"></i> Remove
                </button>
            </div>
        `).join('');

    } catch (error) {
        console.error('Failed to load friends:', error);
    }
}

async function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
        const response = await fetch(`${API_URL}/posts/${postId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            showMessage('Post deleted successfully', 'success');
            loadUserPosts();
        }
    } catch (error) {
        showMessage('Failed to delete post', 'error');
    }
}

async function removeFriend(friendId) {
    if (!confirm('Remove this friend?')) return;

    try {
        const response = await fetch(`${API_URL}/users/friend/${friendId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            showMessage('Friend removed', 'success');
            loadUserFriends();
            loadProfile();
        }
    } catch (error) {
        showMessage('Failed to remove friend', 'error');
    }
}

async function uploadProfilePicture(input) {
    if (!input.files || !input.files[0]) return;

    const formData = new FormData();
    formData.append('profilePicture', input.files[0]);

    try {
        const response = await fetch(`${API_URL}/users/profile-picture`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        const data = await response.json();
        if (response.ok) {
            document.getElementById('profile-avatar').src = data.profilePicture;
            showMessage('Profile picture updated!', 'success');
        }
    } catch (error) {
        showMessage('Failed to upload picture', 'error');
    }
}

async function uploadCoverPhoto(input) {
    if (!input.files || !input.files[0]) return;

    const formData = new FormData();
    formData.append('coverPhoto', input.files[0]);

    try {
        const response = await fetch(`${API_URL}/users/cover-photo`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        const data = await response.json();
        if (response.ok) {
            document.getElementById('cover-photo').src = data.coverPhoto;
            showMessage('Cover photo updated!', 'success');
        }
    } catch (error) {
        showMessage('Failed to upload cover photo', 'error');
    }
}

function showTab(tabName) {
    currentTab = tabName;
    
    // Update tabs
    document.querySelectorAll('.profile-tab').forEach(tab => tab.classList.remove('active'));
    event.target.closest('.profile-tab').classList.add('active');
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

function showEditModal() {
    document.getElementById('edit-modal').style.display = 'block';
    
    // Pre-fill form
    document.getElementById('edit-bio').value = document.getElementById('profile-bio').textContent;
    document.getElementById('edit-location').value = document.getElementById('profile-location').textContent;
    document.getElementById('edit-website').value = document.getElementById('profile-website').textContent;
}

function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
}

document.getElementById('edit-profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const bio = document.getElementById('edit-bio').value;
    const location = document.getElementById('edit-location').value;
    const website = document.getElementById('edit-website').value;

    try {
        const response = await fetch(`${API_URL}/users/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ bio, location, website })
        });

        if (response.ok) {
            showMessage('Profile updated!', 'success');
            closeEditModal();
            loadProfile();
        }
    } catch (error) {
        showMessage('Failed to update profile', 'error');
    }
});

function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    setTimeout(() => messageDiv.remove(), 3000);
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    window.location.href = '/';
}

// Initialize
loadProfile();
