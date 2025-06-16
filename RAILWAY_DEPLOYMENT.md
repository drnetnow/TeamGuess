# Railway Deployment Guide

## Prerequisites
- GitHub account
- Railway account (sign up at railway.app)
- Your code pushed to a GitHub repository

## Step-by-Step Deployment

### 1. Prepare Your Repository
Your code is already configured for Railway with:
- ✅ `railway.json` - Railway configuration
- ✅ `nixpacks.toml` - Build configuration  
- ✅ Dynamic port handling
- ✅ Production build setup

### 2. Deploy to Railway

1. **Go to Railway Dashboard**
   - Visit [railway.app](https://railway.app)
   - Sign in with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Add PostgreSQL Database**
   - In your project dashboard, click "New Service"
   - Select "Database" → "PostgreSQL"
   - Railway will automatically create the database and set `DATABASE_URL`

4. **Configure Environment Variables**
   - Click on your web service
   - Go to "Variables" tab
   - Add these variables:
     ```
     SESSION_SECRET=your-random-secret-string-here
     NODE_ENV=production
     ```
   - Generate a secure SESSION_SECRET (32+ random characters)

5. **Deploy**
   - Railway will automatically build and deploy
   - First deployment takes 2-3 minutes
   - You'll get a public URL like `https://your-app-name.railway.app`

### 3. Set Up Database Schema

After deployment:
1. Go to your service settings
2. Open the deployed URL
3. The database tables will be created automatically on first connection

### 4. Test Your Deployment

1. Visit your Railway URL
2. Create a new game (should work with state names like "California")
3. Join the game as a player
4. Verify the game functionality

## Free Tier Limits
- $5 monthly credit (usually covers small apps)
- Sleeps after 30 minutes of inactivity
- Wakes up automatically when accessed

## Troubleshooting

**Build Fails:**
- Check the build logs in Railway dashboard
- Ensure all dependencies are in package.json

**Database Connection Issues:**
- Verify DATABASE_URL is automatically set
- Check PostgreSQL service is running

**App Won't Start:**
- Ensure SESSION_SECRET is set
- Check deployment logs for error messages

## Monitoring Usage
- Check usage in Railway dashboard
- Monitor remaining monthly credits
- Upgrade to paid plan ($5/month) if needed

## Custom Domain (Optional)
1. Go to service settings
2. Click "Networking"
3. Add your custom domain
4. Update DNS records as instructed

Your game is now live and ready for players to join!