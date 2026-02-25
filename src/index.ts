import cron from 'node-cron';
import { scrapeLatestPosts } from './scraper/facebook';
import { checkPostsForDiplomat } from './ai/gemini';
import { sendTelegramMessage } from './notifier/telegram';
import { loadState, saveState } from './state/manager';

const TARGET_PAGE = 'https://www.facebook.com/insfpmohammadia';

async function mainRun() {
    console.log(`[${new Date().toISOString()}] Starting Facebook Check...`);

    try {
        // 1. Scrape latest posts
        const posts = await scrapeLatestPosts(TARGET_PAGE, 3);

        if (posts.length === 0) {
            console.log("No posts gathered or page scraping failed.");
            return;
        }

        // Check against state
        const state = loadState();
        const latestPostText = posts[0].text;

        if (state.lastPostText === latestPostText) {
            console.log("The latest post is the same as the last check. No need to notify.");
            return;
        }

        console.log("New posts found! Analyzing with Gemini...");

        // 2. Analyze posts
        const aiSummary = await checkPostsForDiplomat(posts);

        console.log("Gemini Output:");
        console.log(aiSummary);

        // Optional: you can choose to only send if it contains "Yes", 
        // but the user's prompt requested the AI generates the summary "diplomat: [Yes/No]" 
        // and sends it to Telegram.

        // 3. Send Telegram Message
        const sent = await sendTelegramMessage(aiSummary);

        // 4. Update state if sent successfully
        if (sent) {
            saveState({
                lastPostText: latestPostText,
                lastChecked: new Date().toISOString()
            });
            console.log("State updated successfully.");
        }
    } catch (error) {
        console.error("Error during main run:", error);
    }
}

// Run immediately on start (optional, useful for testing)
mainRun();

// Schedule to run every 6 hours
console.log("Scheduling bot to run every 6 hours (0 */6 * * *)...");
cron.schedule('0 */6 * * *', () => {
    mainRun();
});
