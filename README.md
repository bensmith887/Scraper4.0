# Tool Station Scraper API

A powerful, production-ready API for scraping Tool Station product data with built-in authentication, caching, and rate limiting.

## Features

✅ **Search Products** - Search Tool Station's catalog by keyword  
✅ **Product Details** - Get detailed information for specific products  
✅ **API Key Authentication** - Secure your API with key-based auth  
✅ **Smart Caching** - 1-hour cache to reduce server load and improve speed  
✅ **Rate Limiting** - 30 requests per minute per API key  
✅ **Easy Deployment** - One-click deploy to Railway, Render, or Fly.io  
✅ **Docker Ready** - Containerized for consistent deployment anywhere  

## Quick Start

### Option 1: Deploy to Railway (Easiest - Recommended)

1. **Fork or upload this repository to GitHub**

2. **Go to [Railway.app](https://railway.app)** and sign in

3. **Click "New Project" → "Deploy from GitHub repo"**

4. **Select this repository**

5. **Add environment variable:**
   - Key: `API_KEY`
   - Value: `ts_b068d82c580c157d0b23a256c8e092385e67fb061f564c5df71c3b22440904a6`

6. **Deploy!** Railway will automatically build and deploy your scraper

7. **Get your URL** from Railway dashboard (e.g., `https://your-app.up.railway.app`)

### Option 2: Deploy to Render

1. **Go to [Render.com](https://render.com)** and sign in

2. **Click "New" → "Web Service"**

3. **Connect your GitHub repository**

4. **Configure:**
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Add environment variable `API_KEY` with your key

5. **Deploy!**

### Option 3: Local Development

```bash
# Install dependencies
npm install

# Install Chrome for Puppeteer
npx puppeteer browsers install chrome

# Start the server
npm start
```

The API will be available at `http://localhost:3000`

## API Documentation

### Base URL
```
https://your-deployment-url.com
```

### Authentication

All API endpoints (except health check) require an API key in the request header:

```
X-API-Key: ts_b068d82c580c157d0b23a256c8e092385e67fb061f564c5df71c3b22440904a6
```

Or as a query parameter:
```
?api_key=ts_b068d82c580c157d0b23a256c8e092385e67fb061f564c5df71c3b22440904a6
```

### Endpoints

#### 1. Health Check
```http
GET /
```

**Response:**
```json
{
  "status": "online",
  "service": "Tool Station Scraper API",
  "version": "1.0.0"
}
```

#### 2. Search Products
```http
POST /api/search
Content-Type: application/json
X-API-Key: your-api-key
```

**Request Body:**
```json
{
  "query": "drill",
  "page": 1,
  "perPage": 24
}
```

**Response:**
```json
{
  "query": "drill",
  "page": 1,
  "perPage": 24,
  "total": 1537,
  "results": [
    {
      "productCode": "60545",
      "title": "DeWalt DCD709D2T-GB 18V XR Brushless Compact Combi Drill 2 x 2.0Ah",
      "brand": "DeWalt",
      "price": "£119.98",
      "reviews": 1857,
      "image": "https://cdn.toolstation.com/...",
      "url": "https://www.toolstation.com/..."
    }
  ],
  "cached": false,
  "timestamp": "2026-02-16T00:00:00.000Z"
}
```

#### 3. Get Product Details
```http
GET /api/product/:productCode
X-API-Key: your-api-key
```

**Example:**
```http
GET /api/product/60545
```

**Response:**
```json
{
  "productCode": "60545",
  "title": "DeWalt DCD709D2T-GB 18V XR Brushless Compact Combi Drill 2 x 2.0Ah",
  "brand": "DeWalt",
  "price": "£119.98",
  "priceExVAT": "£99.98",
  "rating": null,
  "reviews": 1857,
  "images": ["https://cdn.toolstation.com/..."],
  "inStock": true,
  "description": "...",
  "url": "https://www.toolstation.com/...",
  "cached": false,
  "timestamp": "2026-02-16T00:00:00.000Z"
}
```

#### 4. Clear Cache
```http
POST /api/cache/clear
X-API-Key: your-api-key
```

**Response:**
```json
{
  "success": true,
  "message": "Cache cleared successfully"
}
```

## Usage Examples

### JavaScript/Node.js
```javascript
const response = await fetch('https://your-api.com/api/search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'ts_b068d82c580c157d0b23a256c8e092385e67fb061f564c5df71c3b22440904a6'
  },
  body: JSON.stringify({
    query: 'drill',
    page: 1,
    perPage: 10
  })
});

const data = await response.json();
console.log(data.results);
```

### Python
```python
import requests

response = requests.post(
    'https://your-api.com/api/search',
    headers={
        'Content-Type': 'application/json',
        'X-API-Key': 'ts_b068d82c580c157d0b23a256c8e092385e67fb061f564c5df71c3b22440904a6'
    },
    json={
        'query': 'drill',
        'page': 1,
        'perPage': 10
    }
)

data = response.json()
print(data['results'])
```

### cURL
```bash
curl -X POST https://your-api.com/api/search \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ts_b068d82c580c157d0b23a256c8e092385e67fb061f564c5df71c3b22440904a6" \
  -d '{"query":"drill","page":1,"perPage":10}'
```

## Configuration

### Environment Variables

- `API_KEY` - Your secret API key (required)
- `PORT` - Server port (default: 3000, auto-set by hosting platforms)

### Caching

- **Cache Duration:** 1 hour (3600 seconds)
- **Cache Strategy:** In-memory (node-cache)
- **Cached Responses:** Include `"cached": true` in response

### Rate Limiting

- **Limit:** 30 requests per minute per API key
- **Window:** 60 seconds
- **Response:** 429 Too Many Requests when exceeded

## Cost Estimate

### Hosting Costs
- **Railway Free Tier:** $0/month (500 hours)
- **Railway Hobby:** $5/month (unlimited)
- **Render Free Tier:** $0/month (750 hours)
- **Render Starter:** $7/month (unlimited)

### Usage Recommendations
- **Low volume** (< 1,000 requests/day): Free tier
- **Medium volume** (1,000-10,000 requests/day): $5-10/month
- **High volume** (10,000+ requests/day): $10-20/month

**Much cheaper than commercial scraping services!** (Bright Data, FireCrawl, Scraper API cost $50-500+/month)

## Troubleshooting

### Issue: "Could not find Chrome"
**Solution:** Run `npx puppeteer browsers install chrome` before starting

### Issue: API returns empty results
**Solution:** Clear cache with `/api/cache/clear` endpoint

### Issue: Slow response times
**Solution:** Results are cached for 1 hour. First request is slower, subsequent requests are instant

### Issue: Rate limit exceeded
**Solution:** Wait 60 seconds or implement request queuing in your app

## Security Notes

⚠️ **Keep your API key secret!** Don't commit it to public repositories  
⚠️ **Use environment variables** for sensitive configuration  
⚠️ **Rotate your API key** periodically for better security  

To generate a new API key:
```bash
node -e "console.log('ts_' + require('crypto').randomBytes(32).toString('hex'))"
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs for error messages
3. Test endpoints with the provided examples

## License

MIT License - Free to use and modify

---

**Your API Key:** `ts_b068d82c580c157d0b23a256c8e092385e67fb061f564c5df71c3b22440904a6`

**Keep this key safe and don't share it publicly!**
