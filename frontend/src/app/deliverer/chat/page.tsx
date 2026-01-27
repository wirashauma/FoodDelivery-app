'use client';

import { useEffect, useState, useRef } from 'react';
import { Send, ArrowLeft, MessageCircle, RefreshCw } from 'lucide-react';
import { chatAPI } from '@/lib/api';
import Cookies from 'js-cookie';

interface Chat {
  id: number;
  customer_id: number;
  driver_id: number;
  order_id: number;
  customer?: { nama: string };
  order?: { item_id: string };
}

interface Message {
  id: number;
  chat_id: number;
  sender_id: number;
  message: string;
  created_at: string;
}

export default function DelivererChatPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userId = Cookies.get('userId');

  const fetchChats = async () => {
    try {
      const response = await chatAPI.getChats();
      setChats(response.data || []);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId: number) => {
    try {
      const response = await chatAPI.getMessages(chatId);
      setMessages(response.data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
      const interval = setInterval(() => fetchMessages(selectedChat.id), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    setSending(true);
    try {
      await chatAPI.sendMessage(selectedChat.id, newMessage.trim());
      setNewMessage('');
      fetchMessages(selectedChat.id);
    } catch (error) {
      console.error('Error sending message:', error);
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

  if (selectedChat) {
    return (
      <div className="flex flex-col h-[calc(100vh-140px)]">
        {/* Chat Header */}
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3 mb-4">
          <button
            onClick={() => setSelectedChat(null)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-800">
              {selectedChat.customer?.nama || `Customer #${selectedChat.customer_id}`}
            </h2>
            <p className="text-sm text-gray-500">
              Order #{selectedChat.order_id}
            </p>
          </div>
          <button
            onClick={() => fetchMessages(selectedChat.id)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 bg-white rounded-xl p-4 shadow-sm overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MessageCircle size={48} className="mb-2" />
              <p>Belum ada pesan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map(msg => {
                const isMe = msg.sender_id === parseInt(userId || '0');
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
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
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="bg-white rounded-xl p-4 shadow-sm mt-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ketik pesan..."
              className="flex-1 px-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Chat Customer</h1>
          <p className="text-gray-500">{chats.length} percakapan</p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchChats(); }}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {chats.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <MessageCircle className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="font-semibold text-gray-800 mb-2">Belum Ada Chat</h3>
          <p className="text-gray-500">Chat dengan customer akan muncul di sini</p>
        </div>
      ) : (
        <div className="space-y-3">
          {chats.map(chat => (
            <button
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all text-left"
            >
              <div className="flex items-center gap-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <MessageCircle className="text-red-500" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">
                    {chat.customer?.nama || `Customer #${chat.customer_id}`}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Order #{chat.order_id} - {chat.order?.item_id || 'Order'}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
