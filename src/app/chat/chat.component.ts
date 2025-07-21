import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from './chat.service';
import { Message } from './message.model';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') private readonly messagesContainer!: ElementRef;

  messages: Message[] = [];
  newMessage: string = '';
  currentUser: string = '使用者';

  constructor(private readonly chatService: ChatService) {}

  ngOnInit() {
    this.chatService.getMessages().subscribe((messages: Message[]) => {
      this.messages = messages;
    });

    // 載入預設訊息
    this.addWelcomeMessage();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  async sendMessage() {
    if (this.newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        text: this.newMessage,
        sender: this.currentUser,
        timestamp: new Date(),
        isOwn: true
      };

      this.chatService.addMessage(message);
      const userMessage = this.newMessage;
      this.newMessage = '';

      // 使用 Stream API 發送訊息到 OpenAI
      try {
        await this.chatService.sendStreamMessage(userMessage);
      } catch (error) {
        console.error('發送訊息失敗:', error);
        
        // 如果 Stream 失敗，回退到模擬回覆
        setTimeout(() => {
          this.simulateReply();
        }, 1000);
      }
    }
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private addWelcomeMessage() {
    const welcomeMessage: Message = {
      id: 'welcome',
      text: '歡迎來到聊天室！',
      sender: '系統',
      timestamp: new Date(),
      isOwn: false
    };
    this.chatService.addMessage(welcomeMessage);
  }

  private simulateReply() {
    const replies = [
      '好的，我了解了！',
      '謝謝你的分享',
      '有趣的想法！',
      '我同意你的看法',
      '可以告訴我更多嗎？',
      '這很有意思',
      '讓我想想...'
    ];

    const randomReply = replies[Math.floor(Math.random() * replies.length)];

    const replyMessage: Message = {
      id: Date.now().toString(),
      text: randomReply,
      sender: '聊天機器人',
      timestamp: new Date(),
      isOwn: false
    };

    this.chatService.addMessage(replyMessage);
  }

  private scrollToBottom(): void {
    if (this.messagesContainer?.nativeElement) {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
    }
  }
}
