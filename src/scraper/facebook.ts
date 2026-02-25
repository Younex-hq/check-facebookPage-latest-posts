import { chromium } from 'playwright';

export interface FacebookPost {
  text: string;
  timestamp: string | null;
  url: string | null;
}

export async function scrapeLatestPosts(pageUrl: string, maxPosts: number = 3): Promise<FacebookPost[]> {
  console.log(`Starting to scrape: ${pageUrl}`);
  
  // Launch browser (headless by default, but headful can help avoid some bot detection initially)
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // Navigate to the Facebook page
    await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Wait for the articles (posts) to load
    // Facebook usually loads posts inside elements with role="article"
    try {
        await page.waitForSelector('div[role="article"]', { timeout: 15000 });
    } catch (e) {
        console.log("Could not find articles initially, trying to wait a bit longer...");
        await page.waitForTimeout(5000);
    }

    // Scroll down multiple times to load more posts if needed
    for (let i = 0; i < 3; i++) {
        await page.keyboard.press('PageDown');
        await page.waitForTimeout(2000);
    }

    // Extract posts
    const postsLocator = page.locator('div[role="article"]');
    const postsCount = await postsLocator.count();
    
    console.log(`Found ${postsCount} posts. Processing up to ${maxPosts}...`);
    
    const posts: FacebookPost[] = [];
    
    for (let i = 0; i < Math.min(postsCount, maxPosts); i++) {
      const article = postsLocator.nth(i);
      
      // The text is usually inside divs with dir="auto", we can extract innerText
      // Alternatively, we get all text content and clean it up
      let text = '';
      try {
          // Attempt to find the main message body. 
          // data-ad-preview="message" is sometimes used, or just getting innerText of the article
          const messageElements = article.locator('div[dir="auto"]');
          const numMessages = await messageElements.count();
          
          for (let j = 0; j < numMessages; j++) {
            const elText = await messageElements.nth(j).innerText();
            if (elText && elText.length > 20) { // arbitrary threshold to avoid short UI text
                 text += elText + '\n';
            }
          }
          
          if (!text.trim()) {
              text = await article.innerText();
          }
      } catch (e) {
          text = await article.innerText();
      }

      // We might need to try and find a timestamp or URL
      // usually inside an <a> tag pointing to /posts/
      let url = null;
      let timestamp = null;
      try {
          const links = await article.locator('a[role="link"]').all();
          for (const link of links) {
              const href = await link.getAttribute('href');
              if (href && (href.includes('/posts/') || href.includes('/photos/'))) {
                  url = href.startsWith('http') ? href : `https://www.facebook.com${href}`;
                  timestamp = await link.innerText(); // The timestamp is often the text of the link
                  break;
              }
          }
      } catch (e) {
          // ignore
      }
      
      posts.push({
          text: text.trim(),
          url,
          timestamp
      });
    }
    
    return posts;
    
  } catch (error) {
    console.error('Error scraping Facebook:', error);
    return [];
  } finally {
    await browser.close();
  }
}
