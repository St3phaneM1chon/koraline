'use client';

/**
 * CallLogClient - Interactive call log table with filters, search, pagination.
 * Uses admin design system components. French labels.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { useI18n } from '@/i18n/client';
import { PageHeader, SectionCard, EmptyState } from '@/components/admin';
import { formatDuration } from '@/hooks/useCallState';
import SatisfactionBadge from '@/components/voip/SatisfactionBadge';
import AudioPlayer from '@/components/voip/AudioPlayer';
import {
  Phone, PhoneIncoming, PhoneOutgoing, Search,
  ChevronLeft, ChevronRight, FileText, Briefcase, ShoppingCart,
  Star, Mail,
} from 'lucide-react';
import Link from 'next/link';

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

  // Bridge data for expanded call details
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
    COMPLETED: 'Compl\u00e9t\u00e9',
    MISSED: 'Manqu\u00e9',
    VOICEMAIL: 'Messagerie vocale',
    FAILED: '\u00c9chou\u00e9',
    RINGING: 'En sonnerie',
    IN_PROGRESS: 'En cours',
    TRANSFERRED: 'Transf\u00e9r\u00e9',
  };

  const statusLabel = (s: string) => statusLabelMap[s] ?? s;

  const inputStyles = 'px-3 py-2 bg-[var(--k-bg-surface)] border border-[var(--k-border-default)] rounded-lg text-sm text-[var(--k-text-primary)] placeholder:text-[var(--k-text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="space-y-4">
      <PageHeader
        title="Journal des appels"
        subtitle="Historique complet de tous les appels entrants, sortants et internes"
        backHref="/admin/telephonie"
        backLabel="T\u00e9l\u00e9phonie"
      />

      {/* Filters */}
      <SectionCard>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--k-text-muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Rechercher un num\u00e9ro..."
                aria-label="Rechercher un num\u00e9ro"
                className={`${inputStyles} w-full ps-9`}
              />
            </div>
          </div>

          <select
            value={direction}
            onChange={(e) => { setDirection(e.target.value); setPage(1); }}
            aria-label="Filtrer par direction"
            className={inputStyles}
          >
            <option value="">Toutes les directions</option>
            <option value="INBOUND">Entrant</option>
            <option value="OUTBOUND">Sortant</option>
            <option value="INTERNAL">Interne</option>
          </select>

          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            aria-label="Filtrer par statut"
            className={inputStyles}
          >
            <option value="">Tous les statuts</option>
            <option value="COMPLETED">Compl\u00e9t\u00e9</option>
            <option value="MISSED">Manqu\u00e9</option>
            <option value="VOICEMAIL">Messagerie vocale</option>
            <option value="FAILED">\u00c9chou\u00e9</option>
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            aria-label="Date de d\u00e9but"
            className={inputStyles}
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            aria-label="Date de fin"
            className={inputStyles}
          />
        </div>
      </SectionCard>

      {/* Table */}
      <SectionCard noPadding>
        {isLoading ? (
          <div className="p-8 text-center text-[var(--k-text-muted)]">{t('common.loading')}...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Journal des appels">
                <thead>
                  <tr className="bg-[var(--k-bg-surface)] text-[var(--k-text-tertiary)] text-xs uppercase tracking-wider">
                    <th className="px-4 py-2 text-start" />
                    <th className="px-4 py-2 text-start">De</th>
                    <th className="px-4 py-2 text-start">Vers</th>
                    <th className="px-4 py-2 text-start">Agent</th>
                    <th className="px-4 py-2 text-start">Statut</th>
                    <th className="px-4 py-2 text-start">Dur\u00e9e</th>
                    <th className="px-4 py-2 text-start">Date</th>
                    <th className="px-4 py-2 text-start">Satisfaction</th>
                    <th className="px-4 py-2 text-start" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--k-border-subtle)]">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {data?.callLogs?.map((call: any) => (
                    <CallLogRow
                      key={call.id}
                      call={call}
                      isExpanded={expandedId === call.id}
                      onToggle={() => setExpandedId(expandedId === call.id ? null : call.id)}
                      directionIcon={directionIcon}
                      statusColors={statusColors}
                      statusLabel={statusLabel}
                      bridgeData={callBridgeData[call.id]}
                      t={t}
                    />
                  ))}
                  {(!data?.callLogs || data.callLogs.length === 0) && (
                    <tr>
                      <td colSpan={9} className="px-4 py-8">
                        <EmptyState
                          icon={Phone}
                          title="Aucun appel trouv\u00e9"
                          description="Modifiez vos filtres ou attendez de nouveaux appels."
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data?.pagination && data.pagination.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-[var(--k-border-subtle)] flex items-center justify-between text-sm text-[var(--k-text-tertiary)]">
                <span>
                  {((page - 1) * 25) + 1}-{Math.min(page * 25, data.pagination.total)} sur {data.pagination.total}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    aria-label="Page pr\u00e9c\u00e9dente"
                    className="p-1 rounded hover:bg-[var(--k-glass-thin)] disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[var(--k-text-primary)]">{page} / {data.pagination.totalPages}</span>
                  <button
                    onClick={() => setPage(Math.min(data.pagination.totalPages, page + 1))}
                    disabled={page >= data.pagination.totalPages}
                    aria-label="Page suivante"
                    className="p-1 rounded hover:bg-[var(--k-glass-thin)] disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </SectionCard>
    </div>
  );
}

/* Extracted row component to keep JSX key usage clean */
function CallLogRow({
  call,
  isExpanded,
  onToggle,
  directionIcon,
  statusColors,
  statusLabel,
  bridgeData,
  t,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  call: any;
  isExpanded: boolean;
  onToggle: () => void;
  directionIcon: (d: string) => React.ReactNode;
  statusColors: Record<string, string>;
  statusLabel: (s: string) => string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bridgeData?: any;
  t: (key: string) => string;
}) {
  return (
    <>
      <tr
        className="hover:bg-[var(--k-bg-surface)] cursor-pointer transition-colors"
        onClick={onToggle}
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
      {isExpanded && (
        <tr>
          <td colSpan={9} className="bg-[var(--k-bg-surface)] px-4 py-3">
            <div className="flex flex-wrap gap-4 text-sm">
              {call.recording?.id && (
                <div className="flex-1 min-w-[250px]">
                  <span className="text-xs font-medium text-[var(--k-text-tertiary)] block mb-1">
                    Enregistrement
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
                    Transcription
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
                  <span className="text-xs font-medium text-[var(--k-text-tertiary)] block mb-1">Notes de l&apos;agent</span>
                  <p className="text-[var(--k-text-secondary)]">{call.agentNotes}</p>
                </div>
              )}
              {/* Bridge: CRM Deals */}
              {bridgeData?.crmDeals && bridgeData.crmDeals.length > 0 && (
                <div className="flex-1 min-w-[200px]">
                  <span className="text-xs font-medium text-[var(--k-text-tertiary)] block mb-1 flex items-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    {t('admin.telephony.crmDeals')}
                  </span>
                  <div className="space-y-1">
                    {bridgeData.crmDeals.map((deal: { id: string; title: string; stageName: string }) => (
                      <Link
                        key={deal.id}
                        href={`/admin/crm/deals/${deal.id}`}
                        className="flex items-center justify-between text-xs p-1.5 rounded bg-[var(--k-glass-thin)] hover:bg-[#6366f1]/10 border border-[var(--k-border-subtle)]"
                      >
                        <span className="text-[var(--k-text-primary)] truncate">{deal.title}</span>
                        <span className="text-[var(--k-text-tertiary)] ms-2 shrink-0">{deal.stageName}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {/* Bridge: Recent Orders */}
              {bridgeData?.recentOrders && bridgeData.recentOrders.length > 0 && (
                <div className="flex-1 min-w-[200px]">
                  <span className="text-xs font-medium text-[var(--k-text-tertiary)] block mb-1 flex items-center gap-1">
                    <ShoppingCart className="w-3 h-3" />
                    Commandes r\u00e9centes
                  </span>
                  <div className="space-y-1">
                    {bridgeData.recentOrders.map((order: { id: string; orderNumber: string; total: number }) => (
                      <Link
                        key={order.id}
                        href={`/admin/commandes?orderId=${order.id}`}
                        className="flex items-center justify-between text-xs p-1.5 rounded bg-[var(--k-glass-thin)] hover:bg-[#6366f1]/10 border border-[var(--k-border-subtle)]"
                      >
                        <span className="text-[var(--k-text-primary)]">#{order.orderNumber}</span>
                        <span className="text-[var(--k-text-tertiary)] ms-2 shrink-0">${order.total.toFixed(2)}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {/* Bridge: Loyalty */}
              {bridgeData?.loyaltyInfo && (
                <div className="flex-1 min-w-[150px]">
                  <span className="text-xs font-medium text-[var(--k-text-tertiary)] block mb-1 flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Fid\u00e9lit\u00e9
                  </span>
                  <div className="text-xs p-1.5 rounded bg-[var(--k-glass-thin)] border border-[var(--k-border-subtle)]">
                    <span className="text-purple-400 font-medium">{bridgeData.loyaltyInfo.currentTier}</span>
                    <span className="text-[var(--k-text-tertiary)] ms-2">{bridgeData.loyaltyInfo.currentPoints.toLocaleString()} pts</span>
                  </div>
                </div>
              )}
              {/* Bridge: Email */}
              {bridgeData?.recentEmails && bridgeData.recentEmails.length > 0 && (
                <div className="flex-1 min-w-[200px]">
                  <span className="text-xs font-medium text-[var(--k-text-tertiary)] block mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    Courriels r\u00e9cents
                  </span>
                  <div className="space-y-1">
                    {bridgeData.recentEmails.slice(0, 3).map((email: { id: string; subject: string; status: string }) => (
                      <div
                        key={email.id}
                        className="text-xs p-1.5 rounded bg-[var(--k-glass-thin)] border border-[var(--k-border-subtle)]"
                      >
                        <p className="text-[var(--k-text-secondary)] truncate">{email.subject}</p>
                        <span className={`px-1 py-0.5 rounded text-[10px] ${
                          email.status === 'delivered' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-[var(--k-glass-thin)] text-[var(--k-text-secondary)]'
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
  );
}
