import { ByProduct } from "./by-product.interface";
import { ProcessedItem } from "./processed-item.interface";

export interface Yield {
    id: number;
    raw_item_id: number;
    unit_id: number;
    user_id: number;
    financial_year: string;
    processedItems: ProcessedItem[];
    byProducts: ByProduct[];
  }

  