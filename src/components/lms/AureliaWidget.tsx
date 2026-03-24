'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Mic, MicOff, Send, Sparkles } from 'lucide-react';

/**
 * AURELIA WIDGET — Omnipresente sur chaque page etudiant
 *
 * Bouton flottant en bas a droite. Un clic ouvre la conversation.
 * Aurelia connait la page actuelle (cours, lecon, quiz) et adapte ses reponses.
 * Supporte texte ET voix (Deepgram STT + ElevenLabs TTS).
 */

interface AureliaWidgetProps {
  /** Contexte de la page actuelle — injecte dans chaque message a Aurelia */
  context?: {
    pageType: 'course' | 'lesson' | 'quiz' | 'dashboard' | 'catalog' | 'certificate' | 'general';
    courseId?: string;
    courseTitle?: string;
    lessonId?: string;
    lessonTitle?: string;
    lessonType?: string;
    conceptId?: string;
    conceptName?: string;
    quizId?: string;
    currentScore?: number;
    masteryLevel?: number;
  };
  /** Nom de l'etudiant pour personnalisation */
  studentName?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AureliaWidget({ context, studentName }: AureliaWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showPulse, setShowPulse] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll au dernier message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input quand ouvert
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Message d'accueil contextuel
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = getContextualGreeting();
      setMessages([{
        id: 'greeting',
        role: 'assistant',
        content: greeting,
        timestamp: new Date(),
      }]);
    }
  }, [isOpen]);

  function getContextualGreeting(): string {
    const name = studentName ? `, ${studentName}` : '';

    switch (context?.pageType) {
      case 'lesson':
        return `Salut${name}! Tu es sur la leçon "${context.lessonTitle}". Si tu as des questions sur le contenu, je suis là pour t'expliquer. 😊`;
      case 'quiz':
        return `Hey${name}! Tu es dans un quiz. Je ne peux pas te donner les réponses, mais je peux t'aider à comprendre les concepts si tu bloques. Demande-moi!`;
      case 'course':
        return `Bonjour${name}! Tu regardes le cours "${context.courseTitle}". Tu veux que je t'explique le contenu ou que je te recommande par où commencer?`;
      case 'dashboard':
        return `Salut${name}! Comment ça va aujourd'hui? Je vois ton tableau de bord — tu veux qu'on révise tes points faibles ou qu'on continue où tu en étais?`;
      case 'certificate':
        return `Félicitations${name}! 🎉 Tu as un certificat ici. Si tu veux revoir la matière ou préparer la suite, je suis là.`;
      default:
        return `Bonjour${name}! Je suis Aurélia, ta tutrice personnelle. Pose-moi n'importe quelle question sur ta formation. 💡`;
    }
  }

  async function sendMessage(content: string) {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowPulse(false);

    try {
      const res = await fetch('/api/lms/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content.trim(),
          context,
          conversationHistory: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();

      setMessages(prev => [...prev, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response || 'Désolée, je n\'ai pas pu traiter ta demande.',
        timestamp: new Date(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Oops, problème de connexion. Réessaie dans un instant!',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleVoice() {
    if (isListening) {
      setIsListening(false);
      // Stop recording — handled by browser MediaRecorder
      return;
    }

    setIsListening(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });

        // Envoyer a Deepgram pour STT
        const formData = new FormData();
        formData.append('audio', blob);

        try {
          const res = await fetch('/api/lms/tutor/stt', { method: 'POST', body: formData });
          const data = await res.json();
          if (data.text) {
            setInput(data.text);
            sendMessage(data.text);
          }
        } catch {
          // Fallback silencieux
        }
        setIsListening(false);
      };

      mediaRecorder.start();
      // Auto-stop apres 30 secondes
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 30000);
    } catch {
      setIsListening(false);
    }
  }

  return (
    <>
      {/* Widget flottant */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-white shadow-lg hover:bg-blue-700 transition-all hover:scale-105"
          aria-label="Parler avec Aurélia"
        >
          {showPulse && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-400" />
            </span>
          )}
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-medium">Aurélia</span>
        </button>
      )}

      {/* Fenetre de chat */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[32rem] flex flex-col rounded-2xl border bg-background shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <div>
                <p className="font-semibold text-sm">Aurélia</p>
                <p className="text-xs opacity-80">Tutrice personnelle</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} aria-label="Fermer" className="p-1 hover:bg-blue-700 rounded">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Context banner */}
          {context?.courseTitle && (
            <div className="px-3 py-1.5 bg-blue-50 text-xs text-blue-700 border-b">
              📖 {context.courseTitle} {context.lessonTitle ? `→ ${context.lessonTitle}` : ''}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-muted rounded-bl-md'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2 text-sm">
                  <span className="animate-pulse">Aurélia réfléchit...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t px-3 py-2 flex items-center gap-2">
            <button
              onClick={toggleVoice}
              className={`p-2 rounded-full transition-colors ${
                isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'hover:bg-muted text-muted-foreground'
              }`}
              aria-label={isListening ? 'Arrêter l\'écoute' : 'Parler'}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
              placeholder="Pose ta question..."
              className="flex-1 text-sm bg-muted rounded-full px-4 py-2 outline-none focus-visible:outline-2 focus-visible:outline-blue-500"
              aria-label="Message pour Aurélia"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full disabled:opacity-30"
              aria-label="Envoyer"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
