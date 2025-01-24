import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: WebSocket;
  private insertSubject = new Subject<any>();
  private updateSubject = new Subject<any>();
  private deleteSubject = new Subject<any>();

  constructor() {
    this.socket = new WebSocket('ws://localhost:8080'); // Use your WebSocket server URL

    this.socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    this.socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    this.socket.onmessage = (messageEvent) => {
      const data = JSON.parse(messageEvent.data);
      console.log('Received data:', data);
      switch (data.type) {
        case 'INSERT':
          this.insertSubject.next(data);
          break;
        case 'UPDATE':
          this.updateSubject.next(data);
          break;
        case 'DELETE':
          this.deleteSubject.next(data);
          break;
      }
    };

    this.socket.onerror = (event) => console.error(event);
  }

  onEvent(event: string): Observable<any> {
    switch (event) {
      case 'INSERT':
        return this.insertSubject.asObservable();
      case 'UPDATE':
        return this.updateSubject.asObservable();
      case 'DELETE':
        return this.deleteSubject.asObservable();
      default:
        throw new Error(`Unknown event type: ${event}`);
    }
  }

  sendMessage(msg: string) {
    this.socket.send(msg);
  }

  close() {
    this.socket.close();
  }
}
