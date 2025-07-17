import { DBConfig } from 'ngx-indexed-db';
import { DB_VERSION } from './db-version.config';

export const dbConfig: DBConfig = {
  name: 'MyAppDB',
  version: DB_VERSION, // Use the version from the configuration file
  objectStoresMeta: [
    {
      store: 'fieldMappings',
      storeConfig: { keyPath: 'id', autoIncrement: true },
      storeSchema: [
        { name: 'category_id', keypath: 'category_id', options: { unique: false } },
        { name: 'field_id', keypath: 'field_id', options: { unique: false } },
        { name: 'field_type', keypath: 'field_type', options: { unique: false } },
        { name: 'required', keypath: 'required', options: { unique: false } },
        { name: 'field_category', keypath: 'field_category', options: { unique: false } },
        { name: 'exclude_from_total', keypath: 'exclude_from_total', options: { unique: false } },
        { name: 'category_name', keypath: 'category_name', options: { unique: false } },
        { name: 'field_name', keypath: 'field_name', options: { unique: false } }
      ]
    },
    {
      store: 'accounts', // Add the accounts object store
      storeConfig: { keyPath: 'id', autoIncrement: true },
      storeSchema: [
        { name: 'name', keypath: 'name', options: { unique: false } },
        { name: 'user_id', keypath: 'user_id', options: { unique: false } },
        { name: 'financial_year', keypath: 'financial_year', options: { unique: false } },
        { name: 'group', keypath: 'group', options: { unique: false } }, // Store group object directly
        { name: 'credit_balance', keypath: 'credit_balance', options: { unique: false } },
        { name: 'debit_balance', keypath: 'debit_balance', options: { unique: false } },
        { name: 'isDealer', keypath: 'isDealer', options: { unique: false } },
        { name: 'address', keypath: 'address', options: { unique: false } } // Store address object directly
      ]
    },
    {
      store: 'dayBookEntries', // Add the dayBookEntries object store
      storeConfig: { keyPath: 'key', autoIncrement: true },
      storeSchema: [
        { name: 'entries', keypath: 'entries', options: { unique: false } }
      ]
    },
    {
      store: 'ledgerEntries', // Ledger Entries Store for ledger data
      storeConfig: { keyPath: 'account_id', autoIncrement: false }, // Use account_id as the key
      storeSchema: [
        { name: 'account_name', keypath: 'account_name', options: { unique: false } },
        { name: 'entries', keypath: 'entries', options: { unique: false } } // Array of ledger entries
      ]
    },
    {
      store: 'accountCopyEntries', // Ledger Entries Store for ledger data
      storeConfig: { keyPath: 'account_id', autoIncrement: false }, // Use account_id as the key
      storeSchema: [
        { name: 'account_name', keypath: 'account_name', options: { unique: false } },
        { name: 'entries', keypath: 'entries', options: { unique: false } } // Array of ledger entries
      ]
    },
    {
      store: 'accountIndex', // Account Index Store for maintaining account insertion order
      storeConfig: { keyPath: 'id', autoIncrement: false },
      storeSchema: [
        { name: 'account_ids', keypath: 'account_ids', options: { unique: false } }
      ]
    }
  ]
};
