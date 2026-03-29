'use client';

/**
 * VoIP Dashboard Client Component
 * Enhanced: KPI stat cards, connection status, quick actions, recent calls, active extensions.
 */

import { useI18n } from '@/i18n/client';
import { PageHeader, StatCard, SectionCard, Button, EmptyState } from '@/components/admin';
import { formatDuration } from '@/hooks/useCallState';
import {
  Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed,
  Clock, MessageSquare, ArrowRight, CheckCircle, XCircle,
  Wifi, WifiOff, Headphones, Send, FileText, Users,
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

  // Determine connection status
  const telnyxConn = data.connections?.find((c: { provider: string }) => c.provider === 'telnyx');
  const isConnected = telnyxConn?.isEnabled ?? false;

  return (
    <div className="space-y-6" role="main" aria-label={t('voip.dashboard.title')}>
      <PageHeader
        title={t('voip.dashboard.title')}
        subtitle={t('voip.dashboard.subtitle')}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--k-glass-thin)] border border-[var(--k-border-subtle)]">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-emerald-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
              <span className="text-sm text-[var(--k-text-secondary)]">
                Telnyx: {isConnected ? 'Connect\u00e9' : 'D\u00e9connect\u00e9'}
              </span>
            </div>
          </div>
        }
      />

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Appels aujourd'hui"
          value={data.today.calls}
          icon={Phone}
        />
        <StatCard
          label="Appels manqu\u00e9s"
          value={data.today.missed}
          icon={PhoneMissed}
        />
        <StatCard
          label="Dur\u00e9e moyenne"
          value={formatDuration(data.today.avgDuration)}
          icon={Clock}
        />
        <StatCard
          label="Messages SMS"
          value={data.smsCount ?? 0}
          icon={MessageSquare}
        />
      </div>

      {/* Quick Actions */}
      <SectionCard title="Actions rapides">
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/telephonie/journal">
            <Button variant="outline" icon={FileText}>
              Voir le journal
            </Button>
          </Link>
          <Link href="/admin/telephonie/extensions">
            <Button variant="outline" icon={Headphones}>
              Extensions
            </Button>
          </Link>
          <Link href="/admin/telephonie/numeros">
            <Button variant="outline" icon={Phone}>
              Num\u00e9ros
            </Button>
          </Link>
          <Link href="/admin/telephonie/messages">
            <Button variant="outline" icon={Send}>
              Envoyer un SMS
            </Button>
          </Link>
        </div>
      </SectionCard>

      {/* Connection Status */}
      {data.connections && data.connections.length > 0 && (
        <SectionCard title={t('voip.dashboard.connections')}>
          <div className="flex flex-wrap gap-3">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {data.connections.map((conn: any) => (
              <div key={conn.id} className="flex items-center gap-2 px-3 py-2 bg-[var(--k-bg-surface)] rounded-lg text-sm border border-[var(--k-border-subtle)]">
                {conn.isEnabled ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-[var(--k-text-muted)]" />
                )}
                <span className="font-medium capitalize text-[var(--k-text-primary)]">{conn.provider}</span>
                {conn.syncStatus && (
                  <span className="text-xs text-[var(--k-text-muted)]">{conn.syncStatus}</span>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Active Extensions */}
      <SectionCard
        title="Extensions actives"
        headerAction={
          <Link href="/admin/telephonie/extensions" className="text-sm text-[#818cf8] hover:underline flex items-center gap-1">
            Tout voir <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        <div className="flex flex-wrap gap-3">
          {data.activeAgents > 0 ? (
            <div className="flex items-center gap-2 text-sm text-[var(--k-text-secondary)]">
              <Users className="w-4 h-4 text-emerald-500" />
              <span className="font-medium text-[var(--k-text-primary)]">{data.activeAgents}</span>
              {data.activeAgents === 1 ? 'agent en ligne' : 'agents en ligne'}
            </div>
          ) : (
            <p className="text-sm text-[var(--k-text-muted)]">Aucun agent en ligne</p>
          )}
        </div>
      </SectionCard>

      {/* Recent Calls */}
      <SectionCard
        title={t('voip.dashboard.recentCalls')}
        noPadding
        headerAction={
          <Link
            href="/admin/telephonie/journal"
            className="text-sm text-[#818cf8] hover:underline flex items-center gap-1"
          >
            {t('voip.dashboard.viewAll')} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
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
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--k-border-subtle)]">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {data.recentCalls.map((call: any) => (
                <tr key={call.id} className="hover:bg-[var(--k-bg-surface)] transition-colors">
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
                </tr>
              ))}
              {data.recentCalls.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <EmptyState
                      icon={Phone}
                      title={t('voip.dashboard.noCalls')}
                      description="Aucun appel enregistr\u00e9 aujourd'hui"
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
