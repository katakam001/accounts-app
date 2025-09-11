export interface ExportRecord {
  id: number; // NOT NULL
  file_name?: string; // NULL
  file_type: string; // NOT NULL
  financial_year: string; // NOT NULL
  status: number; // NOT NULL
  user_id: number; // NOT NULL
  input_key?: string; // NULL
  input_key_timestamp?: string; // NULL
  output_key?: string; // NULL
  output_key_timestamp?: string; // NULL
}