const puppeteer = require('puppeteer');

class ToolStationScraper {
  constructor() {
    this.browser = null;
  }

  async init() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async search(query, page = 1, perPage = 24) {
    await this.init();
    
    const browserPage = await this.browser.newPage();
    
    try {
      // Set viewport and user agent
      await browserPage.setViewport({ width: 1920, height: 1080 });
      await browserPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Navigate to search page
      const url = `https://www.toolstation.com/search?q=${encodeURIComponent(query)}`;
      await browserPage.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
      
      // Wait for products to load - look for price elements which indicate products are loaded
      await browserPage.waitForFunction(
        () => {
          const priceElements = document.querySelectorAll('[class*="price"]');
          return priceElements.length > 0;
        },
        { timeout: 15000 }
      ).catch(() => {});
      
      // Additional wait for dynamic content
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Extract product data using the working method
      const products = await browserPage.evaluate(() => {
        const results = [];
        const seenProducts = new Set();
        
        // Find all elements that contain "Product code:"
        const allDivs = Array.from(document.querySelectorAll('div, article, section'));
        
        allDivs.forEach(div => {
          const text = div.textContent || '';
          const productCodeMatch = text.match(/Product code:\s*(\w+)/);
          
          if (productCodeMatch && text.length < 1000) {
            const productCode = productCodeMatch[1];
            
            if (seenProducts.has(productCode)) return;
            seenProducts.add(productCode);
            
            // Extract title from links
            const links = div.querySelectorAll('a[href*="/p"]');
            let title = '';
            links.forEach(link => {
              const linkText = link.textContent.trim();
              if (linkText.length > title.length && linkText.length > 10 && !linkText.includes('Add to')) {
                title = linkText;
              }
            });
            
            // Extract price with ex VAT pattern
            const priceMatch = text.match(/£([\d,]+\.?\d*)\s+ex\.\s*VAT\s+£([\d,]+\.?\d*)/);
            
            // Extract reviews
            const reviewMatch = text.match(/\((\d+)\)/);
            const reviews = reviewMatch ? parseInt(reviewMatch[1]) : 0;
            
            // Extract image
            const img = div.querySelector('img');
            let image = null;
            if (img) {
              const src = img.src || img.getAttribute('data-src') || '';
              if (src && !src.includes('icon') && !src.includes('logo')) {
                image = src;
              }
            }
            
            // Extract brand from title
            const brandMatch = title.match(/^([A-Z][A-Za-z\s&]+?)(?:\s+[A-Z0-9]|$)/);
            const brand = brandMatch ? brandMatch[1].trim() : null;
            
            // Extract URL
            let url = '';
            links.forEach(link => {
              const href = link.getAttribute('href') || '';
              if (href.includes(`/p${productCode}`)) {
                url = `https://www.toolstation.com${href}`;
              }
            });
            
            if (title && priceMatch && url) {
              results.push({
                productCode,
                title,
                brand,
                price: `£${priceMatch[1]}`,
                reviews,
                image,
                url
              });
            }
          }
        });
        
        // Get total results count
        const totalText = document.body.textContent;
        const totalMatch = totalText.match(/(\d+)\s*results/i) || totalText.match(/(\d+)\s*-\s*\d+\s+of\s+(\d+)/i);
        const total = totalMatch ? parseInt(totalMatch[totalMatch.length - 1]) : results.length;
        
        return { results, total };
      });

      await browserPage.close();
      
      return {
        query,
        page,
        perPage,
        total: products.total,
        results: products.results.slice(0, perPage)
      };
      
    } catch (error) {
      await browserPage.close();
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  async getProduct(productCode) {
    await this.init();
    
    const browserPage = await this.browser.newPage();
    
    try {
      // Set viewport and user agent
      await browserPage.setViewport({ width: 1920, height: 1080 });
      await browserPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Navigate to product page - try both URL formats
      let url = `https://www.toolstation.com/p${productCode}`;
      let response = await browserPage.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
      
      // Check if page loaded successfully
      if (!response.ok() && response.status() === 404) {
        throw new Error('Product not found');
      }
      
      // Wait for product content
      await browserPage.waitForSelector('h1', { timeout: 10000 });
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Extract product details
      const product = await browserPage.evaluate((code) => {
        const title = document.querySelector('h1')?.textContent?.trim() || null;
        
        // Extract brand
        const brandText = document.body.textContent;
        const brandMatch = brandText.match(/by\s+([A-Za-z\s&]+)\s+Product/i);
        const brand = brandMatch ? brandMatch[1].trim() : null;
        
        // Extract prices - look for the main price with ex VAT pattern
        const bodyText = document.body.textContent;
        
        // Use regex to find price with ex VAT (this is the main product price)
        const pricePattern = /£([\d,]+\.?\d*)\s+ex\.\s*VAT\s+£([\d,]+\.?\d*)/i;
        const priceMatch = bodyText.match(pricePattern);
        
        let price = null;
        let priceExVAT = null;
        
        if (priceMatch) {
          price = `£${priceMatch[1]}`;
          priceExVAT = `£${priceMatch[2]}`;
        }
        
        // Extract reviews
        const reviewMatch = bodyText.match(/\(\s*(\d+)\s*\)/);
        const reviews = reviewMatch ? parseInt(reviewMatch[1]) : 0;
        
        // Extract rating from stars
        const starsText = bodyText.match(/★+/g);
        const rating = starsText && starsText.length > 0 ? starsText[0].length : null;
        
        // Extract images - look for product images in various places
        const images = [];
        
        // Try to find image gallery or product images
        const imgElements = Array.from(document.querySelectorAll('img'));
        imgElements.forEach(img => {
          const src = img.src || img.getAttribute('data-src') || '';
          // Filter for actual product images, not icons or logos
          if (src && 
              (src.includes('/images/') || src.includes('/media/') || src.includes('product')) &&
              !src.includes('icon') &&
              !src.includes('logo') &&
              !src.includes('brand-img') &&
              src.includes('toolstation')) {
            if (!images.includes(src)) {
              images.push(src);
            }
          }
        });
        
        // If no product images found, include any toolstation CDN images
        if (images.length === 0) {
          imgElements.forEach(img => {
            const src = img.src || '';
            if (src.includes('toolstation') && !images.includes(src)) {
              images.push(src);
            }
          });
        }
        
        // Extract availability
        const availabilityText = bodyText;
        const inStock = !availabilityText.includes('Out of stock');
        
        // Extract description - look for product details section
        let description = null;
        const detailsElements = Array.from(document.querySelectorAll('[class*="detail"], [class*="description"], [class*="product-info"]'));
        if (detailsElements.length > 0) {
          const detailsText = detailsElements.map(el => el.textContent.trim()).join(' ');
          // Get a reasonable excerpt
          if (detailsText.length > 50) {
            description = detailsText.substring(0, 500).trim();
          }
        }
        
        return {
          productCode: code,
          title,
          brand,
          price,
          priceExVAT,
          rating: rating ? `${rating}/5` : null,
          reviews,
          images: images.slice(0, 10),
          inStock,
          description,
          url: window.location.href
        };
      }, productCode);
      
      await browserPage.close();
      
      return product;
      
    } catch (error) {
      await browserPage.close();
      throw new Error(`Product fetch failed: ${error.message}`);
    }
  }
}

module.exports = ToolStationScraper;
