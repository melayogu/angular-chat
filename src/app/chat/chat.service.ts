import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Message } from './message.model';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly messagesSubject = new BehaviorSubject<Message[]>([]);
  private messages: Message[] = [];

  getMessages(): Observable<Message[]> {
    return this.messagesSubject.asObservable();
  }

  addMessage(message: Message): void {
    this.messages.push(message);
    this.messagesSubject.next([...this.messages]);
  }

  clearMessages(): void {
    this.messages = [];
    this.messagesSubject.next([]);
  }

  getMessageCount(): number {
    return this.messages.length;
  }
}
