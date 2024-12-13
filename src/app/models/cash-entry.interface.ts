export interface CashEntry {
  id?: number;
  cash_entry_date: Date;
  account_id: number;
  account_name?: string;
  narration_description: string;
  amount: number;
  type: boolean; // false for debit, true for credit
  cash_debit: number;
  cash_credit: number;
  balance: number;
  user_id: number;
  financial_year: string;
}