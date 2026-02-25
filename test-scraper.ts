import { scrapeLatestPosts } from './src/scraper/facebook';

const TARGET_PAGE = 'https://www.facebook.com/insfpmohammadia';

async function test() {
    console.log("Testing scraper...");
    const posts = await scrapeLatestPosts(TARGET_PAGE, 3);
    console.log("Scraped Posts:");
    console.log(JSON.stringify(posts, null, 2));
}

test();
