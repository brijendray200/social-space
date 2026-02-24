// Stories functionality

async function loadStories() {
    try {
        const response = await fetch(`${API_URL}/stories`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const storiesData = await response.json();
        
        const container = document.getElementById('stories-list');
        
        if (storiesData.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = storiesData.map(userStories => `
            <div class="story-card" onclick="viewStories('${userStories.user._id}')">
                <div class="story-avatar has-story">
                    ${userStories.user.username.charAt(0).toUpperCase()}
                </div>
                <span class="story-username">${userStories.user.username}</span>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load stories:', error);
    }
}

function showAddStoryModal() {
    document.getElementById('story-modal').style.display = 'flex';
}

function closeStoryModal() {
    document.getElementById('story-modal').style.display = 'none';
    document.getElementById('story-form').reset();
}

document.getElementById('story-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const mediaFile = document.getElementById('story-media').files[0];
    const caption = document.getElementById('story-caption').value;

    if (!mediaFile) {
        showMessage('Please select an image or video', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('media', mediaFile);
    formData.append('caption', caption);

    try {
        const response = await fetch(`${API_URL}/stories`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        const data = await response.json();
        if (response.ok) {
            showMessage('Story posted successfully!', 'success');
            closeStoryModal();
            loadStories();
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('Failed to post story: ' + error.message, 'error');
    }
});

let currentStories = [];
let currentStoryIndex = 0;

async function viewStories(userId) {
    try {
        const response = await fetch(`${API_URL}/stories`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const storiesData = await response.json();
        
        const userStories = storiesData.find(s => s.user._id === userId);
        if (!userStories) return;

        currentStories = userStories.stories;
        currentStoryIndex = 0;
        
        showStory(currentStories[currentStoryIndex]);
        document.getElementById('view-story-modal').style.display = 'flex';
    } catch (error) {
        console.error('Failed to view stories:', error);
    }
}

function showStory(story) {
    const container = document.getElementById('story-content');
    
    const mediaHTML = story.media.type === 'image' 
        ? `<img src="${story.media.url}" alt="Story" style="max-width: 100%; max-height: 80vh; border-radius: 12px;">`
        : `<video src="${story.media.url}" controls autoplay style="max-width: 100%; max-height: 80vh; border-radius: 12px;"></video>`;
    
    container.innerHTML = `
        <div style="text-align: center;">
            <div style="margin-bottom: 20px;">
                <strong style="color: white; font-size: 18px;">${story.user.username}</strong>
                <span style="color: #ccc; margin-left: 10px;">${new Date(story.createdAt).toLocaleString()}</span>
            </div>
            ${mediaHTML}
            ${story.caption ? `<p style="color: white; margin-top: 15px; font-size: 16px;">${story.caption}</p>` : ''}
            <div style="margin-top: 20px;">
                <button onclick="previousStory()" style="padding: 10px 20px; margin: 0 10px; background: white; border: none; border-radius: 8px; cursor: pointer;">← Previous</button>
                <button onclick="nextStory()" style="padding: 10px 20px; margin: 0 10px; background: white; border: none; border-radius: 8px; cursor: pointer;">Next →</button>
            </div>
            <p style="color: #ccc; margin-top: 10px;">👁️ ${story.views.length} views</p>
        </div>
    `;
    
    // Mark as viewed
    fetch(`${API_URL}/stories/${story._id}/view`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
}

function nextStory() {
    if (currentStoryIndex < currentStories.length - 1) {
        currentStoryIndex++;
        showStory(currentStories[currentStoryIndex]);
    } else {
        closeViewStoryModal();
    }
}

function previousStory() {
    if (currentStoryIndex > 0) {
        currentStoryIndex--;
        showStory(currentStories[currentStoryIndex]);
    }
}

function closeViewStoryModal() {
    document.getElementById('view-story-modal').style.display = 'none';
    currentStories = [];
    currentStoryIndex = 0;
}

// Load stories on page load
if (document.getElementById('stories-list')) {
    loadStories();
    // Refresh stories every 30 seconds
    setInterval(loadStories, 30000);
}
