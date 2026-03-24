'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/admin';
import { BarChart3, Users, BookOpen, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  companyName: string;
  totalEmployees: number;
  enrolledEmployees: number;
  totalEnrollments: number;
  completedEnrollments: number;
  completionRate: number;
  averageProgress: number;
  averageQuizScore: number;
  overdueCompliance: number;
  budgetUsed: number;
  budgetTotal: number | null;
  employeeSummaries: Array<{
    userId: string;
    department: string | null;
    coursesEnrolled: number;
    coursesCompleted: number;
    coursesInProgress: number;
    averageProgress: number;
  }>;
}

function StatCard({ icon: Icon, label, value, sublabel, color = 'primary' }: {
  icon: typeof Users; label: string; value: string | number; sublabel?: string; color?: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-${color}/10`}><Icon className={`h-5 w-5 text-${color}`} /></div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
          {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
        </div>
      </div>
    </div>
  );
}

export default function CorporateDashboardPage() {
  const params = useParams();
  const id = params.id as string;
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/lms/corporate/${id}/dashboard`);
      const data = await res.json();
      setStats(data.data ?? null);
    } catch { setStats(null); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) return <div className="text-center py-12 text-muted-foreground">Chargement...</div>;
  if (!stats) return <div className="text-center py-12 text-destructive">Statistiques non disponibles</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Dashboard — ${stats.companyName}`}
        subtitle="Statistiques de formation et progression"
        actions={<Link href={`/admin/formation/corporatif/${id}`} className="text-sm text-muted-foreground hover:underline">Retour au detail</Link>}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={Users} label="Employes" value={stats.totalEmployees} sublabel={`${stats.enrolledEmployees} inscrits`} />
        <StatCard icon={BookOpen} label="Inscriptions" value={stats.totalEnrollments} />
        <StatCard icon={CheckCircle} label="Taux completion" value={`${stats.completionRate}%`} color="success" />
        <StatCard icon={TrendingUp} label="Progression moy." value={`${stats.averageProgress}%`} />
        <StatCard icon={BarChart3} label="Score quiz moy." value={`${stats.averageQuizScore}%`} />
        <StatCard icon={AlertTriangle} label="En retard" value={stats.overdueCompliance} color="destructive" />
      </div>

      {/* Budget */}
      {stats.budgetTotal && (
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold mb-2">Budget formation</h3>
          <div className="flex justify-between text-sm mb-1">
            <span>Utilise</span>
            <span>{stats.budgetUsed.toFixed(0)} / {stats.budgetTotal.toFixed(0)} $</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className="bg-primary rounded-full h-3 transition-all"
              style={{ width: `${Math.min(Math.round((stats.budgetUsed / stats.budgetTotal) * 100), 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Employee Breakdown */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Progression par employe</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Employe</th>
                <th className="text-left p-2">Departement</th>
                <th className="text-center p-2">Cours</th>
                <th className="text-center p-2">Termines</th>
                <th className="text-center p-2">En cours</th>
                <th className="text-left p-2">Progression</th>
              </tr>
            </thead>
            <tbody>
              {stats.employeeSummaries.map((emp) => (
                <tr key={emp.userId} className="border-b hover:bg-muted/50">
                  <td className="p-2 font-mono text-xs">{emp.userId.slice(0, 16)}...</td>
                  <td className="p-2">{emp.department ?? '-'}</td>
                  <td className="p-2 text-center">{emp.coursesEnrolled}</td>
                  <td className="p-2 text-center text-green-600 font-medium">{emp.coursesCompleted}</td>
                  <td className="p-2 text-center">{emp.coursesInProgress}</td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div className="bg-primary rounded-full h-2" style={{ width: `${Math.round(emp.averageProgress)}%` }} />
                      </div>
                      <span className="text-xs w-8 text-right">{Math.round(emp.averageProgress)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
