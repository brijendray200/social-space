# 📋 Deployment Checklist

Follow this checklist step by step. Check ✅ each item as you complete it.

## Part 1: MongoDB Atlas (5 minutes)

- [ ] 1. Go to https://www.mongodb.com/cloud/atlas/register
- [ ] 2. Sign up with Google (fastest) or email
- [ ] 3. Create FREE M0 cluster
- [ ] 4. Create database user:
  - Username: `socialspace`
  - Password: _________________ (write it down!)
- [ ] 5. Add IP whitelist: `0.0.0.0/0`
- [ ] 6. Get connection string and save it here:
  ```
  mongodb+srv://socialspace:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/social-space?retryWrites=true&w=majority
  ```
  My connection string:
  ```
  _____________________________________________________________
  ```

## Part 2: Render Deployment (5 minutes)

- [ ] 7. Go to https://render.com
- [ ] 8. Sign up with GitHub
- [ ] 9. Authorize Render to access GitHub
- [ ] 10. Click "New +" → "Web Service"
- [ ] 11. Connect repository: `brijendray200/social-space`
- [ ] 12. Configure:
  - Name: `social-space`
  - Runtime: `Node`
  - Build: `npm install`
  - Start: `npm start`
  - Instance: `Free`
- [ ] 13. Add environment variables:
  - [ ] `MONGODB_URI` = (paste connection string from step 6)
  - [ ] `JWT_SECRET` = `social-space-secret-2024`
  - [ ] `NODE_ENV` = `production`
- [ ] 14. Click "Create Web Service"
- [ ] 15. Wait for deployment (5-10 minutes)
- [ ] 16. Check "Live" badge appears

## Part 3: Test Your App

- [ ] 17. Copy your Render URL: `https://social-space-_____.onrender.com`
- [ ] 18. Open URL in browser
- [ ] 19. Register a new account
- [ ] 20. Login
- [ ] 21. Create a post
- [ ] 22. Upload profile photo
- [ ] 23. Test all features

## ✅ Deployment Complete!

Your live app URL:
```
https://social-space-_____.onrender.com
```

Share this URL with friends! 🎉

---

## 🆘 Need Help?

If you get stuck:
1. Check Render logs (Dashboard → Logs)
2. Verify MongoDB connection string
3. Check environment variables are set correctly
4. Wait 1-2 minutes for app to wake up (free tier)

## 📱 Share Your App

Once deployed, share:
- Live URL: `https://social-space-_____.onrender.com`
- GitHub: `https://github.com/brijendray200/social-space`
- Features: Posts, Stories, Reels, Friends, Messages, Profile

---

**Total Time: ~10 minutes**
**Cost: FREE (MongoDB M0 + Render Free Tier)**
