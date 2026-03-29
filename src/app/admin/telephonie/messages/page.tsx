'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MessageSquare, Send, Phone, Plus, Search, ArrowLeft,
  CheckCircle, Clock, AlertTriangle, Smile,
} from 'lucide-react';
import { PageHeader, Button, EmptyState } from '@/components/admin';
import { toast } from 'sonner';
import { addCSRFHeader } from '@/lib/csrf';

interface Message {
  id: string;
  from: string;
  to: string;
  body: string;
  direction: 'inbound' | 'outbound';
  status: string;
  channel: string;
  timestamp: string;
}

interface Conversation {
  phoneNumber: string;
  lastMessage?: Message;
  messageCount: number;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/voip/messaging');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.data || []);
      }
    } catch {
      // Silent fail — conversations may be empty
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (phone: string) => {
    try {
      const res = await fetch(`/api/voip/messaging?phoneNumber=${encodeURIComponent(phone)}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.data || []);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch {
      toast.error('Erreur lors du chargement des messages');
    }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    if (selectedPhone) fetchMessages(selectedPhone);
  }, [selectedPhone, fetchMessages]);

  // Poll for new messages every 10s when conversation is open
  useEffect(() => {
    if (!selectedPhone) return;
    const interval = setInterval(() => fetchMessages(selectedPhone), 10000);
    return () => clearInterval(interval);
  }, [selectedPhone, fetchMessages]);

  const sendMessage = async () => {
    const to = selectedPhone || newNumber;
    if (!to || !newMessage.trim()) return;

    setSending(true);
    try {
      const res = await fetch('/api/voip/messaging', {
        method: 'POST',
        headers: { ...addCSRFHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: to.startsWith('+') ? to : `+1${to.replace(/\D/g, '')}`,
          body: newMessage.trim(),
          channel: 'sms',
        }),
      });

      if (res.ok) {
        setNewMessage('');
        if (!selectedPhone) {
          setSelectedPhone(to.startsWith('+') ? to : `+1${to.replace(/\D/g, '')}`);
          setShowNewConversation(false);
          setNewNumber('');
        }
        await fetchMessages(selectedPhone || to);
        await fetchConversations();
        toast.success('Message envoyé');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Erreur lors de l\'envoi');
      }
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setSending(false);
    }
  };

  const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    return phone;
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('fr-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const filteredConversations = conversations.filter(c =>
    !searchTerm || c.phoneNumber.includes(searchTerm) || c.lastMessage?.body?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <PageHeader
        title="Messages texte"
        subtitle="Envoyez et recevez des SMS depuis vos numéros Telnyx"
      />

      <div className="flex flex-1 border rounded-lg overflow-hidden mt-4 bg-white dark:bg-zinc-900">
        {/* Left panel — Conversations list */}
        <div className={`w-full md:w-80 lg:w-96 border-r flex flex-col ${selectedPhone ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-3 border-b space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-zinc-50 dark:bg-zinc-800"
                />
              </div>
              <Button size="sm" onClick={() => setShowNewConversation(true)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* New conversation input */}
          {showNewConversation && (
            <div className="p-3 border-b bg-blue-50 dark:bg-blue-900/20">
              <p className="text-xs text-zinc-500 mb-1">Nouveau message</p>
              <div className="flex gap-2">
                <input
                  type="tel"
                  placeholder="+14505551234"
                  value={newNumber}
                  onChange={(e) => setNewNumber(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border rounded-lg"
                  autoFocus
                />
                <Button size="sm" variant="secondary" onClick={() => {
                  if (newNumber) {
                    const formatted = newNumber.startsWith('+') ? newNumber : `+1${newNumber.replace(/\D/g, '')}`;
                    setSelectedPhone(formatted);
                    setShowNewConversation(false);
                  }
                }}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-zinc-400">Chargement...</div>
            ) : filteredConversations.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="Aucune conversation"
                description="Envoyez votre premier SMS en cliquant sur +"
              />
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.phoneNumber}
                  onClick={() => setSelectedPhone(conv.phoneNumber)}
                  className={`w-full p-3 text-left border-b hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${
                    selectedPhone === conv.phoneNumber ? 'bg-blue-50 dark:bg-blue-900/30 border-l-2 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{formatPhone(conv.phoneNumber)}</p>
                      <p className="text-xs text-zinc-500 truncate">{conv.lastMessage?.body || 'Pas de message'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {conv.lastMessage?.timestamp && (
                        <p className="text-xs text-zinc-400">{formatTime(conv.lastMessage.timestamp)}</p>
                      )}
                      <p className="text-xs text-zinc-400">{conv.messageCount} msg</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right panel — Messages */}
        <div className={`flex-1 flex flex-col ${!selectedPhone ? 'hidden md:flex' : 'flex'}`}>
          {!selectedPhone ? (
            <div className="flex-1 flex items-center justify-center text-zinc-400">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Sélectionnez une conversation ou créez-en une nouvelle</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-3 border-b flex items-center gap-3">
                <button onClick={() => setSelectedPhone(null)} className="md:hidden">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">{formatPhone(selectedPhone)}</p>
                  <p className="text-xs text-zinc-400">SMS via +1 438 803-0370</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-zinc-400 mt-8">
                    <Smile className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aucun message encore. Envoyez le premier!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                          msg.direction === 'outbound'
                            ? 'bg-blue-500 text-white rounded-br-md'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-md'
                        }`}
                      >
                        <p>{msg.body}</p>
                        <div className={`flex items-center gap-1 mt-1 text-xs ${
                          msg.direction === 'outbound' ? 'text-blue-200' : 'text-zinc-400'
                        }`}>
                          <span>{formatTime(msg.timestamp)}</span>
                          {msg.direction === 'outbound' && (
                            msg.status === 'delivered' ? <CheckCircle className="w-3 h-3" /> :
                            msg.status === 'failed' ? <AlertTriangle className="w-3 h-3 text-red-300" /> :
                            <Clock className="w-3 h-3" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Tapez votre message..."
                    className="flex-1 px-4 py-2.5 border rounded-full bg-zinc-50 dark:bg-zinc-800 text-sm"
                    disabled={sending}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-300 text-white flex items-center justify-center transition-colors"
                  >
                    <Send className="w-4 h-4" />
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
