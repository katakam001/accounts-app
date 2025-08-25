export const environment = {
  production: true,
  apiUrl: 'https://api.taxservice4u.com:8443',
  websocketUrl: 'wss://api.taxservice4u.com:8443', // websocket is disabled in backend and frontend.
  cacheTTL: 86400000, // 1 day in milliseconds
  fieldMappingCacheCapacity: 100, // Number of records to keep in memory for FieldMappingService
  accountCacheCapacity: 100 // Number of records to keep in memory for AccountService
};
