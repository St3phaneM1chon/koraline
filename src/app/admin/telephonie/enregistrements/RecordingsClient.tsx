'use client';

/**
 * RecordingsClient - Unified content dashboard with tabs: Audio, Video, Chat
 * Searches across recordings, transcriptions, and chat conversations.
 * Uses admin design system. French labels. Dark mode support.
 */

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/i18n/client';
import { PageHeader, SectionCard, Button, EmptyState } from '@/components/admin';
import AudioPlayer from '@/components/voip/AudioPlayer';
import {
  PhoneIncoming,
  PhoneOutgoing,
  Phone,
  Video,
  MessageCircle,
  Search,
  Download,
  FileText,
  Calendar,
  Filter,
  Mic,
} from 'lucide-react';
import { toast } from 'sonner';

type ContentType = 'all' | 'audio' | 'video' | 'chat';

interface ContentItem {
  id: string;
  type: 'audio' | 'video' | 'chat';
  title: string;
  description: string | null;
  date: string;
  duration: number | null;
  url: string | null;
  sentiment: string | null;
  metadata: Record<string, unknown>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function RecordingsClient({ recordings: initialRecordings }: { recordings: any[] }) {
  const { locale } = useI18n();
  const [activeTab, setActiveTab] = useState<ContentType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<ContentItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Convert initial recordings to ContentItem format
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const initialItems: ContentItem[] = initialRecordings.map((rec: any) => ({
    id: rec.id,
    type: rec.isVideo ? 'video' : 'audio',
    title: `${rec.callLog?.callerName || rec.callLog?.callerNumber || 'Inconnu'} \u2192 ${rec.callLog?.calledNumber || 'Inconnu'}`,
    description: rec.transcription?.summary || null,
    date: rec.createdAt,
    duration: rec.durationSec,
    url: rec.blobUrl,
    sentiment: rec.transcription?.sentiment || null,
    metadata: {
      format: rec.format,
      direction: rec.callLog?.direction,
      agent: rec.callLog?.agent?.user?.name || rec.callLog?.agent?.extension,
      client: rec.callLog?.client?.name,
      callLogId: rec.callLogId,
      isVideo: rec.isVideo,
    },
  }));

  const displayItems = hasSearched ? results : initialItems;

  const search = useCallback(async () => {
    setIsSearching(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (activeTab !== 'all') params.set('type', activeTab);
      params.set('limit', '50');

      const res = await fetch(`/api/admin/content/recordings?${params}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      toast.error('Erreur lors de la recherche');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, activeTab]);

  // Search when tab changes
  useEffect(() => {
    if (hasSearched || activeTab !== 'all') {
      search();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search();
  };

  const exportChat = (conversationId: string, format: 'csv' | 'json') => {
    window.open(`/api/admin/chat/export?conversationId=${conversationId}&format=${format}`, '_blank');
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const tabs: Array<{ key: ContentType; label: string; icon: typeof Phone }> = [
    { key: 'all', label: 'Tout', icon: Filter },
    { key: 'audio', label: 'Audio', icon: Phone },
    { key: 'video', label: 'Vid\u00e9o', icon: Video },
    { key: 'chat', label: 'Clavardage', icon: MessageCircle },
  ];

  // Filter display items by active tab when not using API search
  const filteredItems = !hasSearched && activeTab !== 'all'
    ? displayItems.filter((item) => item.type === activeTab)
    : displayItems;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enregistrements"
        subtitle="Consultez et recherchez les enregistrements d'appels, vid\u00e9os et clavardages"
        backHref="/admin/telephonie"
        backLabel="T\u00e9l\u00e9phonie"
      />

      {/* Search + Tabs */}
      <SectionCard>
        <form onSubmit={handleSearch} className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--k-text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher dans les enregistrements..."
              aria-label="Rechercher dans les enregistrements"
              className="w-full ps-9 pe-3 py-2 bg-[var(--k-bg-surface)] border border-[var(--k-border-default)] rounded-lg text-sm text-[var(--k-text-primary)] placeholder:text-[var(--k-text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <Button type="submit" variant="primary" loading={isSearching}>
            Rechercher
          </Button>
        </form>

        {/* Tabs */}
        <div className="flex gap-1 bg-[var(--k-glass-thin)] p-1 rounded-lg w-fit">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'bg-[#6366f1]/20 text-[#818cf8] shadow-sm'
                  : 'text-[var(--k-text-secondary)] hover:text-[var(--k-text-primary)] hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Results */}
      {filteredItems.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={Mic}
            title={isSearching ? 'Recherche en cours...' : 'Aucun enregistrement'}
            description={hasSearched ? 'Modifiez vos crit\u00e8res de recherche.' : 'Les enregistrements d\u2019appels appara\u00eetront ici.'}
          />
        </SectionCard>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <SectionCard key={`${item.type}-${item.id}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {/* Type icon */}
                  {item.type === 'audio' && (
                    item.metadata.direction === 'INBOUND' ? (
                      <PhoneIncoming className="w-4 h-4 text-[#818cf8]" />
                    ) : item.metadata.direction === 'OUTBOUND' ? (
                      <PhoneOutgoing className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Phone className="w-4 h-4 text-[var(--k-text-muted)]" />
                    )
                  )}
                  {item.type === 'video' && <Video className="w-4 h-4 text-purple-400" />}
                  {item.type === 'chat' && <MessageCircle className="w-4 h-4 text-[#818cf8]" />}

                  {/* Type badge */}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    item.type === 'audio' ? 'bg-[var(--k-glass-thin)] text-[var(--k-text-secondary)]' :
                    item.type === 'video' ? 'bg-purple-500/15 text-purple-400' :
                    'bg-[#6366f1]/15 text-[#818cf8]'
                  }`}>
                    {item.type === 'audio' ? 'Audio' : item.type === 'video' ? 'Vid\u00e9o' : 'Chat'}
                  </span>

                  <span className="font-medium text-[var(--k-text-primary)]">{item.title}</span>
                </div>

                <div className="flex items-center gap-3">
                  {item.duration != null && (
                    <span className="text-xs text-[var(--k-text-muted)] tabular-nums">{formatDuration(item.duration)}</span>
                  )}
                  {item.metadata.messageCount ? (
                    <span className="text-xs text-[var(--k-text-muted)]">
                      {String(item.metadata.messageCount)} msgs
                    </span>
                  ) : null}
                  <span className="flex items-center gap-1 text-xs text-[var(--k-text-tertiary)]">
                    <Calendar className="w-3 h-3" />
                    {formatDate(item.date)}
                  </span>
                </div>
              </div>

              {/* Metadata */}
              {item.metadata.agent ? (
                <div className="text-xs text-[var(--k-text-muted)] mb-2">
                  Agent : {String(item.metadata.agent)}
                  {item.metadata.client ? ` | Client : ${String(item.metadata.client)}` : null}
                </div>
              ) : null}

              {/* Audio/Video player */}
              {(item.type === 'audio' || item.type === 'video') && item.url && (
                <div className="mb-2">
                  {item.type === 'video' ? (
                    <video
                      src={item.url}
                      controls
                      className="w-full max-h-48 rounded-lg bg-black"
                      preload="metadata"
                    />
                  ) : (
                    <AudioPlayer
                      src={`/api/admin/voip/recordings/${item.id}`}
                      duration={item.duration ?? undefined}
                      filename={`enregistrement-${item.id}.${item.metadata.format || 'wav'}`}
                    />
                  )}
                </div>
              )}

              {/* Description / Summary */}
              {item.description && (
                <div className="p-2 bg-[var(--k-bg-surface)] rounded-lg text-sm text-[var(--k-text-secondary)]">
                  <span className="text-xs font-medium text-[var(--k-text-tertiary)]">
                    {item.type === 'chat' ? 'Dernier message' : 'R\u00e9sum\u00e9'} :{' '}
                  </span>
                  {item.description}
                  {item.sentiment && (
                    <span className={`ms-2 text-xs px-1.5 py-0.5 rounded-full ${
                      item.sentiment === 'positive' ? 'bg-emerald-500/15 text-emerald-400' :
                      item.sentiment === 'negative' ? 'bg-red-500/15 text-red-400' :
                      'bg-[var(--k-glass-thin)] text-[var(--k-text-secondary)]'
                    }`}>
                      {item.sentiment === 'positive' ? 'Positif' : item.sentiment === 'negative' ? 'N\u00e9gatif' : 'Neutre'}
                    </span>
                  )}
                </div>
              )}

              {/* Chat export actions */}
              {item.type === 'chat' && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => exportChat(item.id, 'csv')}
                    className="flex items-center gap-1 text-xs text-[var(--k-text-muted)] hover:text-[var(--k-text-secondary)] transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    CSV
                  </button>
                  <button
                    onClick={() => exportChat(item.id, 'json')}
                    className="flex items-center gap-1 text-xs text-[var(--k-text-muted)] hover:text-[var(--k-text-secondary)] transition-colors"
                  >
                    <FileText className="w-3 h-3" />
                    JSON
                  </button>
                </div>
              )}
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}
