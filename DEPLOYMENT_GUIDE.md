# 🚀 Deployment Guide - Vercel (Frontend) + Render (Backend) + Neon (Database)

This guide will help you deploy your Agile Dashboard to production using:
- **Vercel** for the Next.js frontend
- **Render** for the Express backend
- **Neon** for the PostgreSQL database (already set up!)

## Prerequisites

- [x] Neon database already set up and running ✅
- [ ] GitHub account
- [ ] Vercel account (sign up at https://vercel.com)
- [ ] Render account (sign up at https://render.com)
- [ ] Your code pushed to a GitHub repository

---

## Part 1: Push Code to GitHub

If you haven't already, push your code to GitHub:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Ready for deployment"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/yourusername/your-repo.git

# Push to GitHub
git push -u origin main
```

**Important**: Make sure `.env` files are in `.gitignore` (they already are!)

---

## Part 2: Deploy Backend to Render

### Step 1: Create New Web Service

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select your repository from the list

### Step 2: Configure Service

Fill in the following settings:

**Basic Settings:**
- **Name**: `agile-dashboard-backend` (or your preferred name)
- **Region**: Choose closest to your users (e.g., Oregon, Frankfurt)
- **Branch**: `main` (or your default branch)
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

**Instance Type:**
- Select **"Free"** (or paid plan for better performance)

### Step 3: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add these:

```env
NODE_ENV=production

# Neon Database (use your actual values)
DB_HOST=ep-noisy-leaf-an3kov9o-pooler.c-6.us-east-1.aws.neon.tech
DB_PORT=5432
DB_NAME=neondb
DB_USER=neondb_owner
DB_PASSWORD=npg_f1uEochKSkb4
DB_SSL=true

# JWT Configuration (IMPORTANT: Generate a strong secret!)
JWT_SECRET=your-super-secret-jwt-key-change-this-to-something-random-and-long
JWT_EXPIRATION=24h

# Server Port
PORT=3000
```

**🔐 Security Note**: Generate a strong JWT_SECRET using:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Build your TypeScript code
   - Start the server
3. Wait for deployment to complete (usually 2-5 minutes)

### Step 5: Get Your Backend URL

Once deployed, Render will give you a URL like:
```
https://agile-dashboard-backend.onrender.com
```

**Save this URL** - you'll need it for the frontend!

### Step 6: Test Backend

Test your deployed backend:

```bash
# Health check
curl https://your-backend-url.onrender.com/health

# Test login
curl -X POST https://your-backend-url.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

---

## Part 3: Deploy Frontend to Vercel

### Step 1: Update Frontend Environment Variable

Before deploying, update your frontend to use the production backend URL:

**Option A: Update `.env.local` (for local testing)**
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
```

**Option B: Set in Vercel (recommended)**
We'll set this in Vercel dashboard in the next steps.

### Step 2: Deploy to Vercel

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Vercel will auto-detect Next.js

### Step 3: Configure Project

**Framework Preset**: Next.js (auto-detected)

**Root Directory**: `frontend`

**Build Settings** (usually auto-detected):
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Step 4: Add Environment Variables

Click **"Environment Variables"** and add:

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
```

**Important**: Replace `your-backend-url.onrender.com` with your actual Render backend URL!

### Step 5: Deploy

1. Click **"Deploy"**
2. Vercel will:
   - Clone your repository
   - Install dependencies
   - Build your Next.js app
   - Deploy to their CDN
3. Wait for deployment (usually 1-3 minutes)

### Step 6: Get Your Frontend URL

Vercel will give you a URL like:
```
https://your-app.vercel.app
```

---

## Part 4: Update CORS Settings

Now that your frontend is deployed, update the backend CORS settings to only allow your frontend domain.

### Update `backend/src/app.ts`

Find the CORS middleware section and update it:

```typescript
// CORS middleware - UPDATE THIS FOR PRODUCTION
this.app.use((_req: Request, res: Response, next: NextFunction) => {
  const allowedOrigins = [
    'https://your-app.vercel.app',  // Your Vercel frontend URL
    'http://localhost:3000',         // Local development
    'http://localhost:3001'          // Local development (alternate port)
  ];
  
  const origin = _req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});
```

**Then:**
1. Commit and push the changes
2. Render will automatically redeploy your backend

---

## Part 5: Test Your Deployed Application

### Test the Full Stack

1. Open your Vercel URL: `https://your-app.vercel.app`
2. Click **"Sign In"**
3. Use test credentials:
   - Email: `admin@example.com`
   - Password: `password123`
4. You should be logged in and redirected to `/projects`

### Troubleshooting

**Frontend can't connect to backend:**
- Check `NEXT_PUBLIC_API_URL` in Vercel environment variables
- Verify backend is running on Render
- Check browser console for CORS errors
- Verify CORS settings in backend allow your Vercel domain

**Backend errors:**
- Check Render logs: Dashboard → Your Service → Logs
- Verify all environment variables are set correctly
- Test database connection from Render

**Database connection fails:**
- Verify Neon database is active (not suspended)
- Check DB credentials in Render environment variables
- Ensure `DB_SSL=true` is set

---

## Part 6: Custom Domain (Optional)

### Add Custom Domain to Vercel

1. Go to your project in Vercel
2. Click **"Settings"** → **"Domains"**
3. Add your custom domain (e.g., `myapp.com`)
4. Follow Vercel's instructions to update DNS records

### Add Custom Domain to Render

1. Go to your service in Render
2. Click **"Settings"** → **"Custom Domain"**
3. Add your custom domain (e.g., `api.myapp.com`)
4. Update DNS records as instructed

**Don't forget to update:**
- CORS settings in backend with new frontend domain
- `NEXT_PUBLIC_API_URL` in Vercel with new backend domain

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         PRODUCTION                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────┐ │
│  │   Vercel     │      │    Render    │      │   Neon   │ │
│  │  (Frontend)  │─────▶│  (Backend)   │─────▶│   (DB)   │ │
│  │   Next.js    │ HTTPS │   Express    │ SSL  │ Postgres │ │
│  └──────────────┘      └──────────────┘      └──────────┘ │
│        │                      │                     │      │
│   Static CDN           REST API              Cloud DB      │
│   Global Edge          Node.js              Serverless     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Environment Variables Summary

### Backend (Render)
```env
NODE_ENV=production
DB_HOST=ep-noisy-leaf-an3kov9o-pooler.c-6.us-east-1.aws.neon.tech
DB_PORT=5432
DB_NAME=neondb
DB_USER=neondb_owner
DB_PASSWORD=npg_f1uEochKSkb4
DB_SSL=true
JWT_SECRET=<generate-strong-secret>
JWT_EXPIRATION=24h
PORT=3000
```

### Frontend (Vercel)
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
```

---

## Monitoring & Maintenance

### Render Dashboard
- View logs: Real-time server logs
- Monitor metrics: CPU, memory, response times
- Auto-deploy: Automatically deploys on git push

### Vercel Dashboard
- View deployments: History of all deployments
- Analytics: Page views, performance metrics
- Preview deployments: Automatic preview for PRs

### Neon Dashboard
- Monitor queries: Query performance and stats
- Database size: Track storage usage
- Branches: Create database branches for testing

---

## Cost Breakdown (Free Tier)

| Service | Free Tier Limits | Upgrade Cost |
|---------|------------------|--------------|
| **Neon** | 0.5 GB storage, Shared CPU | $19/mo for 10 GB |
| **Render** | 750 hours/mo, Sleeps after 15min inactive | $7/mo for always-on |
| **Vercel** | 100 GB bandwidth, Unlimited sites | $20/mo for team features |

**Total Free Tier**: $0/month (with limitations)
**Paid Tier**: ~$46/month for production-ready setup

---

## Production Checklist

- [ ] Backend deployed to Render
- [ ] Frontend deployed to Vercel
- [ ] Database running on Neon
- [ ] Environment variables set correctly
- [ ] CORS configured for production domain
- [ ] JWT_SECRET changed to strong random value
- [ ] Test login functionality
- [ ] Test API endpoints
- [ ] Monitor logs for errors
- [ ] Set up custom domain (optional)
- [ ] Enable SSL/HTTPS (automatic on Vercel/Render)
- [ ] Set up monitoring/alerts (optional)

---

## Quick Deploy Commands

### Update and Redeploy

```bash
# Make changes to your code
git add .
git commit -m "Your changes"
git push origin main

# Render and Vercel will automatically redeploy!
```

### View Logs

```bash
# Render logs (in dashboard or CLI)
render logs -s your-service-name

# Vercel logs (in dashboard or CLI)
vercel logs your-deployment-url
```

---

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **Neon Docs**: https://neon.tech/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Express Docs**: https://expressjs.com

---

## Success! 🎉

Your application is now deployed and accessible worldwide!

- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-backend.onrender.com
- **Database**: Neon (serverless PostgreSQL)

Share your app with the world! 🚀
