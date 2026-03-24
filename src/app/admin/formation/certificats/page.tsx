'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { PageHeader, DataTable, StatusBadge, EmptyState, type Column } from '@/components/admin';
import { Award } from 'lucide-react';

interface CertificateRow {
  id: string;
  studentName: string;
  courseTitle: string;
  verificationCode: string;
  status: string;
  issuedAt: string;
  expiresAt: string | null;
}

const statusVariants: Record<string, 'success' | 'error' | 'warning' | 'neutral'> = {
  ISSUED: 'success',
  REVOKED: 'error',
  EXPIRED: 'warning',
};

export default function CertificatesPage() {
  const { t } = useTranslations();

  const [certificates, setCertificates] = useState<CertificateRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/lms/certificates?page=1&limit=50');
      const data = await res.json();
      const list = data.data?.certificates ?? data.certificates ?? [];
      setCertificates(list);
      setTotal(data.data?.total ?? data.total ?? 0);
    } catch {
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCertificates(); }, [fetchCertificates]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString();
  };

  const columns: Column<CertificateRow>[] = [
    {
      key: 'studentName',
      header: t('admin.lms.studentName'),
      render: (row) => <span className="font-medium text-slate-900">{row.studentName}</span>,
    },
    {
      key: 'courseTitle',
      header: t('admin.lms.courseName'),
      render: (row) => row.courseTitle,
    },
    {
      key: 'verificationCode',
      header: t('admin.lms.verificationCode'),
      render: (row) => (
        <code className="text-xs bg-slate-100 px-2 py-0.5 rounded font-mono">
          {row.verificationCode.slice(0, 8)}...
        </code>
      ),
    },
    {
      key: 'issuedAt',
      header: t('admin.lms.issuedAt'),
      render: (row) => formatDate(row.issuedAt),
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (row) => (
        <StatusBadge variant={statusVariants[row.status] ?? 'neutral'}>
          {t(`admin.lms.certificateStatus.${row.status.toLowerCase()}`) || row.status}
        </StatusBadge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('admin.lms.certificatesTitle')}
        subtitle={`${total} ${t('admin.lms.certificatesTotal')}`}
        backHref="/admin/formation"
      />

      {!loading && certificates.length === 0 ? (
        <EmptyState
          icon={Award}
          title={t('admin.lms.noCertificates')}
          description={t('admin.lms.noCertificatesDesc')}
        />
      ) : (
        <DataTable
          columns={columns}
          data={certificates}
          keyExtractor={(c) => c.id}
          loading={loading}
          emptyTitle={t('admin.lms.noCertificates')}
        />
      )}
    </div>
  );
}
