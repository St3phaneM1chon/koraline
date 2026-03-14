'use client';

/**
 * IncomingCallModal
 * Popup shown when an incoming call is detected.
 * Shows caller ID info and client lookup.
 */

import { useEffect, useState } from 'react';
import { Phone, PhoneOff, User } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import type { VoipCall } from '@/hooks/useVoip';

interface IncomingCallModalProps {
  call: VoipCall;
  onAnswer: () => void;
  onReject: () => void;
}

interface CallerInfo {
  name: string | null;
  email: string | null;
  isClient: boolean;
}

export default function IncomingCallModal({ call, onAnswer, onReject }: IncomingCallModalProps) {
  const { t } = useI18n();
  const [callerInfo, setCallerInfo] = useState<CallerInfo | null>(null);

  // Lookup caller in CRM by phone number
  useEffect(() => {
    if (call.remoteNumber) {
      fetch(`/api/admin/customers?search=${encodeURIComponent(call.remoteNumber)}&limit=1`)
        .then((res) => res.json())
        .then((data) => {
          const customer = data.customers?.[0];
          if (customer) {
            setCallerInfo({
              name: customer.name || `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() || null,
              email: customer.email || null,
              isClient: true,
            });
          }
        })
        .catch(() => {});
    }
  }, [call.remoteNumber]);

  // Handle Escape key to reject call
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onReject();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onReject]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm" role="presentation">
      <div role="dialog" aria-modal="true" aria-label={t('voip.call.incomingCall')} className="bg-white rounded-2xl shadow-2xl p-6 w-[340px] animate-bounce-gentle">
        {/* Caller Info */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-3">
            <User className="w-8 h-8 text-teal-600" />
          </div>

          <div className="text-lg font-semibold text-gray-900">
            {call.remoteName || callerInfo?.name || t('voip.call.unknownCaller')}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {call.remoteNumber}
          </div>

          {callerInfo?.isClient && (
            <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
              {t('voip.call.existingClient')}
            </div>
          )}

          <div className="text-sm text-gray-400 mt-2 animate-pulse">
            {t('voip.call.incomingCall')}...
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={onReject}
            className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
            aria-label={t('voip.call.reject')}
          >
            <PhoneOff className="w-7 h-7" aria-hidden="true" />
          </button>

          <button
            onClick={onAnswer}
            className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors shadow-lg animate-pulse"
            aria-label={t('voip.call.answer')}
            autoFocus
          >
            <Phone className="w-7 h-7" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
