import { Group } from "./group.interface";

export interface Account {
    id: number;
    name: string;
    description?: string;
    user_id?: number;
    credit_balance: number;
    debit_balance: number;
    financial_year: string;
    groups?: Group[]; // Add the groups property
  }
  