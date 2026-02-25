import * as fs from 'fs';
import * as path from 'path';

const STATE_FILE = path.join(__dirname, '../../last_post.json');

export interface BotState {
    lastPostText: string | null;
    lastChecked: string | null;
}

export function loadState(): BotState {
    try {
        if (fs.existsSync(STATE_FILE)) {
            const data = fs.readFileSync(STATE_FILE, 'utf-8');
            if (data.trim() === '') {
                return { lastPostText: null, lastChecked: null };
            }
            return JSON.parse(data) as BotState;
        }
    } catch (e) {
        console.error("Error loading state:", e);
    }
    return { lastPostText: null, lastChecked: null };
}

export function saveState(state: BotState): void {
    try {
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
    } catch (e) {
        console.error("Error saving state:", e);
    }
}
