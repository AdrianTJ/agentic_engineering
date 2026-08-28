/** Where durable state lives. Context is a cache; this is the database. (Ch.4/Ch.6) */
import { join } from "node:path";

export const STATE_DIR = ".state";
export const LOG_PATH = join(STATE_DIR, "events.jsonl");
export const NOTES_PATH = join(STATE_DIR, "NOTES.md");
