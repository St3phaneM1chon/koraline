'use client';

/**
 * VoIP Dashboard Client Component
 * Renders KPI cards, recent calls table, and connection status.
 */

import { useI18n } from '@/i18n/client';
import CallStats from '@/components/voip/CallStats';
import SatisfactionBadge from '@/components/voip/SatisfactionBadge';
import { formatDuration } from '@/hooks/useCallState';
import {
  Phone, PhoneIncoming, PhoneOutgoing,
  ArrowRight, CheckCircle, XCircle,
} from 'lucide-react';
import Link from 'next/link';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function VoipDashboardClient({ data }: { data: any }) {
  const { t, locale } = useI18n();

  const directionIcon = (dir: string) => {
    switch (dir) {
      case 'INBOUND': return <PhoneIncoming className="w-4 h-4 text-[#818cf8]" />;
      case 'OUTBOUND': return <PhoneOutgoing className="w-4 h-4 text-emerald-600" />;
      default: return <Phone className="w-4 h-4 text-[var(--k-text-muted)]" />;
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      COMPLETED: 'bg-emerald-500/15 text-emerald-400',
      MISSED: 'bg-red-500/15 text-red-400',
      VOICEMAIL: 'bg-orange-500/15 text-orange-400',
      IN_PROGRESS: 'bg-[#6366f1]/15 text-[#818cf8]',
      FAILED: 'bg-[var(--k-glass-thin)] text-[var(--k-text-secondary)]',
      TRANSFERRED: 'bg-purple-500/15 text-purple-400',
      RINGING: 'bg-yellow-500/15 text-yellow-400',
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors[status] || 'bg-[var(--k-glass-thin)] text-[var(--k-text-secondary)]'}`}>
        {t(`voip.status.call.${status.toLowerCase()}`)}
      </span>
    );
  };

  return (
    <div className="space-y-6" role="main" aria-label={t('voip.dashboard.title')}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--k-text-primary)]">{t('voip.dashboard.title')}</h1>
          <p className="text-sm text-[var(--k-text-tertiary)] mt-1">{t('voip.dashboard.subtitle')}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <CallStats
        today={data.today}
        satisfaction={data.satisfaction}
        activeAgents={data.activeAgents}
        unreadVoicemails={data.unreadVoicemails}
      />

      {/* Connections Status */}
      {data.connections.length > 0 && (
        <div className="bg-[var(--k-glass-thin)] backdrop-blur-sm border border-[var(--k-border-subtle)] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-[var(--k-text-secondary)] mb-3">{t('voip.dashboard.connections')}</h3>
          <div className="flex flex-wrap gap-3">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {data.connections.map((conn: any) => (
              <div key={conn.id} className="flex items-center gap-2 px-3 py-1.5 bg-[var(--k-bg-surface)] rounded-lg text-sm">
                {conn.isEnabled ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-[var(--k-text-muted)]" />
                )}
                <span className="font-medium capitalize">{conn.provider}</span>
                {conn.syncStatus && (
                  <span className="text-xs text-[var(--k-text-muted)]">{conn.syncStatus}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Calls */}
      <div className="bg-[var(--k-glass-thin)] backdrop-blur-sm border border-[var(--k-border-subtle)] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--k-border-subtle)] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--k-text-secondary)]">{t('voip.dashboard.recentCalls')}</h3>
          <Link
            href="/admin/telephonie/journal"
            className="text-sm text-[#818cf8] hover:text-[#818cf8] flex items-center gap-1"
          >
            {t('voip.dashboard.viewAll')} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label={t('voip.dashboard.recentCalls')}>
            <thead>
              <tr className="bg-[var(--k-bg-surface)] text-[var(--k-text-tertiary)] text-xs uppercase tracking-wider">
                <th className="px-4 py-2 text-start">{t('voip.callLog.direction')}</th>
                <th className="px-4 py-2 text-start">{t('voip.callLog.caller')}</th>
                <th className="px-4 py-2 text-start hidden sm:table-cell">{t('voip.callLog.called')}</th>
                <th className="px-4 py-2 text-start hidden md:table-cell">{t('voip.callLog.agent')}</th>
                <th className="px-4 py-2 text-start">{t('voip.callLog.status')}</th>
                <th className="px-4 py-2 text-start hidden sm:table-cell">{t('voip.callLog.duration')}</th>
                <th className="px-4 py-2 text-start hidden lg:table-cell">{t('voip.callLog.date')}</th>
                <th className="px-4 py-2 text-start hidden lg:table-cell">{t('voip.callLog.satisfaction')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--k-border-subtle)]">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {data.recentCalls.map((call: any) => (
                <tr key={call.id} className="hover:bg-[var(--k-bg-surface)]">
                  <td className="px-4 py-2.5">{directionIcon(call.direction)}</td>
                  <td className="px-4 py-2.5 max-w-[180px]">
                    <div className="font-medium text-[var(--k-text-primary)] truncate">{call.callerName || call.callerNumber}</div>
                    {call.client && (
                      <div className="text-xs text-[var(--k-text-tertiary)] truncate">{call.client.name || call.client.email}</div>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-[var(--k-text-secondary)] hidden sm:table-cell truncate max-w-[140px]">{call.calledNumber}</td>
                  <td className="px-4 py-2.5 text-[var(--k-text-secondary)] hidden md:table-cell truncate max-w-[140px]">
                    {call.agent ? `${call.agent.user?.name || ''} (${call.agent.extension})` : '-'}
                  </td>
                  <td className="px-4 py-2.5">{statusBadge(call.status)}</td>
                  <td className="px-4 py-2.5 text-[var(--k-text-secondary)] tabular-nums hidden sm:table-cell">
                    {call.duration ? formatDuration(call.duration) : '-'}
                  </td>
                  <td className="px-4 py-2.5 text-[var(--k-text-tertiary)] text-xs hidden lg:table-cell">
                    {new Date(call.startedAt).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-4 py-2.5 hidden lg:table-cell">
                    <SatisfactionBadge score={call.survey?.overallScore || null} />
                  </td>
                </tr>
              ))}
              {data.recentCalls.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[var(--k-text-muted)]">
                    {t('voip.dashboard.noCalls')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
