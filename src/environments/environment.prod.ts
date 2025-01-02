export const environment = {
  production: true,
  apiUrl: 'http://ec2-54-218-60-14.us-west-2.compute.amazonaws.com:8080',
  cacheTTL: 86400000, // 1 day in milliseconds
  fieldMappingCacheCapacity: 20, // Number of records to keep in memory for FieldMappingService
  accountCacheCapacity: 100 // Number of records to keep in memory for AccountService
};
