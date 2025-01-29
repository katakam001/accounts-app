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
  private reconnectInterval = 5000; // Reconnect interval in milliseconds
  private isConnected = false;

  constructor() {
    this.connect();
  }

  private connect() {
    this.socket = new WebSocket('ws://localhost:8080'); // Use your WebSocket server URL

    this.socket.onopen = () => {
      console.log('WebSocket connection established');
      this.isConnected = true;
    };

    this.socket.onclose = () => {
      console.log('WebSocket connection closed');
      this.isConnected = false;
      setTimeout(() => this.connect(), this.reconnectInterval); // Attempt to reconnect
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

    this.socket.onerror = (event) => {
      console.error('WebSocket error:', event);
      this.isConnected = false;
    };
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
    if (this.isConnected) {
      this.socket.send(msg);
    } else {
      console.error('WebSocket is not connected. Message not sent:', msg);
    }
  }

  close() {
    this.socket.close();
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}
