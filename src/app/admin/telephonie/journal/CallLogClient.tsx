'use client';

/**
 * CallLogClient - Interactive call log table with filters.
 */

import { useState } from 'react';
import useSWR from 'swr';
import { useI18n } from '@/i18n/client';
import { formatDuration } from '@/hooks/useCallState';
import SatisfactionBadge from '@/components/voip/SatisfactionBadge';
import AudioPlayer from '@/components/voip/AudioPlayer';
import {
  Phone, PhoneIncoming, PhoneOutgoing, Search,
  ChevronLeft, ChevronRight, FileText, Briefcase, ShoppingCart,
  Star, Mail,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef } from 'react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function CallLogClient() {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [direction, setDirection] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Bridges #8 + #13 + #45 + #46: CRM deals, orders, loyalty, emails for expanded call
  const [callBridgeData, setCallBridgeData] = useState<Record<string, {
    crmDeals?: Array<{ id: string; title: string; stageName: string; value: number }> | null;
    recentOrders?: Array<{ id: string; orderNumber: string; status: string; total: number; createdAt: string }> | null;
    loyaltyInfo?: { currentTier: string; currentPoints: number } | null;
    recentEmails?: Array<{ id: string; subject: string; status: string; sentAt: string }> | null;
  }>>({});
  const fetchedBridgeRef = useRef<Set<string>>(new Set());

  const fetchCallBridge = useCallback(async (callId: string) => {
    if (fetchedBridgeRef.current.has(callId)) return;
    fetchedBridgeRef.current.add(callId);
    try {
      // Fetch main bridge + loyalty + emails in parallel
      const [mainRes, loyaltyRes, emailsRes] = await Promise.all([
        fetch(`/api/admin/voip/call-logs/${callId}`),
        fetch(`/api/admin/voip/call-logs/${callId}/loyalty`),
        fetch(`/api/admin/voip/call-logs/${callId}/emails`),
      ]);

      const mainJson = mainRes.ok ? await mainRes.json() : null;
      const loyaltyJson = loyaltyRes.ok ? await loyaltyRes.json() : null;
      const emailsJson = emailsRes.ok ? await emailsRes.json() : null;

      setCallBridgeData((prev) => ({
        ...prev,
        [callId]: {
          crmDeals: mainJson?.data?.crmDeals ?? null,
          recentOrders: mainJson?.data?.recentOrders ?? null,
          loyaltyInfo: loyaltyJson?.data?.enabled ? {
            currentTier: loyaltyJson.data.currentTier,
            currentPoints: loyaltyJson.data.currentPoints,
          } : null,
          recentEmails: emailsJson?.data?.enabled ? emailsJson.data.recentEmails : null,
        },
      }));
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (expandedId) fetchCallBridge(expandedId);
  }, [expandedId, fetchCallBridge]);

  const params = new URLSearchParams();
  params.set('page', page.toString());
  params.set('limit', '25');
  if (search) params.set('search', search);
  if (direction) params.set('direction', direction);
  if (status) params.set('status', status);
  if (dateFrom) params.set('dateFrom', dateFrom);
  if (dateTo) params.set('dateTo', dateTo);

  const { data, isLoading } = useSWR(`/api/admin/voip/call-logs?${params}`, fetcher, {
    refreshInterval: 15000,
  });

  const directionIcon = (dir: string) => {
    switch (dir) {
      case 'INBOUND': return <PhoneIncoming className="w-4 h-4 text-[#818cf8]" />;
      case 'OUTBOUND': return <PhoneOutgoing className="w-4 h-4 text-emerald-600" />;
      default: return <Phone className="w-4 h-4 text-[var(--k-text-muted)]" />;
    }
  };

  const statusColors: Record<string, string> = {
    COMPLETED: 'bg-emerald-500/15 text-emerald-400',
    MISSED: 'bg-red-500/15 text-red-400',
    VOICEMAIL: 'bg-orange-500/15 text-orange-400',
    IN_PROGRESS: 'bg-[#6366f1]/15 text-[#818cf8]',
    FAILED: 'bg-[var(--k-glass-thin)] text-[var(--k-text-secondary)]',
    TRANSFERRED: 'bg-purple-500/15 text-purple-400',
    RINGING: 'bg-yellow-500/15 text-yellow-400',
  };

  const statusLabelMap: Record<string, string> = {
    COMPLETED: 'statusCompleted',
    MISSED: 'statusMissed',
    VOICEMAIL: 'statusVoicemail',
    FAILED: 'statusFailed',
    RINGING: 'statusRinging',
    IN_PROGRESS: 'statusInProgress',
    TRANSFERRED: 'statusTransferred',
  };
  const statusLabel = (s: string) => t(`voip.admin.callLog.${statusLabelMap[s] ?? s}`);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--k-text-primary)]">{t('voip.callLog.title')}</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-[var(--k-glass-thin)] backdrop-blur-sm border border-[var(--k-border-subtle)] rounded-xl p-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--k-text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('voip.callLog.searchPlaceholder')}
              aria-label={t('voip.callLog.searchPlaceholder')}
              className="w-full ps-9 pe-3 py-2 border border-[var(--k-border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <select
          value={direction}
          onChange={(e) => { setDirection(e.target.value); setPage(1); }}
          aria-label={t('voip.callLog.allDirections')}
          className="px-3 py-2 border border-[var(--k-border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">{t('voip.callLog.allDirections')}</option>
          <option value="INBOUND">{t('voip.callLog.inbound')}</option>
          <option value="OUTBOUND">{t('voip.callLog.outbound')}</option>
          <option value="INTERNAL">{t('voip.callLog.internal')}</option>
        </select>

        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          aria-label={t('voip.callLog.allStatuses')}
          className="px-3 py-2 border border-[var(--k-border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">{t('voip.callLog.allStatuses')}</option>
          <option value="COMPLETED">{t('voip.status.call.completed')}</option>
          <option value="MISSED">{t('voip.status.call.missed')}</option>
          <option value="VOICEMAIL">{t('voip.status.call.voicemail')}</option>
          <option value="FAILED">{t('voip.status.call.failed')}</option>
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          aria-label="Date from"
          className="px-3 py-2 border border-[var(--k-border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          aria-label="Date to"
          className="px-3 py-2 border border-[var(--k-border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Table */}
      <div className="bg-[var(--k-glass-thin)] backdrop-blur-sm border border-[var(--k-border-subtle)] rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-[var(--k-text-muted)]">{t('common.loading')}...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--k-bg-surface)] text-[var(--k-text-tertiary)] text-xs uppercase tracking-wider">
                    <th className="px-4 py-2 text-start" />
                    <th className="px-4 py-2 text-start">{t('voip.callLog.caller')}</th>
                    <th className="px-4 py-2 text-start">{t('voip.callLog.called')}</th>
                    <th className="px-4 py-2 text-start">{t('voip.callLog.agent')}</th>
                    <th className="px-4 py-2 text-start">{t('voip.callLog.status')}</th>
                    <th className="px-4 py-2 text-start">{t('voip.callLog.duration')}</th>
                    <th className="px-4 py-2 text-start">{t('voip.callLog.date')}</th>
                    <th className="px-4 py-2 text-start">{t('voip.callLog.satisfaction')}</th>
                    <th className="px-4 py-2 text-start" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--k-border-subtle)]">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {data?.callLogs?.map((call: any) => (
                    <>
                      <tr
                        key={call.id}
                        className="hover:bg-[var(--k-bg-surface)] cursor-pointer"
                        onClick={() => setExpandedId(expandedId === call.id ? null : call.id)}
                      >
                        <td className="px-4 py-2.5">{directionIcon(call.direction)}</td>
                        <td className="px-4 py-2.5">
                          <div className="font-medium text-[var(--k-text-primary)]">{call.callerName || call.callerNumber}</div>
                          {call.client && <div className="text-xs text-[var(--k-text-tertiary)]">{call.client.name}</div>}
                        </td>
                        <td className="px-4 py-2.5 text-[var(--k-text-secondary)]">{call.calledNumber}</td>
                        <td className="px-4 py-2.5 text-[var(--k-text-secondary)]">
                          {call.agent ? `${call.agent.user?.name || ''} (${call.agent.extension})` : '-'}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[call.status] || 'bg-[var(--k-glass-thin)]'}`}>
                            {statusLabel(call.status)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-[var(--k-text-secondary)] tabular-nums">
                          {call.duration ? formatDuration(call.duration) : '-'}
                        </td>
                        <td className="px-4 py-2.5 text-[var(--k-text-tertiary)] text-xs">
                          {new Date(call.startedAt).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="px-4 py-2.5">
                          <SatisfactionBadge score={call.survey?.overallScore || null} />
                        </td>
                        <td className="px-4 py-2.5">
                          {call.recording && <FileText className="w-4 h-4 text-[var(--k-text-muted)]" />}
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {expandedId === call.id && (
                        <tr key={`${call.id}-detail`}>
                          <td colSpan={9} className="bg-[var(--k-bg-surface)] px-4 py-3">
                            <div className="flex flex-wrap gap-4 text-sm">
                              {call.recording?.id && (
                                <div className="flex-1 min-w-[250px]">
                                  <span className="text-xs font-medium text-[var(--k-text-tertiary)] block mb-1">
                                    {t('voip.callLog.recording')}
                                  </span>
                                  <AudioPlayer
                                    src={`/api/admin/voip/recordings/${call.recording.id}`}
                                    duration={call.recording.durationSec}
                                  />
                                </div>
                              )}
                              {call.transcription && (
                                <div className="flex-1 min-w-[200px]">
                                  <span className="text-xs font-medium text-[var(--k-text-tertiary)] block mb-1">
                                    {t('voip.callLog.transcription')}
                                  </span>
                                  <p className="text-[var(--k-text-secondary)]">{call.transcription.summary || '-'}</p>
                                  {call.transcription.sentiment && (
                                    <span className={`text-xs mt-1 inline-block px-2 py-0.5 rounded-full ${
                                      call.transcription.sentiment === 'positive' ? 'bg-emerald-500/15 text-emerald-400' :
                                      call.transcription.sentiment === 'negative' ? 'bg-red-500/15 text-red-400' :
                                      'bg-[var(--k-glass-thin)] text-[var(--k-text-secondary)]'
                                    }`}>
                                      {call.transcription.sentiment}
                                    </span>
                                  )}
                                </div>
                              )}
                              {call.agentNotes && (
                                <div className="flex-1 min-w-[200px]">
                                  <span className="text-xs font-medium text-[var(--k-text-tertiary)] block mb-1">Notes</span>
                                  <p className="text-[var(--k-text-secondary)]">{call.agentNotes}</p>
                                </div>
                              )}
                              {/* Bridge #8: Telephony → CRM Deals */}
                              {callBridgeData[call.id]?.crmDeals && callBridgeData[call.id].crmDeals!.length > 0 && (
                                <div className="flex-1 min-w-[200px]">
                                  <span className="text-xs font-medium text-[var(--k-text-tertiary)] block mb-1 flex items-center gap-1">
                                    <Briefcase className="w-3 h-3" />
                                    {t('admin.telephony.crmDeals')}
                                  </span>
                                  <div className="space-y-1">
                                    {callBridgeData[call.id].crmDeals!.map((deal) => (
                                      <Link
                                        key={deal.id}
                                        href={`/admin/crm/deals/${deal.id}`}
                                        className="flex items-center justify-between text-xs p-1.5 rounded bg-[var(--k-glass-thin)] backdrop-blur-sm hover:bg-[#6366f1]/10 border border-[var(--k-border-subtle)]"
                                      >
                                        <span className="text-[var(--k-text-primary)] truncate">{deal.title}</span>
                                        <span className="text-[var(--k-text-tertiary)] ms-2 shrink-0">{deal.stageName}</span>
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {/* Bridge #13: Telephony → Commerce (Recent Orders) */}
                              {callBridgeData[call.id]?.recentOrders && callBridgeData[call.id].recentOrders!.length > 0 && (
                                <div className="flex-1 min-w-[200px]">
                                  <span className="text-xs font-medium text-[var(--k-text-tertiary)] block mb-1 flex items-center gap-1">
                                    <ShoppingCart className="w-3 h-3" />
                                    {t('admin.bridges.recentOrders')}
                                  </span>
                                  <div className="space-y-1">
                                    {callBridgeData[call.id].recentOrders!.map((order) => (
                                      <Link
                                        key={order.id}
                                        href={`/admin/commandes?orderId=${order.id}`}
                                        className="flex items-center justify-between text-xs p-1.5 rounded bg-[var(--k-glass-thin)] backdrop-blur-sm hover:bg-[#6366f1]/10 border border-[var(--k-border-subtle)]"
                                      >
                                        <span className="text-[var(--k-text-primary)]">#{order.orderNumber}</span>
                                        <span className="text-[var(--k-text-tertiary)] ms-2 shrink-0">${order.total.toFixed(2)}</span>
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {/* Bridge #45: Telephony → Loyalty */}
                              {callBridgeData[call.id]?.loyaltyInfo && (
                                <div className="flex-1 min-w-[150px]">
                                  <span className="text-xs font-medium text-[var(--k-text-tertiary)] block mb-1 flex items-center gap-1">
                                    <Star className="w-3 h-3" />
                                    {t('admin.bridges.loyaltyInfo')}
                                  </span>
                                  <div className="text-xs p-1.5 rounded bg-[var(--k-glass-thin)] backdrop-blur-sm border border-[var(--k-border-subtle)]">
                                    <span className="text-purple-700 font-medium">{callBridgeData[call.id].loyaltyInfo!.currentTier}</span>
                                    <span className="text-[var(--k-text-tertiary)] ms-2">{callBridgeData[call.id].loyaltyInfo!.currentPoints.toLocaleString()} pts</span>
                                  </div>
                                </div>
                              )}
                              {/* Bridge #46: Telephony → Email */}
                              {callBridgeData[call.id]?.recentEmails && callBridgeData[call.id].recentEmails!.length > 0 && (
                                <div className="flex-1 min-w-[200px]">
                                  <span className="text-xs font-medium text-[var(--k-text-tertiary)] block mb-1 flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {t('admin.bridges.recentEmails')}
                                  </span>
                                  <div className="space-y-1">
                                    {callBridgeData[call.id].recentEmails!.slice(0, 3).map((email) => (
                                      <div
                                        key={email.id}
                                        className="text-xs p-1.5 rounded bg-[var(--k-glass-thin)] backdrop-blur-sm border border-[var(--k-border-subtle)]"
                                      >
                                        <p className="text-[var(--k-text-secondary)] truncate">{email.subject}</p>
                                        <span className={`px-1 py-0.5 rounded text-[10px] ${
                                          email.status === 'delivered' ? 'bg-green-500/15 text-green-400' : 'bg-[var(--k-glass-thin)] text-[var(--k-text-secondary)]'
                                        }`}>{email.status}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data?.pagination && (
              <div className="px-4 py-3 border-t border-[var(--k-border-subtle)] flex items-center justify-between text-sm text-[var(--k-text-tertiary)]">
                <span>
                  {t('voip.callLog.showing')} {((page - 1) * 25) + 1}-{Math.min(page * 25, data.pagination.total)} / {data.pagination.total}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="p-1 rounded hover:bg-[var(--k-glass-thin)] disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span>{page} / {data.pagination.totalPages}</span>
                  <button
                    onClick={() => setPage(Math.min(data.pagination.totalPages, page + 1))}
                    disabled={page >= data.pagination.totalPages}
                    className="p-1 rounded hover:bg-[var(--k-glass-thin)] disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
