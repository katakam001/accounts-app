export interface JournalItem {
    journal_id: number;
    account_id: number;
    group_id: number;
    amount: number;
    type: boolean; // false for debit, true for credit
    account_name?: string; // Optional field for account name
    group_name?: string; // Optional field for group name
    debit_amount?: number; // Optional field for debit amount
    credit_amount?: number; // Optional field for credit amount
    narration?: string;
  }
  