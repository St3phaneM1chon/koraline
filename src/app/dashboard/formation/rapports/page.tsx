'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Download, FileText } from 'lucide-react';

export default function CorporateReportsPage() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: 'csv' | 'pdf') => {
    setExporting(true);
    try {
      const res = await fetch(`/api/lms/corporate/reports?format=${format}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport-formation-${new Date().toISOString().slice(0, 10)}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch { /* handled */ }
    finally { setExporting(false); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Rapports</h1>
          <p className="text-muted-foreground">Exportez les donnees de formation de votre equipe</p>
        </div>
        <Link href="/dashboard/formation" className="text-sm text-muted-foreground hover:underline">Retour au dashboard</Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border p-6">
          <FileText className="h-8 w-8 text-primary mb-3" />
          <h2 className="font-semibold mb-2">Rapport de progression</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Exportez la liste complete de vos employes avec leur progression, scores et statut de conformite.
          </p>
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors"
          >
            <Download className="h-4 w-4" /> Exporter CSV
          </button>
        </div>

        <div className="rounded-xl border p-6">
          <FileText className="h-8 w-8 text-primary mb-3" />
          <h2 className="font-semibold mb-2">Rapport de conformite</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Rapport detaille des UFC accumules, echeances de conformite et certificats emis.
          </p>
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors"
          >
            <Download className="h-4 w-4" /> Exporter PDF
          </button>
        </div>
      </div>
    </div>
  );
}
