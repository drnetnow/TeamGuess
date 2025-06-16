# GitHub Setup and Deployment Guide

## Step 1: Initialize Git Repository

Open your terminal/command prompt in your project folder and run these commands:

```bash
# Initialize git repository
git init

# Add all files to git
git add .

# Create your first commit
git commit -m "Initial commit: Team Guessing Game with Railway deployment"
```

## Step 2: Create GitHub Repository

1. **Go to GitHub.com**
   - Sign in to your GitHub account
   - If you don't have one, create a free account at github.com

2. **Create New Repository**
   - Click the "+" icon in top right corner
   - Select "New repository"
   - Repository name: `team-guessing-game` (or your preferred name)
   - Description: `Collaborative real-time guessing game with AI answer matching`
   - Set to **Public** (required for Railway free tier)
   - **Do NOT** check "Add a README file" (we already have one)
   - Click "Create repository"

## Step 3: Connect Local Code to GitHub

GitHub will show you commands. Use the "push an existing repository" section:

```bash
# Add GitHub as remote origin (replace YOUR_USERNAME and YOUR_REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push your code to GitHub
git branch -M main
git push -u origin main
```

Example:
```bash
git remote add origin https://github.com/johnsmith/team-guessing-game.git
git branch -M main
git push -u origin main
```

## Step 4: Verify Upload

1. Refresh your GitHub repository page
2. You should see all your files including:
   - README.md
   - railway.json
   - RAILWAY_DEPLOYMENT.md
   - Your game code

## Step 5: Deploy to Railway

Now that your code is on GitHub:

1. **Go to Railway**
   - Visit railway.app
   - Sign in with your GitHub account

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your newly created repository

3. **Add Database**
   - Click "New Service" → "Database" → "PostgreSQL"
   - Railway automatically sets DATABASE_URL

4. **Set Environment Variables**
   - Generate session secret: `node generate-session-secret.js`
   - In Railway web service, go to "Variables" tab
   - Add: `SESSION_SECRET=your-generated-secret`
   - Add: `NODE_ENV=production`

5. **Deploy**
   - Railway builds automatically
   - Visit your live URL when deployment completes

## Troubleshooting

**Git issues:**
- If you get permission errors, make sure you're signed into GitHub
- For authentication, you may need to set up a Personal Access Token

**Repository not found:**
- Double-check the repository URL
- Ensure repository is public for Railway free tier

**Deployment fails:**
- Check Railway logs for specific error messages
- Verify all environment variables are set correctly

Your game will be live at: `https://your-app-name.railway.app`