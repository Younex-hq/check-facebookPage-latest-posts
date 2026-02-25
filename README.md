# check FB page for my Diploma

A Node.js bot that monitors a specific Facebook page, extracts the latest posts using a Playwright headless browser, analyzes them using Google's Gemini AI to check if diplomas are available, and sends a summarized notification to Telegram.

## Features

- **Automated Scraping:** Uses Playwright to bypass login walls by automatically closing popups and loading posts from the target Facebook page.
- **AI Analysis:** Sends the latest 5 posts to the Gemini AI API (truncated to minimize token usage) to accurately determine if the posts mention diplomas being ready or available.
- **Telegram Notifications:** Sends a formatted summary of the AI's conclusion directly to your Telegram chat, including previews of the 5 latest posts.
- **State Management:** Keeps track of the last processed post in a local JSON file (`last_post.json`) to prevent duplicate notifications during subsequent runs.
- **Single Execution Design:** Designed to run once per execution (`npm start`), making it perfect for external schedulers like cron, Windows Task Scheduler, or PM2 without keeping a Node process constantly alive.

## Prerequisites

To run this bot, you will need:
- [Node.js](https://nodejs.org/) (v16+)
- [pnpm](https://pnpm.io/) (or npm/yarn)
- A Google Gemini API Key
- A Telegram Bot Token
- A Telegram Chat ID

## Installation & Setup

1. **Clone or download the repository.**

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Install Playwright browsers:**
   ```bash
   npx playwright install chromium
   ```

4. **Environment Variables:**
   Create a `.env` file in the root directory and add your credentials:
   ```env
   # .env
   GEMINI_API_KEY="your_google_gemini_api_key"
   TELEGRAM_BOT_TOKEN="your_telegram_bot_token"
   TELEGRAM_CHAT_ID="your_telegram_chat_id"
   ```

## Usage

This bot is designed to be run as a script. Every time it is executed, it checks the page, analyzes the posts, sends a notification (if the posts are new), and then exits.

```bash
# Compile the TypeScript code (1st time & when updating the code)
pnpm run build

# Run the compiled bot
pnpm start
```

### Scheduling
Because it exits after running, the best way to use this bot is to schedule it. For example, using Linux `cron` to run every 30 minutes:
```bash
*/30 * * * * cd /path/to/Facebook-bot && pnpm start >> bot.log 2>&1
```

## How it Works

1. **Scraping (`src/scraper/facebook.ts`):** 
   - Launches a headless Chromium browser.
   - Navigates to the Facebook page.
   - Attempts to close the persistent "Login" popup using localized selectors (`Close` or `Fermer`) or by targeting the "X" icon directly.
   - Scrolls down the page to ensure at least 5 posts are loaded into the DOM.
   - Extracts the posts directly by identifying their `data-ad-comet-preview="message"` containers.

2. **AI Analysis (`src/ai/gemini.ts`):**
   - Retrieves the first 300 characters of each of the 5 posts.
   - Formats a strict prompt asking Gemini if the posts mention diplomas.
   - Requires Gemini to respond in a strict format: `"Diploma Ready: [Yes✅/No❌]"`.

3. **Notification (`src/notifier/telegram.ts`):**
   - Receives the final analysis string from Gemini.
   - Appends a 100-character preview of all 5 scraped posts below the summary.
   - Sends the message via the Telegraf library.

4. **State Management (`src/state/manager.ts`):**
   - The first post's text is saved to `last_post.json`.
   - On the next run, the newly scraped first post is compared to the saved text. If they are identical, the bot exits silently.

## Tech Stack
- **Language:** TypeScript
- **Scraping:** Playwright (`playwright`)
- **AI:** Google Generative AI (`@google/generative-ai`)
- **Notifications:** Telegram (`telegraf`)
- **Environment config:** `dotenv`
