import { GoogleGenerativeAI } from "@google/generative-ai";
import { FacebookPost } from "../scraper/facebook";
import * as dotenv from 'dotenv';
dotenv.config();

// Initialize the API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function checkPostsForDiplomat(posts: FacebookPost[]): Promise<string> {
    if (!posts || posts.length === 0) {
        return "diplomat: No, sumury : No posts were found or scraped successfully.";
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Use a fast and cost-effective model

        // Prepare the posts text
        let combinedPosts = "";
        posts.forEach((p, idx) => {
            combinedPosts += `POST ${idx + 1}:\n${p.text.substring(0, 300)}\n---\n`;
        });

        // The user's requested output format is very strict
        const prompt = `
You are an AI assistant that monitors a Facebook page for an institute.
Your job is to read the latest posts and determine if they talk about if diplomas are available or ready to be taken.

The user wants the output to strictly match this format:
"Diploma Ready: [Yes✅/No❌]"

Here are the latest posts:
${combinedPosts}

Analyze these posts and output the result EXACTLY following the requested format. Do not add any conversational text before or after the required text format.
If Yes, mention which post numbers talk about it under the message.
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        return responseText.trim();
    } catch (error) {
        console.error("Error analyzing posts with Gemini:", error);
        return "diplomat: Error, sumury : There was an error connecting to the Gemini API.";
    }
}
