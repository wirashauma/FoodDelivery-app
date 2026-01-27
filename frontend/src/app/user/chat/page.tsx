'use client';

import { useEffect, useState, useRef } from 'react';
import { MessageCircle, Send, RefreshCw, ArrowLeft } from 'lucide-react';
import { chatAPI } from '@/lib/api';
import Cookies from 'js-cookie';
import { logger } from '@/lib/logger';

interface Chat {
  id: number;
  customer_id: number;
  driver_id: number;
  order_id: number;
  driver?: { nama: string };
  order?: { item_id: string };
}

interface Message {
  id: number;
  chat_id: number;
  sender_id: number;
  message: string;
  created_at: string;
}

export default function ChatPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userId = Cookies.get('userId');

  logger.component.debug('ChatPage rendered', { userId, selectedChatId: selectedChat?.id });

  const fetchChats = async () => {
    logger.socket.debug('Fetching chats list');
    try {
      const response = await chatAPI.getChats();
      setChats(response.data || []);
      logger.socket.info('Chats loaded', { count: response.data?.length || 0 });
    } catch (error) {
      logger.socket.error('Error fetching chats', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId: number) => {
    logger.socket.debug('Fetching messages', { chatId });
    try {
      const response = await chatAPI.getMessages(chatId);
      setMessages(response.data || []);
      logger.socket.debug('Messages loaded', { chatId, count: response.data?.length || 0 });
    } catch (error) {
      logger.socket.error('Error fetching messages', { chatId, error });
    }
  };

  useEffect(() => {
    logger.component.info('ChatPage mounted');
    fetchChats();
    return () => {
      logger.component.debug('ChatPage unmounted');
    };
  }, []);

  useEffect(() => {
    if (selectedChat) {
      logger.socket.info('Chat selected, starting polling', { chatId: selectedChat.id });
      fetchMessages(selectedChat.id);
      const interval = setInterval(() => fetchMessages(selectedChat.id), 5000);
      return () => {
        logger.socket.debug('Stopping message polling', { chatId: selectedChat.id });
        clearInterval(interval);
      };
    }
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    logger.socket.info('Sending message', { chatId: selectedChat.id, messageLength: newMessage.length });
    setSending(true);
    try {
      await chatAPI.sendMessage(selectedChat.id, newMessage.trim());
      logger.socket.info('Message sent successfully', { chatId: selectedChat.id });
      setNewMessage('');
      fetchMessages(selectedChat.id);
    } catch (error) {
      logger.socket.error('Error sending message', { chatId: selectedChat.id, error });
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Chat</h1>
        <button
          onClick={() => { setLoading(true); fetchChats(); }}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm h-[calc(100%-60px)] flex overflow-hidden">
        {/* Chat List */}
        <div className="w-80 border-r border-gray-100 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="mx-auto text-gray-300 mb-2" size={48} />
              <p className="text-gray-500">Belum ada chat</p>
              <p className="text-xs text-gray-400 mt-1">Chat akan muncul saat ada pesanan aktif</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {chats.map(chat => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedChat?.id === chat.id ? 'bg-red-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-500 font-semibold">
                        {chat.driver?.nama?.charAt(0)?.toUpperCase() || 'D'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">
                        {chat.driver?.nama || `Driver #${chat.driver_id}`}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        Order #{chat.order_id} - {chat.order?.item_id || 'Order'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col">
          {!selectedChat ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="mx-auto text-gray-300 mb-2" size={64} />
                <p className="text-gray-500">Pilih chat untuk mulai percakapan</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedChat(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-500 font-semibold">
                      {selectedChat.driver?.nama?.charAt(0)?.toUpperCase() || 'D'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {selectedChat.driver?.nama || `Driver #${selectedChat.driver_id}`}
                    </p>
                    <p className="text-sm text-gray-500">Order #{selectedChat.order_id}</p>
                  </div>
                  <button
                    onClick={() => fetchMessages(selectedChat.id)}
                    className="ml-auto p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <RefreshCw size={18} className="text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Belum ada pesan</p>
                  </div>
                ) : (
                  <>
                    {messages.map(msg => {
                      const isMe = msg.sender_id === parseInt(userId || '0');
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs px-4 py-2 rounded-2xl ${
                              isMe
                                ? 'bg-red-500 text-white rounded-br-none'
                                : 'bg-gray-100 text-gray-800 rounded-bl-none'
                            }`}
                          >
                            <p>{msg.message}</p>
                            <p
                              className={`text-xs mt-1 ${
                                isMe ? 'text-red-100' : 'text-gray-400'
                              }`}
                            >
                              {formatTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-100">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Ketik pesan..."
                    className="flex-1 px-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="bg-red-500 text-white p-3 rounded-xl hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
