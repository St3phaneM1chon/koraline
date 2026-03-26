'use client';

import { useState, useEffect } from 'react';
import { Users, Calendar, UserCheck } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';

interface CohortData {
  cohorts: Array<{
    id: string;
    name: string;
    description: string | null;
    startsAt: string;
    endsAt: string | null;
    isActive: boolean;
    memberCount: number;
    myRole: string;
  }>;
  activeCohort: {
    id: string;
    name: string;
    peers: Array<{ name: string; role: string; joinedAt: string }>;
    memberCount: number;
  } | null;
}

export default function CohortePage() {
  const { t } = useTranslations();
  const [data, setData] = useState<CohortData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/lms/cohort')
      .then(r => r.json())
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center py-12 text-muted-foreground">{t('lms.cohort.loading') || 'Chargement...'}</div>
      </div>
    );
  }

  const hasActiveCohort = data?.activeCohort;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
        <Users className="h-8 w-8 text-indigo-500" /> {t('lms.cohort.title')}
      </h1>
      <p className="text-muted-foreground mb-8">{t('lms.cohort.subtitle')}</p>

      {!hasActiveCohort ? (
        <div className="text-center py-12 rounded-xl border">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">{t('lms.cohort.noCohort')}</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {t('lms.cohort.noCohortDescription')}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active cohort info */}
          <div className="rounded-xl border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{data.activeCohort!.name}</h2>
              <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                {data.activeCohort!.memberCount} {t('lms.cohort.members') || 'membres'}
              </span>
            </div>

            {/* Peers list */}
            {data.activeCohort!.peers.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">{t('lms.cohort.peers') || 'Vos collegues'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {data.activeCohort!.peers.map((peer, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{peer.name}</span>
                      {peer.role !== 'student' && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{peer.role}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* All cohorts */}
          {data?.cohorts && data.cohorts.length > 1 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">{t('lms.cohort.allCohorts') || 'Toutes vos cohortes'}</h3>
              <div className="space-y-2">
                {data.cohorts.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <span className="font-medium">{c.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">({c.myRole})</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(c.startsAt).toLocaleDateString('fr-CA')}</span>
                      <span>{c.memberCount} {t('lms.cohort.members') || 'membres'}</span>
                      {!c.isActive && <span className="bg-gray-100 px-2 py-0.5 rounded">{t('lms.cohort.ended') || 'Terminee'}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
