import { JournalItem } from "./journal-item.interface";

export interface JournalEntry {
    id: number;
    journal_date: Date;
    description: string;
    user_id: number;
    user_name?: string; // Optional field for user name
    financial_year: string; // false for debit, true for credit
    items?: JournalItem[]; // Optional field for associated journal items
  }
  