'use client';

/**
 * ADMIN — Dropshipping / Print-on-Demand Dashboard (G11)
 *
 * Features:
 * - Connect/disconnect dropship providers (Printful, Printify, Spocket, DSers)
 * - Sync products from provider catalog
 * - View order forwarding status
 * - Monitor sync health
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Truck,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  ExternalLink,
  Settings,
  ShoppingCart,
  X,
  Eye,
  Unplug,
} from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { toast } from 'sonner';
import { addCSRFHeader } from '@/lib/csrf';

// ── Types ─────────────────────────────────────────────────────

interface DropshipProvider {
  id: string;
  provider: string;
  isActive: boolean;
  config: Record<string, unknown>;
  syncedAt: string | null;
  createdAt: string;
  productCount: number;
  orderCount: number;
  hasApiKey: boolean;
  apiKeyPreview: string | null;
}

interface DropshipOrder {
  id: string;
  orderId: string;
  externalOrderId: string | null;
  status: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  errorMessage: string | null;
  forwardedAt: string | null;
  createdAt: string;
}

// ── Provider metadata ─────────────────────────────────────────

const PROVIDER_INFO: Record<string, { name: string; logo: string; url: string; description: string }> = {
  printful: {
    name: 'Printful',
    logo: '/images/integrations/printful.png',
    url: 'https://www.printful.com',
    description: 'Print-on-demand: t-shirts, mugs, posters, phone cases, and more.',
  },
  printify: {
    name: 'Printify',
    logo: '/images/integrations/printify.png',
    url: 'https://www.printify.com',
    description: 'Print-on-demand marketplace with 800+ products and global shipping.',
  },
  spocket: {
    name: 'Spocket',
    logo: '/images/integrations/spocket.png',
    url: 'https://www.spocket.co',
    description: 'US/EU-based dropshipping suppliers with fast shipping times.',
  },
  dsers: {
    name: 'DSers',
    logo: '/images/integrations/dsers.png',
    url: 'https://www.dsers.com',
    description: 'AliExpress dropshipping tool with bulk order management.',
  },
};

const STATUS_CONFIG: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
  pending: { color: 'text-amber-500', icon: Clock },
  forwarded: { color: 'text-blue-500', icon: Truck },
  processing: { color: 'text-indigo-500', icon: RefreshCw },
  shipped: { color: 'text-emerald-500', icon: Package },
  delivered: { color: 'text-green-600', icon: CheckCircle2 },
  error: { color: 'text-red-500', icon: AlertCircle },
};

export default function DropshippingPage() {
  const { t } = useI18n();
  const [providers, setProviders] = useState<DropshipProvider[]>([]);
  const [orders, setOrders] = useState<DropshipOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showConnect, setShowConnect] = useState(false);
  const [connectForm, setConnectForm] = useState({ provider: 'printful', apiKey: '' });
  const [connecting, setConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState<'providers' | 'orders'>('providers');

  // ── Fetch data ────────────────────────────────────────────

  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/dropshipping/providers', { headers: addCSRFHeader({}) });
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers || []);
      }
    } catch (err) {
      console.error('Error fetching providers:', err);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/dropshipping/orders?limit=50', { headers: addCSRFHeader({}) });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchProviders(), fetchOrders()]).finally(() => setLoading(false));
  }, [fetchProviders, fetchOrders]);

  // ── Actions ───────────────────────────────────────────────

  const handleConnect = async () => {
    if (!connectForm.apiKey.trim()) {
      toast.error(t('admin.dropshipping.apiKeyRequired'));
      return;
    }
    setConnecting(true);
    try {
      const res = await fetch('/api/admin/dropshipping/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...addCSRFHeader({}) },
        body: JSON.stringify(connectForm),
      });
      if (res.ok) {
        toast.success(t('admin.dropshipping.providerConnected'));
        setShowConnect(false);
        setConnectForm({ provider: 'printful', apiKey: '' });
        fetchProviders();
      } else {
        const data = await res.json();
        toast.error(data.error || t('admin.dropshipping.connectionFailed'));
      }
    } catch {
      toast.error(t('admin.dropshipping.connectionFailed'));
    } finally {
      setConnecting(false);
    }
  };

  const handleSync = async (providerId: string) => {
    setSyncing(providerId);
    try {
      const res = await fetch('/api/admin/dropshipping/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...addCSRFHeader({}) },
        body: JSON.stringify({ providerId }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`${t('admin.dropshipping.syncComplete')}: ${data.imported} ${t('admin.dropshipping.imported')}, ${data.updated} ${t('admin.dropshipping.updated')}`);
        fetchProviders();
      } else {
        toast.error(t('admin.dropshipping.syncFailed'));
      }
    } catch {
      toast.error(t('admin.dropshipping.syncFailed'));
    } finally {
      setSyncing(null);
    }
  };

  const handleSyncOrders = async (providerId: string) => {
    setSyncing(`orders-${providerId}`);
    try {
      const res = await fetch('/api/admin/dropshipping/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...addCSRFHeader({}) },
        body: JSON.stringify({ providerId }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`${t('admin.dropshipping.ordersSynced')}: ${data.updated} ${t('admin.dropshipping.updated')}`);
        fetchOrders();
      } else {
        toast.error(t('admin.dropshipping.syncFailed'));
      }
    } catch {
      toast.error(t('admin.dropshipping.syncFailed'));
    } finally {
      setSyncing(null);
    }
  };

  // ── Render ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('admin.dropshipping.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('admin.dropshipping.subtitle')}
          </p>
        </div>
        <button
          onClick={() => setShowConnect(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('admin.dropshipping.connectProvider')}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('providers')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'providers'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Package className="w-4 h-4 inline mr-2" />
          {t('admin.dropshipping.providers')} ({providers.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'orders'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShoppingCart className="w-4 h-4 inline mr-2" />
          {t('admin.dropshipping.orders')} ({orders.length})
        </button>
      </div>

      {/* Providers tab */}
      {activeTab === 'providers' && (
        <div className="space-y-4">
          {providers.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <Truck className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                {t('admin.dropshipping.noProviders')}
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                {t('admin.dropshipping.noProvidersDescription')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {providers.map(provider => {
                const info = PROVIDER_INFO[provider.provider];
                return (
                  <div
                    key={provider.id}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {info?.name || provider.provider}
                          </h3>
                          <div className="flex items-center gap-2 text-xs">
                            {provider.isActive ? (
                              <span className="flex items-center gap-1 text-green-600">
                                <CheckCircle2 className="w-3 h-3" /> {t('admin.dropshipping.connected')}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-gray-400">
                                <Unplug className="w-3 h-3" /> {t('admin.dropshipping.disconnected')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {info?.url && (
                        <a href={info.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>

                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {info?.description}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{provider.productCount}</div>
                        <div className="text-xs text-gray-500">{t('admin.dropshipping.products')}</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{provider.orderCount}</div>
                        <div className="text-xs text-gray-500">{t('admin.dropshipping.orders')}</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="text-xs text-gray-500">{t('admin.dropshipping.lastSync')}</div>
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {provider.syncedAt ? new Date(provider.syncedAt).toLocaleDateString() : '—'}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSync(provider.id)}
                        disabled={syncing === provider.id}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
                      >
                        {syncing === provider.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        {t('admin.dropshipping.syncProducts')}
                      </button>
                      <button
                        onClick={() => handleSyncOrders(provider.id)}
                        disabled={syncing === `orders-${provider.id}`}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                      >
                        {syncing === `orders-${provider.id}` ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ShoppingCart className="w-4 h-4" />
                        )}
                        {t('admin.dropshipping.syncOrders')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Orders tab */}
      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                {t('admin.dropshipping.noOrders')}
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                {t('admin.dropshipping.noOrdersDescription')}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">{t('admin.dropshipping.orderId')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">{t('admin.dropshipping.externalId')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">{t('admin.dropshipping.status')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">{t('admin.dropshipping.tracking')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">{t('admin.dropshipping.date')}</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {orders.map(order => {
                  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                  const StatusIcon = statusCfg.icon;
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3 font-mono text-xs">{order.orderId.slice(0, 12)}...</td>
                      <td className="px-4 py-3 font-mono text-xs">{order.externalOrderId || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 text-xs font-medium ${statusCfg.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {order.trackingUrl ? (
                          <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                            {order.trackingNumber || t('admin.dropshipping.track')}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="text-gray-400 hover:text-gray-600 p-1">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Connect Modal */}
      {showConnect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('admin.dropshipping.connectProvider')}
              </h2>
              <button onClick={() => setShowConnect(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Provider selection */}
            <div className="space-y-3 mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('admin.dropshipping.selectProvider')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(PROVIDER_INFO).map(([key, info]) => (
                  <button
                    key={key}
                    onClick={() => setConnectForm(f => ({ ...f, provider: key }))}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      connectForm.provider === key
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-medium text-sm text-gray-900 dark:text-white">{info.name}</div>
                    <div className="text-xs text-gray-500 mt-1 line-clamp-2">{info.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* API Key */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('admin.dropshipping.apiKeyLabel')}
              </label>
              <input
                type="password"
                value={connectForm.apiKey}
                onChange={e => setConnectForm(f => ({ ...f, apiKey: e.target.value }))}
                placeholder={t('admin.dropshipping.apiKeyPlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-2">
                {t('admin.dropshipping.apiKeyHelp')}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowConnect(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleConnect}
                disabled={connecting || !connectForm.apiKey.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
                {t('admin.dropshipping.connect')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
