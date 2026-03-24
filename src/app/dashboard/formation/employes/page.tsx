'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface EmployeeSummary {
  userId: string;
  department: string | null;
  coursesEnrolled: number;
  coursesCompleted: number;
  coursesInProgress: number;
  averageProgress: number;
}

export default function CorporateEmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/lms/corporate/dashboard')
      .then(r => r.json())
      .then(d => setEmployees(d.data?.employeeSummaries ?? []))
      .catch(() => setEmployees([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-12 text-muted-foreground">Chargement...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Employes</h1>
          <p className="text-muted-foreground">{employees.length} employe(s) inscrit(s)</p>
        </div>
        <Link href="/dashboard/formation" className="text-sm text-muted-foreground hover:underline">Retour au dashboard</Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">Employe</th>
              <th className="text-left p-3">Departement</th>
              <th className="text-center p-3">Cours</th>
              <th className="text-center p-3">Termines</th>
              <th className="text-center p-3">En cours</th>
              <th className="text-left p-3">Progression</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.userId} className="border-b hover:bg-muted/50">
                <td className="p-3 font-mono text-xs">{emp.userId.slice(0, 20)}...</td>
                <td className="p-3">{emp.department ?? '-'}</td>
                <td className="p-3 text-center">{emp.coursesEnrolled}</td>
                <td className="p-3 text-center text-green-600 font-medium">{emp.coursesCompleted}</td>
                <td className="p-3 text-center">{emp.coursesInProgress}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-2 max-w-[120px]">
                      <div className="bg-primary rounded-full h-2" style={{ width: `${Math.round(emp.averageProgress)}%` }} />
                    </div>
                    <span className="text-xs w-10 text-right">{Math.round(emp.averageProgress)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
