# GitHub Setup Instructions

## Step 1: Create Repository on GitHub

1. Go to https://github.com/brijendray200
2. Click the **"+"** icon (top right) → **"New repository"**
3. Fill in details:
   - **Repository name:** `social-space`
   - **Description:** "Complete social media platform with posts, stories, reels, and friend-based posting limits"
   - **Visibility:** Choose Public or Private
   - **DO NOT** check "Initialize this repository with a README"
   - **DO NOT** add .gitignore or license (already exists)
4. Click **"Create repository"**

## Step 2: Push Code to GitHub

After creating the repository, run these commands in your terminal:

```bash
git push -u origin main
```

### If Authentication Required:

#### Option A: Personal Access Token (Recommended)

1. Go to GitHub Settings: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a name: "Social Space Deployment"
4. Select scopes:
   - ✅ **repo** (Full control of private repositories)
5. Click **"Generate token"**
6. **COPY THE TOKEN** (you won't see it again!)
7. When pushing, use:
   - Username: `brijendray200`
   - Password: `paste_your_token_here`

#### Option B: SSH Key

1. Generate SSH key:
```bash
ssh-keygen -t ed25519 -C "brijendray200@users.noreply.github.com"
```

2. Copy public key:
```bash
cat ~/.ssh/id_ed25519.pub
```

3. Add to GitHub:
   - Go to https://github.com/settings/keys
   - Click "New SSH key"
   - Paste the key
   - Save

4. Change remote URL:
```bash
git remote set-url origin git@github.com:brijendray200/social-space.git
git push -u origin main
```

## Step 3: Verify Upload

1. Go to https://github.com/brijendray200/social-space
2. You should see all your files
3. README.md should be displayed on the main page

## Step 4: Deploy to Render (Free Hosting)

### Create Render Account
1. Go to https://render.com
2. Sign up with GitHub account
3. Authorize Render to access your repositories

### Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your repository: `brijendray200/social-space`
3. Configure:
   - **Name:** `social-space`
   - **Environment:** `Node`
   - **Branch:** `main`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`

### Add Environment Variables
Click **"Advanced"** → **"Add Environment Variable"**

Add these variables:

```
MONGODB_URI = your_mongodb_atlas_connection_string
JWT_SECRET = your_random_secret_key_here
PORT = 5000
```

### Get MongoDB Connection String

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up / Login
3. Create a **FREE** cluster (M0)
4. Create database user:
   - Database Access → Add New User
   - Username: `socialspace`
   - Password: (generate strong password)
   - Save password!
5. Whitelist IP:
   - Network Access → Add IP Address
   - Enter: `0.0.0.0/0` (allow from anywhere)
6. Get connection string:
   - Clusters → Connect
   - Connect your application
   - Copy connection string
   - Replace `<password>` with your database password
   - Replace `<dbname>` with `social-space`

Example:
```
mongodb+srv://socialspace:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/social-space?retryWrites=true&w=majority
```

### Deploy
1. Click **"Create Web Service"**
2. Wait 5-10 minutes for deployment
3. You'll get a URL like: `https://social-space.onrender.com`

### Test Your Deployment
1. Visit your Render URL
2. Create a test account
3. Test all features

## Step 5: Update Repository with Deployment URL

Add the deployment URL to your README:

```bash
git pull origin main
# Edit README.md and add:
# Live Demo: https://social-space.onrender.com

git add README.md
git commit -m "Add live demo URL"
git push origin main
```

## Troubleshooting

### Push Failed - Authentication
- Use Personal Access Token as password
- Or set up SSH key

### Render Deployment Failed
- Check logs in Render dashboard
- Verify environment variables are set
- Check MongoDB connection string

### MongoDB Connection Error
- Verify connection string is correct
- Check IP whitelist (0.0.0.0/0)
- Verify database user credentials

### App Not Loading
- Check Render logs for errors
- Verify PORT environment variable
- Check if MongoDB is connected

## Alternative Deployment Options

### Railway (Also Free)
1. Go to https://railway.app
2. Sign up with GitHub
3. New Project → Deploy from GitHub
4. Select `social-space` repository
5. Add MongoDB from Railway
6. Add environment variables
7. Deploy

### Heroku (Paid after Nov 2022)
```bash
heroku create social-space-app
heroku addons:create mongolab:sandbox
git push heroku main
```

## Need Help?

- Check Render documentation: https://render.com/docs
- MongoDB Atlas docs: https://docs.atlas.mongodb.com
- Create issue on GitHub: https://github.com/brijendray200/social-space/issues

---

**Important Notes:**
- Free tier on Render may sleep after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds to wake up
- MongoDB Atlas free tier has 512MB storage limit
- Keep your JWT_SECRET and database credentials secure!

Good luck! 🚀
