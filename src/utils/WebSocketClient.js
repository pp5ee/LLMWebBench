// WebSocket客户端工具
class WebSocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.messageHandlers = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = null;
  }

  // 连接WebSocket
  connect() {
    if (this.socket) {
      this.disconnect();
    }

    // 自动识别当前网址的协议、主机名和端口
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = window.location.port || (protocol === 'wss:' ? '443' : '80');
    
    // 构建WebSocket URL
    const wsUrl = `${protocol}//${host}:${port}/ws`;
    
    console.log(`正在连接WebSocket: ${wsUrl}`);
    
    try {
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        console.log('WebSocket连接已建立');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      };
      
      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.messageHandlers.forEach(handler => handler(message));
        } catch (error) {
          console.error('解析WebSocket消息时出错:', error);
        }
      };
      
      this.socket.onclose = () => {
        console.log('WebSocket连接已关闭');
        this.isConnected = false;
        this.attemptReconnect();
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket错误:', error);
        this.isConnected = false;
      };
    } catch (error) {
      console.error('创建WebSocket连接时出错:', error);
    }
  }
  
  // 断开WebSocket连接
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
  
  // 尝试重新连接
  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`尝试重新连接 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, 3000); // 3秒后重试
    } else {
      console.error('达到最大重连次数，放弃重连');
    }
  }
  
  // 发送消息
  sendMessage(message) {
    if (this.isConnected && this.socket) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.error('WebSocket未连接，无法发送消息');
    }
  }
  
  // 添加消息处理器
  addMessageHandler(handler) {
    this.messageHandlers.push(handler);
  }
  
  // 移除消息处理器
  removeMessageHandler(handler) {
    const index = this.messageHandlers.indexOf(handler);
    if (index !== -1) {
      this.messageHandlers.splice(index, 1);
    }
  }
}

// 创建单例实例
const webSocketClient = new WebSocketClient();

export default webSocketClient; 