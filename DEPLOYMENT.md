# Deployment Guide

This guide will help you deploy the Social Space application to various platforms.

## Prerequisites
- Node.js 14+ installed
- MongoDB database (local or cloud)
- Git installed
- GitHub account

## Environment Variables

Create a `.env` file with the following variables:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# JWT Secret
JWT_SECRET=your_random_secret_key_here

# Server Port
PORT=5000

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
```

## Deployment Options

### 1. Render (Recommended - Free Tier Available)

1. **Create a Render account** at https://render.com

2. **Create a new Web Service**
   - Connect your GitHub repository
   - Select the repository: `brijendray200/social-space`

3. **Configure the service**
   - Name: `social-space`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: `Free`

4. **Add Environment Variables**
   - Go to Environment tab
   - Add all variables from `.env` file

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete

6. **MongoDB Setup**
   - Use MongoDB Atlas (free tier)
   - Get connection string
   - Add to MONGODB_URI in Render environment variables

### 2. Heroku

1. **Install Heroku CLI**
```bash
npm install -g heroku
```

2. **Login to Heroku**
```bash
heroku login
```

3. **Create Heroku app**
```bash
heroku create social-space-app
```

4. **Add MongoDB**
```bash
heroku addons:create mongolab:sandbox
```

5. **Set environment variables**
```bash
heroku config:set JWT_SECRET=your_secret_key
heroku config:set PORT=5000
```

6. **Deploy**
```bash
git push heroku main
```

7. **Open app**
```bash
heroku open
```

### 3. Railway

1. **Create Railway account** at https://railway.app

2. **Create new project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `brijendray200/social-space`

3. **Add MongoDB**
   - Click "New"
   - Select "Database"
   - Choose "MongoDB"
   - Copy connection string

4. **Configure environment variables**
   - Go to Variables tab
   - Add all environment variables
   - Use Railway MongoDB connection string

5. **Deploy**
   - Railway will automatically deploy
   - Get the public URL

### 4. Vercel (Frontend Only)

Note: Vercel is primarily for frontend. For full-stack, use Render or Railway.

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Deploy**
```bash
vercel
```

3. **Follow prompts**
   - Link to existing project or create new
   - Configure settings
   - Deploy

### 5. DigitalOcean App Platform

1. **Create DigitalOcean account**

2. **Create new app**
   - Connect GitHub repository
   - Select `brijendray200/social-space`

3. **Configure**
   - Detected as Node.js app
   - Build Command: `npm install`
   - Run Command: `npm start`

4. **Add environment variables**
   - Add all variables from `.env`

5. **Add MongoDB**
   - Use MongoDB Atlas or DigitalOcean Managed Database

6. **Deploy**
   - Click "Create Resources"

## MongoDB Atlas Setup (Free Tier)

1. **Create account** at https://www.mongodb.com/cloud/atlas

2. **Create cluster**
   - Choose free tier (M0)
   - Select region closest to your deployment

3. **Create database user**
   - Database Access → Add New Database User
   - Set username and password
   - Save credentials

4. **Whitelist IP**
   - Network Access → Add IP Address
   - Allow access from anywhere: `0.0.0.0/0`

5. **Get connection string**
   - Clusters → Connect
   - Choose "Connect your application"
   - Copy connection string
   - Replace `<password>` with your database password

6. **Add to environment variables**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/social-space?retryWrites=true&w=majority
```

## Post-Deployment Steps

1. **Test the application**
   - Visit the deployed URL
   - Create a test account
   - Test all features

2. **Create test user**
   - SSH into your deployment or use console
   - Run: `node create-test-user.js`

3. **Monitor logs**
   - Check deployment platform logs
   - Monitor for errors

4. **Set up custom domain** (Optional)
   - Purchase domain
   - Configure DNS settings
   - Add domain in deployment platform

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check MONGODB_URI is correct
   - Verify IP whitelist in MongoDB Atlas
   - Check database user credentials

2. **Port Issues**
   - Ensure PORT environment variable is set
   - Use `process.env.PORT || 5000` in server.js

3. **File Upload Issues**
   - Check uploads directory exists
   - Verify write permissions
   - Consider using cloud storage (AWS S3, Cloudinary)

4. **Environment Variables Not Loading**
   - Verify .env file exists
   - Check variable names match exactly
   - Restart the application

### Logs

Check logs in your deployment platform:
- **Render**: Dashboard → Logs
- **Heroku**: `heroku logs --tail`
- **Railway**: Dashboard → Deployments → Logs
- **DigitalOcean**: App → Runtime Logs

## Performance Optimization

1. **Enable compression**
```javascript
const compression = require('compression');
app.use(compression());
```

2. **Add caching**
```javascript
app.use(express.static('public', { maxAge: '1d' }));
```

3. **Use CDN for static files**
   - Upload images to Cloudinary
   - Use CDN URLs in frontend

4. **Database indexing**
   - Add indexes to frequently queried fields
   - Monitor slow queries

## Security Checklist

- [ ] Environment variables are set correctly
- [ ] JWT_SECRET is strong and random
- [ ] MongoDB connection uses authentication
- [ ] CORS is configured properly
- [ ] Rate limiting is enabled
- [ ] Input validation is working
- [ ] File upload limits are set
- [ ] HTTPS is enabled

## Monitoring

1. **Set up monitoring**
   - Use platform's built-in monitoring
   - Consider: New Relic, Datadog, or Sentry

2. **Set up alerts**
   - Error rate alerts
   - Performance alerts
   - Uptime monitoring

3. **Analytics**
   - Track user engagement
   - Monitor API usage
   - Check error rates

## Backup Strategy

1. **Database backups**
   - MongoDB Atlas: Automatic backups enabled
   - Manual exports: `mongodump`

2. **Code backups**
   - GitHub repository
   - Regular commits

3. **Media backups**
   - Consider cloud storage with versioning
   - Regular backups of uploads directory

## Scaling

When your app grows:

1. **Horizontal scaling**
   - Add more server instances
   - Use load balancer

2. **Database scaling**
   - Upgrade MongoDB tier
   - Add read replicas

3. **CDN for media**
   - Move uploads to S3/Cloudinary
   - Use CDN for faster delivery

4. **Caching layer**
   - Add Redis for sessions
   - Cache frequently accessed data

## Support

For deployment issues:
- Check platform documentation
- Review application logs
- Create issue on GitHub
- Contact: brijendray200@users.noreply.github.com

---

Good luck with your deployment! 🚀
