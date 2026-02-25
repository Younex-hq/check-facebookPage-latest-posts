import { Telegraf } from 'telegraf';
import * as dotenv from 'dotenv';
dotenv.config();

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

export async function sendTelegramMessage(message: string): Promise<boolean> {
    if (!botToken || !chatId) {
        console.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in environment variables.");
        return false;
    }

    try {
        const bot = new Telegraf(botToken);
        await bot.telegram.sendMessage(chatId, message);
        console.log("Telegram message sent successfully!");
        return true;
    } catch (error) {
        console.error("Error sending Telegram message:", error);
        return false;
    }
}
