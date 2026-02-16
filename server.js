require('dotenv').config();
const express = require('express');
const cors = require('cors');
const NodeCache = require('node-cache');
const ToolStationScraper = require('./scraper');

const app = express();
const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour
const scraper = new ToolStationScraper();

// Middleware
app.use(cors());
app.use(express.json());

// API Key Authentication Middleware
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  const validApiKey = process.env.API_KEY || 'your-secret-api-key-change-this';
  
  if (!apiKey) {
    return res.status(401).json({ 
      error: 'API key is required',
      message: 'Please provide an API key in the X-API-Key header or api_key query parameter'
    });
  }
  
  if (apiKey !== validApiKey) {
    return res.status(403).json({ 
      error: 'Invalid API key',
      message: 'The provided API key is not valid'
    });
  }
  
  next();
};

// Rate limiting (simple in-memory implementation)
const rateLimitMap = new Map();
const rateLimit = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 30; // 30 requests per minute
  
  if (!rateLimitMap.has(apiKey)) {
    rateLimitMap.set(apiKey, []);
  }
  
  const requests = rateLimitMap.get(apiKey).filter(time => now - time < windowMs);
  
  if (requests.length >= maxRequests) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded',
      message: `Maximum ${maxRequests} requests per minute allowed`
    });
  }
  
  requests.push(now);
  rateLimitMap.set(apiKey, requests);
  
  next();
};

// Apply authentication and rate limiting to all routes
app.use('/api', authenticateApiKey, rateLimit);

// Health check endpoint (no auth required)
app.get('/', (req, res) => {
  res.json({ 
    status: 'online',
    service: 'Tool Station Scraper API',
    version: '1.0.0',
    endpoints: {
      search: 'POST /api/search',
      product: 'GET /api/product/:productCode'
    },
    documentation: 'See README.md for usage instructions'
  });
});

// Search endpoint
app.post('/api/search', async (req, res) => {
  try {
    const { query, page = 1, perPage = 24 } = req.body;
    
    if (!query) {
      return res.status(400).json({ 
        error: 'Query parameter is required',
        message: 'Please provide a search query in the request body'
      });
    }
    
    // Check cache
    const cacheKey = `search:${query}:${page}:${perPage}`;
    const cachedResult = cache.get(cacheKey);
    
    if (cachedResult) {
      return res.json({ 
        ...cachedResult,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }
    
    // Perform search
    const results = await scraper.search(query, page, perPage);
    
    // Cache results
    cache.set(cacheKey, results);
    
    res.json({ 
      ...results,
      cached: false,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      error: 'Search failed',
      message: error.message
    });
  }
});

// Product detail endpoint
app.get('/api/product/:productCode', async (req, res) => {
  try {
    const { productCode } = req.params;
    
    if (!productCode) {
      return res.status(400).json({ 
        error: 'Product code is required',
        message: 'Please provide a product code in the URL'
      });
    }
    
    // Check cache
    const cacheKey = `product:${productCode}`;
    const cachedResult = cache.get(cacheKey);
    
    if (cachedResult) {
      return res.json({ 
        ...cachedResult,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }
    
    // Fetch product
    const product = await scraper.getProduct(productCode);
    
    // Cache result
    cache.set(cacheKey, product);
    
    res.json({ 
      ...product,
      cached: false,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Product fetch error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ 
        error: 'Product not found',
        message: `Product with code ${req.params.productCode} was not found`
      });
    }
    
    res.status(500).json({ 
      error: 'Product fetch failed',
      message: error.message
    });
  }
});

// Clear cache endpoint (useful for testing)
app.post('/api/cache/clear', async (req, res) => {
  cache.flushAll();
  res.json({ 
    success: true,
    message: 'Cache cleared successfully'
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing scraper...');
  await scraper.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing scraper...');
  await scraper.close();
  process.exit(0);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Tool Station Scraper API running on port ${PORT}`);
  console.log(`📝 API Key: ${process.env.API_KEY || 'your-secret-api-key-change-this'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/`);
});
