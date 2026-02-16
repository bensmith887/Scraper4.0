const express = require('express');
const cors = require('cors');
const { scrapeSearch, scrapeProduct, scrapeWithConfig } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

// Middleware
app.use(cors());
app.use(express.json());

// API key authentication middleware
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(403).json({ error: 'Invalid or missing API key' });
  }
  
  next();
};

// In-memory cache
const cache = new Map();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Multi-Site Scraper API v2.0',
    version: '2.0.0',
    features: ['toolstation', 'multi-site', 'dynamic-config']
  });
});

// Tool Station search endpoint (backward compatible)
app.post('/api/search', authenticateApiKey, async (req, res) => {
  try {
    const { query, page = 1 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const cacheKey = `search:${query}:${page}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.json({ ...cached.data, cached: true });
    }

    const result = await scrapeSearch(query, page);
    
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    res.json(result);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Tool Station product details endpoint (backward compatible)
app.get('/api/product/:code', authenticateApiKey, async (req, res) => {
  try {
    const { code } = req.params;
    
    if (!code) {
      return res.status(400).json({ error: 'Product code is required' });
    }

    const cacheKey = `product:${code}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.json({ ...cached.data, cached: true });
    }

    const result = await scrapeProduct(code);
    
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    res.json(result);
  } catch (error) {
    console.error('Product error:', error);
    res.status(500).json({ error: error.message });
  }
});

// NEW: Multi-site scraper endpoint with dynamic configuration
app.post('/api/scrape', authenticateApiKey, async (req, res) => {
  try {
    const { siteConfig, query } = req.body;
    
    if (!siteConfig || !query) {
      return res.status(400).json({ 
        error: 'Both siteConfig and query are required',
        example: {
          siteConfig: {
            name: 'Site Name',
            searchUrl: 'https://example.com/search?q={query}',
            selectors: {
              productCard: '.product',
              title: '.title',
              price: '.price',
              image: 'img',
              link: 'a'
            }
          },
          query: 'search term'
        }
      });
    }

    // Validate site config
    if (!siteConfig.searchUrl || !siteConfig.selectors) {
      return res.status(400).json({ error: 'Invalid site configuration' });
    }

    const cacheKey = `scrape:${siteConfig.name}:${query}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.json({ ...cached.data, cached: true });
    }

    const result = await scrapeWithConfig(siteConfig, query);
    
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    res.json(result);
  } catch (error) {
    console.error('Scrape error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clear cache endpoint
app.post('/api/cache/clear', authenticateApiKey, (req, res) => {
  cache.clear();
  res.json({ message: 'Cache cleared successfully' });
});

// Cache stats endpoint
app.get('/api/cache/stats', authenticateApiKey, (req, res) => {
  res.json({
    size: cache.size,
    keys: Array.from(cache.keys())
  });
});

app.listen(PORT, () => {
  console.log(`Multi-Site Scraper API running on port ${PORT}`);
  console.log(`API Key configured: ${API_KEY ? 'Yes' : 'No'}`);
});
