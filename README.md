# Social Space - Connect with Friends

A complete social media platform built with Node.js, Express, MongoDB, and vanilla JavaScript.

## Features

### 🎯 Core Features
- **User Authentication** - Login, Register, Forgot Password with OTP
- **Posts** - Create posts with photos/videos, like, comment, share
- **Stories** - 24-hour stories with media
- **Reels** - Short video content
- **Friends System** - Send/accept friend requests
- **Messages** - Real-time messaging between friends
- **Notifications** - Get notified about likes, comments, friend requests
- **Profile** - Customizable profile with photo, bio, stats

### 📊 Smart Features
- **Friend-based Posting Limits**
  - 0 friends = No posts allowed
  - 1 friend = 1 post per day
  - 2 friends = 2 posts per day
  - 10+ friends = Unlimited posts
- **Profile Photo Upload** - Upload, change, or remove profile pictures
- **Media Upload** - Support for images and videos
- **Responsive Design** - Works on desktop and mobile

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Multer for file uploads
- Nodemailer for emails

### Frontend
- Vanilla JavaScript
- HTML5
- CSS3
- Responsive Design

## Installation

1. Clone the repository:
```bash
git clone https://github.com/brijendray200/social-space.git
cd social-space
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

4. Start the server:
```bash
npm start
```

5. Open your browser and navigate to:
```
http://localhost:5000
```

## Test Account

For testing purposes, you can create a test user:
```bash
node create-test-user.js
```

Test credentials:
- Email: test@example.com
- Password: test123

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Send OTP for password reset
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/reset-password` - Reset password

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create new post
- `GET /api/posts/my-posts` - Get user's posts
- `POST /api/posts/:id/like` - Like a post
- `POST /api/posts/:id/comment` - Comment on a post
- `POST /api/posts/:id/share` - Share a post

### Users
- `GET /api/users/stats` - Get user statistics
- `GET /api/users/friends` - Get user's friends
- `POST /api/users/profile-picture` - Upload profile picture
- `DELETE /api/users/profile-picture` - Remove profile picture

### Stories
- `GET /api/stories` - Get all stories
- `POST /api/stories` - Create new story

### Reels
- `GET /api/reels` - Get all reels
- `POST /api/reels` - Create new reel
- `POST /api/reels/:id/like` - Like a reel

### Messages
- `GET /api/messages/conversations` - Get all conversations
- `GET /api/messages/:userId` - Get messages with a user
- `POST /api/messages` - Send a message
- `GET /api/messages/unread/count` - Get unread message count

### Notifications
- `GET /api/notifications` - Get all notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all as read

## Project Structure

```
social-space/
├── config/
│   └── database.js          # MongoDB configuration
├── middleware/
│   ├── auth.js              # JWT authentication middleware
│   └── upload.js            # Multer file upload configuration
├── models/
│   ├── User.js              # User model
│   ├── Post.js              # Post model
│   ├── Story.js             # Story model
│   ├── Reel.js              # Reel model
│   ├── Message.js           # Message model
│   └── Notification.js      # Notification model
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── posts.js             # Post routes
│   ├── users.js             # User routes
│   ├── stories.js           # Story routes
│   ├── reels.js             # Reel routes
│   ├── messages.js          # Message routes
│   └── notifications.js     # Notification routes
├── public/
│   ├── index.html           # Main app page
│   ├── main-app.js          # Main app JavaScript
│   └── main-style.css       # Main app styles
├── utils/
│   ├── validators.js        # Input validation
│   ├── errorHandler.js      # Error handling
│   ├── postLimits.js        # Post limit logic
│   ├── sendEmail.js         # Email sending
│   └── createNotification.js # Notification creation
├── uploads/                 # Uploaded files directory
├── .env                     # Environment variables
├── .gitignore              # Git ignore file
├── package.json            # Dependencies
└── server.js               # Main server file
```

## Features in Detail

### Friend-Based Posting System
The platform implements a unique friend-based posting limit system:
- Encourages users to make friends
- Prevents spam from users with no connections
- Gradually increases posting privileges as users build their network

### Profile Management
- Upload profile photos (max 5MB)
- Update bio (150 characters)
- Change password
- View statistics (friends, posts, likes)

### Media Handling
- Support for multiple image formats
- Video upload for posts and reels
- Automatic file validation
- Secure file storage

## Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Input validation
- File type and size validation
- Protected API routes

## Future Enhancements
- [ ] Real-time chat with Socket.io
- [ ] Video calls
- [ ] Groups and communities
- [ ] Hashtags and trending topics
- [ ] Advanced search
- [ ] Dark mode
- [ ] Push notifications
- [ ] Story highlights
- [ ] Post scheduling

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Author
**Brijendra Yadav**
- GitHub: [@brijendray200](https://github.com/brijendray200)

## Support
For support, email brijendray200@users.noreply.github.com or create an issue in the repository.

---

Made with ❤️ by Brijendra Yadav
# social-space
