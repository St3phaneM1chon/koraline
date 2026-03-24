'use client';

import { useState, useEffect } from 'react';
import { Users, BookOpen, CheckCircle, TrendingUp, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
  companyName: string;
  totalEmployees: number;
  enrolledEmployees: number;
  totalEnrollments: number;
  completedEnrollments: number;
  completionRate: number;
  averageProgress: number;
  averageQuizScore: number;
  overdueCompliance: number;
}

export default function CorporateFormationDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/lms/corporate/dashboard')
      .then(r => r.json())
      .then(d => setData(d.data ?? null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-12 text-muted-foreground">Chargement...</div>;
  if (!data) return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">Aucun compte corporatif associe.</p>
      <p className="text-sm text-muted-foreground mt-2">Contactez votre administrateur pour activer le portail formation.</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{data.companyName} — Formation</h1>
        <p className="text-muted-foreground">Tableau de bord de la formation continue</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { icon: Users, label: 'Employes inscrits', value: `${data.enrolledEmployees}/${data.totalEmployees}` },
          { icon: BookOpen, label: 'Inscriptions', value: data.totalEnrollments },
          { icon: CheckCircle, label: 'Taux completion', value: `${data.completionRate}%` },
          { icon: TrendingUp, label: 'Score moyen', value: `${data.averageQuizScore}%` },
          { icon: AlertTriangle, label: 'En retard', value: data.overdueCompliance },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-lg border p-4 text-center">
            <Icon className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Links */}
      <div className="flex gap-4">
        <Link href="/dashboard/formation/employes" className="px-4 py-2 rounded-lg border hover:border-primary text-sm font-medium transition-colors">
          Voir les employes
        </Link>
        <Link href="/dashboard/formation/rapports" className="px-4 py-2 rounded-lg border hover:border-primary text-sm font-medium transition-colors">
          Rapports
        </Link>
      </div>
    </div>
  );
}
