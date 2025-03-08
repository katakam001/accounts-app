import { JournalEntry } from "./journal-entry.interface";

export interface CachedPage {
    dataRange: { start: number, end: number };
    data: JournalEntry[];
}