'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from '@/hooks/useTranslations';
import { PageHeader, Button, Modal, FormField, Input, DataTable, StatusBadge, type Column } from '@/components/admin';
import { UserPlus, Package, BarChart3 } from 'lucide-react';
import Link from 'next/link';

interface Account {
  id: string;
  companyName: string;
  contactEmail: string;
  contactName: string | null;
  billingMethod: string;
  discountPercent: number;
  budgetAmount: number | null;
  budgetUsed: number;
  employees: Array<{ id: string; userId: string; department: string | null; role: string; isActive: boolean; addedAt: string }>;
  _count: { employees: number; enrollments: number; bundleOrders: number };
}

export default function CorporateDetailPage() {
  useTranslations();
  const params = useParams();
  const id = params.id as string;
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [bundles, setBundles] = useState<Array<{ id: string; name: string }>>([]);
  const [enrollBundleId, setEnrollBundleId] = useState('');
  const [enrollUserIds, setEnrollUserIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchAccount = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/lms/corporate/${id}`);
      const data = await res.json();
      setAccount(data.data ?? null);
    } catch { setAccount(null); }
    finally { setLoading(false); }
  }, [id]);

  const fetchBundles = useCallback(async () => {
    const res = await fetch('/api/admin/lms/bundles');
    const data = await res.json();
    setBundles(data.data ?? []);
  }, []);

  useEffect(() => { fetchAccount(); fetchBundles(); }, [fetchAccount, fetchBundles]);

  const handleAddEmployee = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/lms/corporate/${id}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: newUserId, department: newDepartment || undefined }),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? 'Error');
      setAddModalOpen(false);
      setNewUserId('');
      setNewDepartment('');
      fetchAccount();
    } catch (err) { setError((err as Error).message); }
    finally { setSubmitting(false); }
  };

  const handleEnroll = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/lms/corporate/${id}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'bundle', itemId: enrollBundleId, userIds: enrollUserIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Error');
      setEnrollModalOpen(false);
      setEnrollBundleId('');
      setEnrollUserIds([]);
      fetchAccount();
      alert(`${data.data.enrollmentsCreated} inscription(s) creee(s), ${data.data.enrollmentsSkipped} deja inscrit(s)`);
    } catch (err) { setError((err as Error).message); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Chargement...</div>;
  if (!account) return <div className="text-center py-12 text-destructive">Compte non trouve</div>;

  const employeeColumns: Column<Account['employees'][0]>[] = [
    { key: 'userId', header: 'ID Utilisateur', render: (e) => <span className="font-mono text-xs">{e.userId.slice(0, 12)}...</span> },
    { key: 'department', header: 'Departement', render: (e) => e.department ?? '-' },
    { key: 'role', header: 'Role', render: (e) => <StatusBadge variant={e.role === 'ADMIN' ? 'warning' : 'neutral'}>{e.role}</StatusBadge> },
    { key: 'addedAt', header: 'Ajoute le', render: (e) => new Date(e.addedAt).toLocaleDateString('fr-CA') },
  ];

  const budgetPercent = account.budgetAmount
    ? Math.round((Number(account.budgetUsed) / Number(account.budgetAmount)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={account.companyName}
        subtitle={`${account._count.employees} employe(s) | ${account._count.enrollments} inscription(s) | Rabais ${account.discountPercent}%`}
        actions={
          <div className="flex gap-2">
            <Link href={`/admin/formation/corporatif/${id}/dashboard`}>
              <Button variant="outline"><BarChart3 className="h-4 w-4 mr-2" /> Dashboard</Button>
            </Link>
            <Button variant="outline" onClick={() => setEnrollModalOpen(true)}>
              <Package className="h-4 w-4 mr-2" /> Parrainer
            </Button>
            <Button onClick={() => setAddModalOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" /> Ajouter employe
            </Button>
          </div>
        }
      />

      {/* Budget */}
      {account.budgetAmount && (
        <div className="rounded-lg border p-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Budget formation</span>
            <span className="font-medium">{Number(account.budgetUsed).toFixed(0)} / {Number(account.budgetAmount).toFixed(0)} $</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${Math.min(budgetPercent, 100)}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{budgetPercent}% utilise</p>
        </div>
      )}

      {/* Employees */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Employes ({account.employees.length})</h3>
        <DataTable columns={employeeColumns} data={account.employees} keyExtractor={(e) => e.id} />
      </div>

      {/* Add Employee Modal */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Ajouter un employe">
        <form onSubmit={handleAddEmployee} className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <FormField label="ID utilisateur">
            <Input value={newUserId} onChange={(e) => setNewUserId(e.target.value)} required placeholder="ID de l'utilisateur dans le systeme" />
          </FormField>
          <FormField label="Departement">
            <Input value={newDepartment} onChange={(e) => setNewDepartment(e.target.value)} placeholder="Souscription, Sinistres, etc." />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setAddModalOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'En cours...' : 'Ajouter'}</Button>
          </div>
        </form>
      </Modal>

      {/* Enroll Modal */}
      <Modal isOpen={enrollModalOpen} onClose={() => setEnrollModalOpen(false)} title="Parrainer des employes">
        <form onSubmit={handleEnroll} className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <FormField label="Forfait">
            <select value={enrollBundleId} onChange={(e) => setEnrollBundleId(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" required>
              <option value="">Choisir un forfait...</option>
              {bundles.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </FormField>
          <FormField label="Employes a inscrire">
            <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
              {account.employees.filter(e => e.isActive).map(emp => (
                <label key={emp.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted p-1 rounded">
                  <input
                    type="checkbox"
                    checked={enrollUserIds.includes(emp.userId)}
                    onChange={(e) => {
                      setEnrollUserIds(prev => e.target.checked
                        ? [...prev, emp.userId]
                        : prev.filter(id => id !== emp.userId)
                      );
                    }}
                  />
                  {emp.userId.slice(0, 12)}... {emp.department ? `(${emp.department})` : ''}
                </label>
              ))}
            </div>
          </FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setEnrollModalOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={submitting || !enrollBundleId || enrollUserIds.length === 0}>
              {submitting ? 'En cours...' : `Inscrire ${enrollUserIds.length} employe(s)`}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
