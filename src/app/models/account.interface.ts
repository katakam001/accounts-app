import { Address } from "./address.interface";
import { Group } from "./group.interface";

export interface Account {
  id: number;
  name: string;
  description?: string;
  user_id?: number;
  credit_balance: number;
  debit_balance: number;
  financial_year: string;
  isDealer?: boolean;
  group: Group; // Change to a single group property
  address?: Address; // Add the address property
}
