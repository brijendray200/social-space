const API_URL = 'http://localhost:5000/api';
let token = localStorage.getItem('token');
let currentUser = null;

// Check token on page load
window.addEventListener('DOMContentLoaded', () => {
    if (!token) {
        console.log('No token found, redirecting to login...');
        setTimeout(() => {
            window.location.href = '/';
        }, 100);
        return;
    }
    
    // Load profile if token exists
    loadProfile();
});

// Show success message
function showSuccess(message) {
    const div = document.createElement('div');
    div.className = 'success-message';
    div.textContent = message;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

// Show error message
function showError(message) {
    const div = document.createElement('div');
    div.className = 'error-message';
    div.textContent = message;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

// Show loading
function showLoading() {
    const div = document.createElement('div');
    div.className = 'loading-overlay';
    div.innerHTML = '<div class="loading-spinner"></div>';
    div.id = 'loading-overlay';
    document.body.appendChild(div);
}

// Hide loading
function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.remove();
}

// Load Profile Data
async function loadProfile() {
    try {
        showLoading();
        
        // Get user info from localStorage or fetch from API
        let userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        
        console.log('Loading profile...', userInfo);
        
        // If no userInfo, fetch from API
        if (!userInfo.id) {
            console.log('No userInfo in localStorage, fetching from API...');
            const response = await fetch(`${API_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                userInfo = await response.json();
                localStorage.setItem('userInfo', JSON.stringify(userInfo));
                console.log('Fetched user info from API:', userInfo);
            } else {
                console.error('Failed to fetch user info:', response.status);
            }
        }
        
        currentUser = userInfo;
        
        console.log('Setting profile data:', {
            username: userInfo.username,
            name: userInfo.name,
            bio: userInfo.bio,
            profilePicture: userInfo.profilePicture
        });
        
        // Set profile info
        document.getElementById('header-username').textContent = userInfo.username || 'username';
        document.getElementById('profile-name').textContent = userInfo.name || userInfo.username || 'Add your name';
        document.getElementById('profile-bio').textContent = userInfo.bio || 'Add a bio to tell people about yourself...';
        
        if (userInfo.website) {
            document.getElementById('profile-link').textContent = '🔗 ' + userInfo.website;
            document.getElementById('profile-link').href = userInfo.website;
            document.getElementById('profile-link').style.display = 'inline-block';
        } else {
            document.getElementById('profile-link').style.display = 'none';
        }
        
        if (userInfo.profilePicture) {
            console.log('Setting profile picture:', userInfo.profilePicture);
            document.getElementById('profile-picture').src = userInfo.profilePicture;
            // Update nav profile pic too
            const navPic = document.getElementById('nav-profile-pic');
            if (navPic) navPic.src = userInfo.profilePicture;
        } else {
            console.log('No profile picture, using placeholder');
            document.getElementById('profile-picture').src = 'https://via.placeholder.com/150/262626/ffffff?text=No+Photo';
        }

        // Load stats
        const statsResponse = await fetch(`${API_URL}/users/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            console.log('Stats loaded:', stats);
            
            document.getElementById('posts-stat').textContent = stats.postCount || 0;
            document.getElementById('followers-stat').textContent = stats.friendCount || 0;
            document.getElementById('following-stat').textContent = stats.friendCount || 0;
        }

        hideLoading();
        
        // Load posts
        loadPosts();
        
        // Load highlights
        loadHighlights();
        
    } catch (error) {
        console.error('Failed to load profile:', error);
        hideLoading();
        showError('Failed to load profile. Please refresh the page.');
    }
}

// Load Posts Grid
async function loadPosts() {
    try {
        const response = await fetch(`${API_URL}/posts/my-posts`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const container = document.getElementById('posts-grid');
        
        if (!response.ok) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📷</div>
                    <p>Failed to load posts</p>
                </div>
            `;
            return;
        }
        
        const posts = await response.json();
        
        if (posts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📷</div>
                    <p>No posts yet</p>
                    <button class="empty-action-btn" onclick="window.location.href='index.html'">Create your first post</button>
                </div>
            `;
            return;
        }

        container.innerHTML = posts.map(post => {
            const media = post.media && post.media[0];
            const mediaUrl = media ? media.url : 'https://via.placeholder.com/300/262626/ffffff?text=No+Image';
            
            return `
                <div class="grid-item" onclick="viewPost('${post._id}')">
                    <img src="${mediaUrl}" alt="Post" onerror="this.src='https://via.placeholder.com/300/262626/ffffff?text=No+Image'">
                    <div class="grid-item-overlay">
                        <span class="overlay-stat">❤️ ${post.likes ? post.likes.length : 0}</span>
                        <span class="overlay-stat">💬 ${post.comments ? post.comments.length : 0}</span>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Failed to load posts:', error);
        document.getElementById('posts-grid').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">❌</div>
                <p>Failed to load posts</p>
                <button class="empty-action-btn" onclick="loadPosts()">Retry</button>
            </div>
        `;
    }
}

function viewPost(postId) {
    // Open post detail view
    showSuccess('Post detail view coming soon!');
}

// Tab Switching
document.querySelectorAll('.tab-item').forEach((tab, index) => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        if (index === 0) {
            loadPosts();
        } else if (index === 1) {
            loadReels();
        } else if (index === 2) {
            loadVideos();
        } else if (index === 3) {
            loadTagged();
        }
    });
});

async function loadReels() {
    try {
        const response = await fetch(`${API_URL}/reels`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const reels = await response.json();
        
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const myReels = reels.filter(r => r.user._id === userInfo.id);
        
        const container = document.getElementById('posts-grid');
        
        if (myReels.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎬</div>
                    <p>No reels yet</p>
                </div>
            `;
            return;
        }

        container.innerHTML = myReels.map(reel => `
            <div class="grid-item">
                <img src="${reel.video}" alt="Reel">
                <div class="grid-item-overlay">
                    <span class="overlay-stat">❤️ ${reel.likes.length}</span>
                    <span class="overlay-stat">💬 ${reel.comments.length}</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load reels:', error);
    }
}

function loadVideos() {
    document.getElementById('posts-grid').innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">📹</div>
            <p>No videos yet</p>
        </div>
    `;
}

function loadTagged() {
    document.getElementById('posts-grid').innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">👤</div>
            <p>No tagged posts yet</p>
        </div>
    `;
}

// Navigation
document.querySelectorAll('.nav-item').forEach((item, index) => {
    item.addEventListener('click', () => {
        if (index === 0) {
            window.location.href = 'index.html';
        } else if (index === 1) {
            // Search page
        } else if (index === 2) {
            // Create post
        } else if (index === 3) {
            // Reels page
        } else if (index === 4) {
            // Profile (current page)
        }
    });
});


// ========== EDIT PROFILE MODAL ==========

function openEditProfileModal() {
    const modal = document.getElementById('edit-profile-modal');
    modal.classList.add('active');
    
    // Pre-fill form with current data
    document.getElementById('edit-name').value = currentUser.name || '';
    document.getElementById('edit-username').value = currentUser.username || '';
    document.getElementById('edit-bio').value = currentUser.bio || '';
    document.getElementById('edit-website').value = currentUser.website || '';
    document.getElementById('edit-location').value = currentUser.location || '';
    
    updateBioCharCount();
}

function closeEditProfileModal() {
    const modal = document.getElementById('edit-profile-modal');
    modal.classList.remove('active');
}

function updateBioCharCount() {
    const bioInput = document.getElementById('edit-bio');
    const charCount = document.getElementById('bio-char-count');
    charCount.textContent = `${bioInput.value.length}/150`;
}

// Bio character count update
document.addEventListener('DOMContentLoaded', () => {
    const bioInput = document.getElementById('edit-bio');
    if (bioInput) {
        bioInput.addEventListener('input', updateBioCharCount);
    }
});

// Handle edit profile form submission
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('edit-profile-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('edit-name').value.trim();
            const username = document.getElementById('edit-username').value.trim();
            const bio = document.getElementById('edit-bio').value.trim();
            const website = document.getElementById('edit-website').value.trim();
            const location = document.getElementById('edit-location').value.trim();
            
            if (!username) {
                showError('Username is required');
                return;
            }
            
            if (username.length < 3) {
                showError('Username must be at least 3 characters');
                return;
            }
            
            showLoading();
            
            try {
                const response = await fetch(`${API_URL}/users/profile`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ name, username, bio, website, location })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || 'Failed to update profile');
                }
                
                // Update localStorage
                const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
                userInfo.name = data.name;
                userInfo.username = data.username;
                userInfo.bio = data.bio;
                userInfo.website = data.website;
                userInfo.location = data.location;
                localStorage.setItem('userInfo', JSON.stringify(userInfo));
                
                currentUser = userInfo;
                
                // Update UI
                document.getElementById('header-username').textContent = data.username;
                document.getElementById('profile-name').textContent = data.name || data.username;
                document.getElementById('profile-bio').textContent = data.bio || 'Bio text goes here...';
                
                if (data.website) {
                    document.getElementById('profile-link').textContent = '🔗 ' + data.website;
                    document.getElementById('profile-link').href = data.website;
                    document.getElementById('profile-link').style.display = 'inline-block';
                } else {
                    document.getElementById('profile-link').style.display = 'none';
                }
                
                hideLoading();
                closeEditProfileModal();
                showSuccess('Profile updated successfully!');
                
            } catch (error) {
                hideLoading();
                showError(error.message);
            }
        });
    }
});

// ========== CHANGE PHOTO MODAL ==========

function openChangePhotoModal() {
    const modal = document.getElementById('change-photo-modal');
    modal.classList.add('active');
}

function closeChangePhotoModal() {
    const modal = document.getElementById('change-photo-modal');
    modal.classList.remove('active');
}

// View profile photo
function viewProfilePhoto() {
    closeChangePhotoModal();
    
    const currentPhoto = document.getElementById('profile-picture').src;
    
    // Check if it's a placeholder
    if (currentPhoto.includes('placeholder')) {
        showError('No profile photo to view');
        return;
    }
    
    const modal = document.getElementById('view-photo-modal');
    const img = document.getElementById('view-photo-img');
    img.src = currentPhoto;
    modal.classList.add('active');
}

function closeViewPhotoModal() {
    const modal = document.getElementById('view-photo-modal');
    modal.classList.remove('active');
}

// Upload profile photo
async function uploadProfilePhoto(event) {
    const file = event.target.files[0];
    
    console.log('Upload photo called, file:', file);
    
    if (!file) {
        console.log('No file selected');
        return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showError('Please select an image file');
        console.error('Invalid file type:', file.type);
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showError('Image size must be less than 5MB');
        console.error('File too large:', file.size);
        return;
    }
    
    console.log('File validation passed, uploading...');
    showLoading();
    closeChangePhotoModal();
    
    try {
        const formData = new FormData();
        formData.append('profilePicture', file);
        
        console.log('Sending request to:', `${API_URL}/users/profile-picture`);
        
        const response = await fetch(`${API_URL}/users/profile-picture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to upload photo');
        }
        
        // Update localStorage
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        userInfo.profilePicture = data.profilePicture;
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        
        currentUser = userInfo;
        
        console.log('Updated userInfo:', userInfo);
        
        // Update UI
        document.getElementById('profile-picture').src = data.profilePicture;
        
        // Update nav profile pic
        const navPic = document.getElementById('nav-profile-pic');
        if (navPic) navPic.src = data.profilePicture;
        
        hideLoading();
        showSuccess('Profile photo updated!');
        
    } catch (error) {
        console.error('Upload error:', error);
        hideLoading();
        showError(error.message);
    }
    
    // Reset input
    event.target.value = '';
}

// Remove profile photo
async function removeProfilePhoto() {
    if (!confirm('Are you sure you want to remove your profile photo?')) {
        return;
    }
    
    showLoading();
    closeChangePhotoModal();
    
    try {
        const response = await fetch(`${API_URL}/users/profile-picture`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to remove photo');
        }
        
        // Update localStorage
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        userInfo.profilePicture = '';
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        
        currentUser = userInfo;
        
        // Update UI
        document.getElementById('profile-picture').src = 'https://via.placeholder.com/150';
        
        hideLoading();
        showSuccess('Profile photo removed');
        
    } catch (error) {
        hideLoading();
        showError(error.message);
    }
}

// Share profile
function shareProfile() {
    const username = currentUser.username || 'user';
    const url = `${window.location.origin}/instagram-profile.html?user=${username}`;
    
    if (navigator.share) {
        navigator.share({
            title: `${username}'s Profile`,
            text: `Check out ${username}'s profile on Social Space!`,
            url: url
        }).catch(() => {
            copyToClipboard(url);
        });
    } else {
        copyToClipboard(url);
    }
}

function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showSuccess('Profile link copied to clipboard!');
}

// Close modals on outside click
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// Close modals on Escape key
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }
});


// ========== SETTINGS PAGE ==========

function openSettingsPage() {
    const modal = document.getElementById('settings-modal');
    modal.classList.add('active');
}

function closeSettingsPage() {
    const modal = document.getElementById('settings-modal');
    modal.classList.remove('active');
}

function openEditProfileFromSettings() {
    closeSettingsPage();
    openEditProfileModal();
}

function openChangePhotoFromSettings() {
    closeSettingsPage();
    openChangePhotoModal();
}

// ========== BIO EDITOR ==========

function openBioEditor() {
    closeSettingsPage();
    const modal = document.getElementById('bio-editor-modal');
    modal.classList.add('active');
    
    // Pre-fill with current bio
    const bioTextarea = document.getElementById('bio-editor-textarea');
    bioTextarea.value = currentUser.bio || '';
    updateBioEditorCount();
}

function closeBioEditor() {
    const modal = document.getElementById('bio-editor-modal');
    modal.classList.remove('active');
}

function updateBioEditorCount() {
    const bioTextarea = document.getElementById('bio-editor-textarea');
    const counter = document.getElementById('bio-editor-count');
    counter.textContent = bioTextarea.value.length;
}

// Bio editor character count
document.addEventListener('DOMContentLoaded', () => {
    const bioTextarea = document.getElementById('bio-editor-textarea');
    if (bioTextarea) {
        bioTextarea.addEventListener('input', updateBioEditorCount);
    }
});

// Save bio only
async function saveBioOnly() {
    const bio = document.getElementById('bio-editor-textarea').value.trim();
    
    showLoading();
    
    try {
        const response = await fetch(`${API_URL}/users/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                name: currentUser.name,
                username: currentUser.username,
                bio: bio,
                website: currentUser.website,
                location: currentUser.location
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to update bio');
        }
        
        // Update localStorage
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        userInfo.bio = data.bio;
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        
        currentUser = userInfo;
        
        // Update UI
        document.getElementById('profile-bio').textContent = data.bio || 'Bio text goes here...';
        
        hideLoading();
        closeBioEditor();
        showSuccess('Bio updated successfully!');
        
    } catch (error) {
        hideLoading();
        showError(error.message);
    }
}

// ========== PASSWORD CHANGE ==========

function openPasswordChange() {
    closeSettingsPage();
    const modal = document.getElementById('password-modal');
    modal.classList.add('active');
}

function closePasswordChange() {
    const modal = document.getElementById('password-modal');
    modal.classList.remove('active');
    document.getElementById('password-form').reset();
}

// Handle password change form
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('password-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            if (newPassword !== confirmPassword) {
                showError('New passwords do not match');
                return;
            }
            
            if (newPassword.length < 6) {
                showError('Password must be at least 6 characters');
                return;
            }
            
            showLoading();
            
            try {
                const response = await fetch(`${API_URL}/auth/change-password`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ currentPassword, newPassword })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || 'Failed to change password');
                }
                
                hideLoading();
                closePasswordChange();
                showSuccess('Password changed successfully!');
                
            } catch (error) {
                hideLoading();
                showError(error.message);
            }
        });
    }
});

// ========== OTHER SETTINGS FUNCTIONS ==========

function openPrivacySettings() {
    closeSettingsPage();
    showSuccess('Privacy settings coming soon!');
}

function openNotificationSettings() {
    closeSettingsPage();
    showSuccess('Notification settings coming soon!');
}

function openSavedPosts() {
    closeSettingsPage();
    showSuccess('Saved posts coming soon!');
}

function openArchive() {
    closeSettingsPage();
    showSuccess('Archive coming soon!');
}

function openAbout() {
    closeSettingsPage();
    alert('Social Space\nVersion 1.0.0\n\nA complete social media platform with Instagram-style design.\n\nMade with ❤️');
}

function openHelp() {
    closeSettingsPage();
    alert('Help & Support\n\nFor help, please contact:\nsupport@socialspace.com\n\nOr visit our help center at:\nhttps://help.socialspace.com');
}

function logoutUser() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        window.location.href = '/';
    }
}


// ========== HIGHLIGHTS ==========

function loadHighlights() {
    const container = document.getElementById('highlights-list');
    
    // Sample highlights (you can load from API later)
    const highlights = currentUser.highlights || [];
    
    if (highlights.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = highlights.map(highlight => `
        <div class="highlight-item">
            <div class="highlight-circle">
                <img src="${highlight.cover || 'https://via.placeholder.com/80'}" alt="${highlight.title}">
            </div>
            <span class="highlight-label">${highlight.title}</span>
        </div>
    `).join('');
}

function createNewHighlight() {
    showSuccess('Create highlight feature coming soon!');
}
