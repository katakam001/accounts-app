export interface CashEntry {
  unique_entry_id?:string
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
  group_id:number;
  cash_account_id?: number; // Optional CASH account ID
  cash_group_id?: number;   // Optional CASH group ID
}