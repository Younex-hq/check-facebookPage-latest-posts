import { chromium } from 'playwright';

export interface FacebookPost {
  text: string;
  timestamp: string | null;
  url: string | null;
}

export async function scrapeLatestPosts(pageUrl: string, maxPosts: number = 5): Promise<FacebookPost[]> {
  console.log(`Starting to scrape: ${pageUrl}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  // OPTIMIZATION: Block all heavy resources (images, fonts, media, css)
  await page.route('**/*', (route) => {
    const requestType = route.request().resourceType();
    if (['image', 'font', 'media'].includes(requestType)) { // if stylesheets not loaded we get a problem with number of posts !! 
      route.abort();
    } else {
      route.continue();
    }
  });

  try {
    await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    // Close the Facebook login popup by clicking the X button
    // The aria-label can be localized (e.g. "Close" in English, "Fermer" in French)
    try {
      const closeBtn = page.locator('div[aria-label="Close"][role="button"], div[aria-label="Fermer"][role="button"]').first();
      await closeBtn.waitFor({ timeout: 5000 });
      await closeBtn.click();
      console.log('Closed login popup.');
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log('Close button not found by aria-label, trying fallback...');
      // Fallback: try clicking the close icon by its CSS background image pattern
      try {
        const iconClose = page.locator('div[role="button"] i.x1b0d499.x1d69dk1').first();
        await iconClose.waitFor({ timeout: 3000 });
        await iconClose.click();
        console.log('Closed login popup via icon fallback.');
        await page.waitForTimeout(2000);
      } catch (e2) {
        console.log('No login popup found, continuing...');
      }
    }

    // Scroll down to load more posts
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('PageDown');
      await page.waitForTimeout(1000);
    }

    /* // scroll by pixels
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => window.scrollBy(0, 1000));
      await page.waitForTimeout(1500);

      // Early exit if we already have enough posts
      const count = await page.locator('div[data-ad-comet-preview="message"]').count();
      if (count >= maxPosts) {
        console.log(`Loaded ${count} posts after ${i + 1} scrolls.`);
        break;
      }
    }
    */

    // Use page.evaluate with the exact same logic as the user's working browser script
    const extractedPosts = await page.evaluate((max: number) => {
      const selector = 'div[data-ad-comet-preview="message"]';
      const elements = document.querySelectorAll(selector);
      const results: { text: string }[] = [];

      elements.forEach((el, index) => {
        if (index >= max) return;
        const text = (el as HTMLElement).innerText || el.textContent || '';
        results.push({ text: text.trim() });
      });

      return results;
    }, maxPosts);

    console.log(`Found ${extractedPosts.length} posts. Processing up to ${maxPosts}...`);

    const posts: FacebookPost[] = extractedPosts.map(p => ({
      text: p.text,
      url: null,
      timestamp: null
    }));

    return posts;

  } catch (error) {
    console.error('Error scraping Facebook:', error);
    return [];
  } finally {
    await browser.close();
  }
}
