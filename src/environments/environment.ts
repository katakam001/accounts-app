// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
  websocketUrl: 'ws://127.0.0.1:8080', // Replace with your WebSocket server URL
  cacheTTL: 86400000, // 1 day in milliseconds
  fieldMappingCacheCapacity: 2, // Number of records to keep in memory for FieldMappingService
  accountCacheCapacity: 5 // Number of records to keep in memory for AccountService
};


/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
