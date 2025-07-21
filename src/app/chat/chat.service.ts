import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Message } from './message.model';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly messagesSubject = new BehaviorSubject<Message[]>([]);
  private messages: Message[] = [];
  private readonly apiUrl = 'https://localhost:7140/OpenAi'; // 恢復原本的路由

  constructor(private http: HttpClient) {}

  getMessages(): Observable<Message[]> {
    return this.messagesSubject.asObservable();
  }

  addMessage(message: Message): void {
    this.messages.push(message);
    this.messagesSubject.next([...this.messages]);
  }

  updateLastMessage(text: string): void {
    if (this.messages.length > 0) {
      const lastMessage = this.messages[this.messages.length - 1];
      lastMessage.text = text;
      this.messagesSubject.next([...this.messages]);
    }
  }

  async sendStreamMessage(message: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');

      if (!reader) {
        throw new Error('無法獲取回應讀取器');
      }

      // 創建 AI 回覆訊息
      const aiMessage: Message = {
        id: Date.now().toString(),
        text: '',
        sender: 'AI助手',
        timestamp: new Date(),
        isOwn: false
      };
      
      this.addMessage(aiMessage);

      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        console.log('Received chunk:', chunk); // 調試信息
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            console.log('Parsed data:', data); // 調試信息
            
            if (data === '[DONE]') {
              return;
            }

            // 直接使用文字內容，不解析 JSON
            if (data) {
              accumulatedText += data;
              console.log('Accumulated text:', accumulatedText); // 調試信息
              this.updateLastMessage(accumulatedText);
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream 訊息發送失敗:', error);
      
      // 添加錯誤訊息
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: '抱歉，發生了錯誤，請稍後再試。',
        sender: 'AI助手',
        timestamp: new Date(),
        isOwn: false
      };
      
      this.addMessage(errorMessage);
    }
  }

  clearMessages(): void {
    this.messages = [];
    this.messagesSubject.next([]);
  }

  getMessageCount(): number {
    return this.messages.length;
  }
}
