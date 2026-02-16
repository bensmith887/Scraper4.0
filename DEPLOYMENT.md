# Deployment Guide

This guide will walk you through deploying your Tool Station Scraper API to various platforms.

## Prerequisites

Before deploying, you'll need:
1. A GitHub account
2. This code uploaded to a GitHub repository
3. Your API key: `ts_b068d82c580c157d0b23a256c8e092385e67fb061f564c5df71c3b22440904a6`

## Method 1: Railway (Recommended - Easiest)

Railway is the easiest platform to deploy to with automatic builds and free tier.

### Step-by-Step Instructions

1. **Create GitHub Repository**
   - Go to [GitHub.com](https://github.com)
   - Click "New Repository"
   - Name it `toolstation-scraper`
   - Upload all files from this folder

2. **Sign Up for Railway**
   - Go to [Railway.app](https://railway.app)
   - Click "Login" and sign in with GitHub
   - Authorize Railway to access your repositories

3. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `toolstation-scraper` repository
   - Railway will automatically detect it's a Node.js project

4. **Add Environment Variable**
   - In your project dashboard, click "Variables"
   - Click "New Variable"
   - Add:
     - **Variable:** `API_KEY`
     - **Value:** `ts_b068d82c580c157d0b23a256c8e092385e67fb061f564c5df71c3b22440904a6`
   - Click "Add"

5. **Deploy**
   - Railway will automatically build and deploy
   - Wait 2-3 minutes for deployment to complete
   - You'll see "Deployed" status when ready

6. **Get Your URL**
   - Click "Settings" tab
   - Click "Generate Domain" under "Public Networking"
   - Your API will be available at: `https://your-app.up.railway.app`

7. **Test Your API**
   ```bash
   curl https://your-app.up.railway.app/
   ```

### Railway Pricing
- **Free Tier:** 500 hours/month ($0)
- **Hobby Plan:** $5/month (unlimited hours)
- **Pro Plan:** $20/month (team features)

---

## Method 2: Render

Render offers a generous free tier and automatic deployments.

### Step-by-Step Instructions

1. **Create GitHub Repository** (same as Railway step 1)

2. **Sign Up for Render**
   - Go to [Render.com](https://render.com)
   - Click "Get Started"
   - Sign up with GitHub

3. **Create New Web Service**
   - Click "New +" button
   - Select "Web Service"
   - Connect your GitHub repository
   - Select `toolstation-scraper`

4. **Configure Service**
   - **Name:** `toolstation-scraper`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npx puppeteer browsers install chrome`
   - **Start Command:** `node server.js`
   - **Plan:** Free (or Starter for $7/month)

5. **Add Environment Variable**
   - Scroll to "Environment Variables"
   - Click "Add Environment Variable"
   - Add:
     - **Key:** `API_KEY`
     - **Value:** `ts_b068d82c580c157d0b23a256c8e092385e67fb061f564c5df71c3b22440904a6`

6. **Deploy**
   - Click "Create Web Service"
   - Wait 5-10 minutes for first deployment
   - Your API will be at: `https://toolstation-scraper.onrender.com`

7. **Test Your API**
   ```bash
   curl https://toolstation-scraper.onrender.com/
   ```

### Render Pricing
- **Free Tier:** 750 hours/month, sleeps after 15 min inactivity ($0)
- **Starter:** $7/month (always on)
- **Pro:** $25/month (more resources)

**Note:** Free tier "sleeps" after inactivity. First request after sleep takes 30-60 seconds.

---

## Method 3: Fly.io

Fly.io offers global deployment with edge locations.

### Step-by-Step Instructions

1. **Install Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Sign Up**
   ```bash
   fly auth signup
   ```

3. **Deploy**
   ```bash
   cd toolstation-scraper
   fly launch
   ```

4. **Set Environment Variable**
   ```bash
   fly secrets set API_KEY=ts_b068d82c580c157d0b23a256c8e092385e67fb061f564c5df71c3b22440904a6
   ```

5. **Your API is live!**
   ```bash
   fly open
   ```

### Fly.io Pricing
- **Free Tier:** 3 shared VMs ($0)
- **Paid:** ~$5-10/month for dedicated resources

---

## Method 4: Docker (Self-Hosted)

Deploy to your own server using Docker.

### Step-by-Step Instructions

1. **Install Docker** on your server
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```

2. **Upload Files** to your server
   ```bash
   scp -r toolstation-scraper user@your-server:/home/user/
   ```

3. **Build Docker Image**
   ```bash
   cd toolstation-scraper
   docker build -t toolstation-scraper .
   ```

4. **Run Container**
   ```bash
   docker run -d \
     -p 3000:3000 \
     -e API_KEY=ts_b068d82c580c157d0b23a256c8e092385e67fb061f564c5df71c3b22440904a6 \
     --name toolstation-scraper \
     toolstation-scraper
   ```

5. **Test**
   ```bash
   curl http://localhost:3000/
   ```

6. **Setup Reverse Proxy** (Optional - for HTTPS)
   - Use Nginx or Caddy
   - Point domain to your server
   - Configure SSL certificate

---

## Method 5: Local Server (Development/Testing)

Run on your local machine or development server.

### Step-by-Step Instructions

1. **Install Node.js** (v18 or higher)
   - Download from [nodejs.org](https://nodejs.org)

2. **Install Dependencies**
   ```bash
   cd toolstation-scraper
   npm install
   ```

3. **Install Chrome**
   ```bash
   npx puppeteer browsers install chrome
   ```

4. **Start Server**
   ```bash
   npm start
   ```

5. **Test**
   ```bash
   curl http://localhost:3000/
   ```

---

## Post-Deployment Checklist

After deploying, verify everything works:

### 1. Health Check
```bash
curl https://your-api-url.com/
```

Expected response:
```json
{
  "status": "online",
  "service": "Tool Station Scraper API",
  "version": "1.0.0"
}
```

### 2. Test Search
```bash
curl -X POST https://your-api-url.com/api/search \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ts_b068d82c580c157d0b23a256c8e092385e67fb061f564c5df71c3b22440904a6" \
  -d '{"query":"drill","page":1,"perPage":5}'
```

Expected: JSON response with product results

### 3. Test Product Details
```bash
curl https://your-api-url.com/api/product/60545 \
  -H "X-API-Key: ts_b068d82c580c157d0b23a256c8e092385e67fb061f564c5df71c3b22440904a6"
```

Expected: JSON response with product details

---

## Troubleshooting

### Issue: Build fails on Railway/Render
**Solution:** Make sure `package.json` is in the root directory

### Issue: "Could not find Chrome" error
**Solution:** Add to build command: `npx puppeteer browsers install chrome`

### Issue: API returns 500 errors
**Solution:** Check logs:
- Railway: Click "Deployments" → "View Logs"
- Render: Click "Logs" tab
- Look for error messages

### Issue: Slow first request
**Solution:** Normal behavior. Puppeteer takes 5-10 seconds to start Chrome on first request. Subsequent requests are cached and instant.

### Issue: Memory errors
**Solution:** Upgrade to paid plan with more RAM (Railway Hobby or Render Starter)

---

## Monitoring & Maintenance

### Check Logs
- **Railway:** Dashboard → Deployments → View Logs
- **Render:** Dashboard → Logs tab
- **Fly.io:** `fly logs`
- **Docker:** `docker logs toolstation-scraper`

### Update Deployment
1. Push changes to GitHub
2. Railway/Render auto-deploys
3. Or manually redeploy from dashboard

### Scale Up
If you need more performance:
- **Railway:** Upgrade to Hobby ($5/month)
- **Render:** Upgrade to Starter ($7/month)
- **Fly.io:** Add more VMs or increase resources

---

## Security Best Practices

1. **Never commit API keys** to GitHub
2. **Use environment variables** for all secrets
3. **Rotate API keys** every 3-6 months
4. **Monitor usage** for unusual activity
5. **Set up alerts** for errors (available on paid plans)

---

## Need Help?

1. Check the README.md for API documentation
2. Review logs for error messages
3. Test endpoints with provided curl commands
4. Verify environment variables are set correctly

---

**You're all set!** Your Tool Station Scraper API is now deployed and ready to use.

**Your API Key:** `ts_b068d82c580c157d0b23a256c8e092385e67fb061f564c5df71c3b22440904a6`
