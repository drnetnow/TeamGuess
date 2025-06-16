# Complete Deployment Instructions

## Part 1: Put Your Code on GitHub

### Download Your Code
1. In Replit, click the three dots menu (⋯) next to "Files"
2. Select "Download as zip"
3. Extract the zip file to a folder on your computer

### Create GitHub Repository
1. Go to **github.com** and sign in (create account if needed)
2. Click the **"+"** button → **"New repository"**
3. Repository name: `team-guessing-game`
4. Make it **Public** (required for free Railway deployment)
5. **Don't** check "Add README" - we already have one
6. Click **"Create repository"**

### Upload Your Code
**Option A: Using GitHub Web Interface (Easiest)**
1. On your new repository page, click **"uploading an existing file"**
2. Drag all your project files into the upload area
3. Write commit message: "Initial game upload"
4. Click **"Commit changes"**

**Option B: Using Git Commands**
```bash
# In your project folder
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/team-guessing-game.git
git push -u origin main
```

## Part 2: Deploy to Railway

### Setup Railway Account
1. Go to **railway.app**
2. Click **"Login"** → **"Login with GitHub"**
3. Authorize Railway to access your GitHub

### Deploy Your Game
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your `team-guessing-game` repository
4. Railway starts building automatically

### Add Database
1. In your project dashboard, click **"New Service"**
2. Choose **"Database"** → **"PostgreSQL"**
3. Database creates automatically (sets DATABASE_URL)

### Set Security Key
1. On your computer, in the project folder, run:
   ```bash
   node generate-session-secret.js
   ```
2. Copy the generated secret
3. In Railway, click your web service → **"Variables"** tab
4. Click **"New Variable"**
5. Name: `SESSION_SECRET`
6. Value: paste your generated secret
7. Add another variable:
   - Name: `NODE_ENV`
   - Value: `production`

### Access Your Live Game
1. Wait 2-3 minutes for deployment to complete
2. Click **"View Logs"** to see progress
3. When done, you'll see your live URL like: `https://your-app-name.railway.app`
4. Click the URL to open your live game!

## Testing Your Deployment
1. Open your live URL
2. Create a new game (use a state name like "Texas")
3. Copy the player join link
4. Open in another browser/device to test multiplayer
5. Submit some guesses to verify everything works

## Free Tier Notes
- You get $5 monthly credit (covers small usage)
- App sleeps after 30 minutes of inactivity
- Automatically wakes when someone visits

Your game is now live and ready for players!