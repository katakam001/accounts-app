import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class CredentialsInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.body instanceof FormData) {
      // Clone the request to include withCredentials for FormData
      const clonedRequest = req.clone({
        withCredentials: true, // Ensure cookies are sent for FormData requests
      });
      return next.handle(clonedRequest);
    }

    // For other requests, set Content-Type to application/json and withCredentials
    const clonedRequest = req.clone({
      headers: req.headers.set('Content-Type', 'application/json'),
      withCredentials: true // Include credentials (cookies) in the request
    });
    return next.handle(clonedRequest);
  }
}
