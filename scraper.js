const puppeteer = require('puppeteer');

let browser = null;

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080'
      ]
    });
  }
  return browser;
}

// Tool Station specific scraper (backward compatible)
async function scrapeSearch(query, page = 1) {
  const browser = await getBrowser();
  const browserPage = await browser.newPage();
  
  try {
    const url = `https://www.toolstation.com/search?q=${encodeURIComponent(query)}&page=${page}`;
    
    await browserPage.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    await browserPage.waitForSelector('.product-card, .no-results', { timeout: 10000 });

    const products = await browserPage.evaluate(() => {
      const items = [];
      const cards = document.querySelectorAll('.product-card');
      
      cards.forEach(card => {
        const titleEl = card.querySelector('.product-title, h3, h2');
        const priceEl = card.querySelector('.price, [class*="price"]');
        const imageEl = card.querySelector('img');
        const linkEl = card.querySelector('a');
        const brandEl = card.querySelector('.brand, [class*="brand"]');
        
        if (titleEl) {
          items.push({
            title: titleEl.textContent.trim(),
            price: priceEl ? priceEl.textContent.trim() : null,
            image: imageEl ? imageEl.src : null,
            url: linkEl ? linkEl.href : null,
            brand: brandEl ? brandEl.textContent.trim() : null
          });
        }
      });
      
      return items;
    });

    const totalResults = await browserPage.evaluate(() => {
      const resultsEl = document.querySelector('.results-count, [class*="results"]');
      if (resultsEl) {
        const match = resultsEl.textContent.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      }
      return 0;
    });

    return {
      query,
      page,
      totalResults,
      products,
      count: products.length
    };
  } finally {
    await browserPage.close();
  }
}

// Tool Station product details (backward compatible)
async function scrapeProduct(productCode) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    const url = `https://www.toolstation.com/p${productCode}`;
    
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    await page.waitForSelector('h1, .product-title', { timeout: 10000 });

    const product = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      
      // Extract price using regex pattern
      const pricePattern = /£([\d,]+\.?\d*)\s+ex\.\s*VAT\s+£([\d,]+\.?\d*)/i;
      const priceMatch = bodyText.match(pricePattern);
      
      const title = document.querySelector('h1, .product-title')?.textContent.trim();
      const brand = document.querySelector('.brand, [class*="brand"]')?.textContent.trim();
      
      // Get all images and filter out icons/logos
      const images = Array.from(document.querySelectorAll('img'))
        .map(img => img.src)
        .filter(src => 
          src.includes('product') || 
          src.includes('/images/') ||
          (src.includes('toolstation') && !src.includes('logo') && !src.includes('icon'))
        )
        .filter(src => !src.endsWith('.svg'))
        .slice(0, 10);
      
      // Extract rating
      const ratingEl = document.querySelector('[class*="rating"], .stars');
      let rating = null;
      if (ratingEl) {
        const ratingText = ratingEl.textContent || ratingEl.getAttribute('aria-label') || '';
        const ratingMatch = ratingText.match(/([\d.]+)/);
        rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;
      }
      
      return {
        title,
        brand,
        price: priceMatch ? `£${priceMatch[1]}` : null,
        priceExVAT: priceMatch ? `£${priceMatch[2]}` : null,
        images,
        rating,
        url: window.location.href
      };
    });

    return product;
  } finally {
    await page.close();
  }
}

// NEW: Generic scraper with dynamic configuration
async function scrapeWithConfig(siteConfig, query) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    // Replace {query} placeholder in search URL
    const url = siteConfig.searchUrl.replace('{query}', encodeURIComponent(query));
    
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Wait for product cards to load
    const productCardSelector = siteConfig.selectors.productCard;
    await page.waitForSelector(`${productCardSelector}, .no-results, .no-products`, { 
      timeout: 10000 
    }).catch(() => {
      console.log('No products found or timeout waiting for selector');
    });

    // Extract products using provided selectors
    const products = await page.evaluate((config) => {
      const items = [];
      const cards = document.querySelectorAll(config.selectors.productCard);
      
      cards.forEach(card => {
        try {
          const getElementText = (selector) => {
            const el = card.querySelector(selector);
            return el ? el.textContent.trim() : null;
          };
          
          const getElementAttr = (selector, attr) => {
            const el = card.querySelector(selector);
            return el ? el.getAttribute(attr) : null;
          };
          
          const title = getElementText(config.selectors.title);
          const price = getElementText(config.selectors.price);
          const image = getElementAttr(config.selectors.image, 'src');
          const link = getElementAttr(config.selectors.link, 'href');
          
          // Optional selectors
          const brand = config.selectors.brand ? getElementText(config.selectors.brand) : null;
          const rating = config.selectors.rating ? getElementText(config.selectors.rating) : null;
          
          if (title) {
            items.push({
              title,
              price,
              image,
              url: link ? (link.startsWith('http') ? link : new URL(link, window.location.origin).href) : null,
              brand,
              rating
            });
          }
        } catch (err) {
          console.error('Error extracting product:', err);
        }
      });
      
      return items;
    }, siteConfig);

    return {
      site: siteConfig.name,
      query,
      products,
      count: products.length,
      url
    };
  } finally {
    await page.close();
  }
}

module.exports = {
  scrapeSearch,
  scrapeProduct,
  scrapeWithConfig
};
