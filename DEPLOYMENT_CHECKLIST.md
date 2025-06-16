# Railway Deployment Checklist

## Pre-Deployment Setup ✅
- [x] Port configuration updated for Railway
- [x] Railway.json configuration created
- [x] Nixpacks.toml build configuration added
- [x] Session secret validation implemented
- [x] Production-ready environment variable handling

## Railway Deployment Steps

### 1. Generate Session Secret
```bash
node generate-session-secret.js
```
Copy the generated secret for step 4.

### 2. Create Railway Project
1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository

### 3. Add PostgreSQL Database
1. In project dashboard, click "New Service"
2. Select "Database" → "PostgreSQL"
3. Railway automatically sets `DATABASE_URL`

### 4. Set Environment Variables
In your web service "Variables" tab, add:
```
SESSION_SECRET=<paste-generated-secret-here>
NODE_ENV=production
```

### 5. Deploy & Test
1. Railway builds automatically (2-3 minutes)
2. Visit your deployed URL
3. Test game creation with state name (e.g., "California")
4. Test player joining and gameplay

## Expected Results
- ✅ App accessible at `https://your-app.railway.app`
- ✅ Database tables created automatically
- ✅ Players can join games with state names
- ✅ Real-time gameplay works
- ✅ Sessions persist across requests

## Free Tier Monitoring
- Monthly credit usage in Railway dashboard
- App sleeps after 30 minutes inactivity
- Automatic wake-up on new requests

## Support
- Railway docs: railway.app/docs
- Your app logs available in Railway dashboard
- Database query interface in PostgreSQL service