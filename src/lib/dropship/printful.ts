/**
 * PRINTFUL API CLIENT — Dropshipping / Print-on-Demand Integration (G11)
 *
 * Provides:
 * - Product catalog sync (import from Printful to Koraline)
 * - Order forwarding (Koraline order -> Printful fulfillment)
 * - Shipping rates estimation
 * - Webhook handling for status updates
 *
 * API Reference: https://developers.printful.com/docs/
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PrintfulProduct {
  id: number;
  external_id: string;
  name: string;
  variants: number;
  synced: number;
  thumbnail_url: string;
  is_ignored: boolean;
}

export interface PrintfulVariant {
  id: number;
  external_id: string;
  sync_product_id: number;
  name: string;
  synced: boolean;
  variant_id: number;
  retail_price: string;
  currency: string;
  sku: string | null;
  product: {
    variant_id: number;
    product_id: number;
    image: string;
    name: string;
  };
}

export interface PrintfulSyncProduct {
  id: number;
  external_id: string;
  name: string;
  variants: number;
  synced: number;
  thumbnail_url: string;
  is_ignored: boolean;
}

export interface PrintfulSyncVariant {
  id: number;
  external_id: string;
  sync_product_id: number;
  name: string;
  synced: boolean;
  variant_id: number;
  retail_price: string;
  currency: string;
  sku: string | null;
  files: Array<{
    id: number;
    type: string;
    url: string;
    preview_url: string;
  }>;
}

export interface PrintfulOrderItem {
  sync_variant_id?: number;
  external_variant_id?: string;
  quantity: number;
  retail_price: string;
  name: string;
}

export interface PrintfulOrderRecipient {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state_code: string;
  country_code: string;
  zip: string;
  phone?: string;
  email?: string;
}

export interface PrintfulOrder {
  id: number;
  external_id: string;
  status: string;
  shipping: string;
  created: number;
  updated: number;
  recipient: PrintfulOrderRecipient;
  items: PrintfulOrderItem[];
  shipments: Array<{
    id: number;
    carrier: string;
    service: string;
    tracking_number: string;
    tracking_url: string;
    ship_date: string;
  }>;
}

export interface PrintfulShippingRate {
  id: string;
  name: string;
  rate: string;
  currency: string;
  minDeliveryDays: number;
  maxDeliveryDays: number;
}

// ---------------------------------------------------------------------------
// Printful API Client
// ---------------------------------------------------------------------------

const PRINTFUL_API_BASE = 'https://api.printful.com';

export class PrintfulClient {
  private apiKey: string;
  private providerId: string;
  private tenantId: string;

  constructor(apiKey: string, providerId: string, tenantId: string) {
    this.apiKey = apiKey;
    this.providerId = providerId;
    this.tenantId = tenantId;
  }

  /** Create a PrintfulClient from a DropshipProvider record */
  static async fromProvider(providerId: string): Promise<PrintfulClient> {
    const provider = await prisma.dropshipProvider.findUnique({
      where: { id: providerId },
    });
    if (!provider || !provider.apiKey) {
      throw new Error('Printful provider not found or missing API key');
    }
    return new PrintfulClient(provider.apiKey, provider.id, provider.tenantId);
  }

  // ── HTTP helpers ──────────────────────────────────────────────

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${PRINTFUL_API_BASE}${path}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[Printful] API error', {
        status: response.status,
        path,
        error: errorText,
      });
      throw new Error(`Printful API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.result as T;
  }

  // ── Products ──────────────────────────────────────────────────

  /** List all sync products in the Printful store */
  async listProducts(offset = 0, limit = 100): Promise<PrintfulSyncProduct[]> {
    return this.request<PrintfulSyncProduct[]>(
      'GET',
      `/sync/products?offset=${offset}&limit=${limit}`
    );
  }

  /** Get a single sync product with variants */
  async getProduct(productId: number): Promise<{
    sync_product: PrintfulSyncProduct;
    sync_variants: PrintfulSyncVariant[];
  }> {
    return this.request('GET', `/sync/products/${productId}`);
  }

  /** Sync all products from Printful into Koraline DropshipProduct records */
  async syncProducts(): Promise<{ imported: number; updated: number; errors: number }> {
    let offset = 0;
    const limit = 100;
    let imported = 0;
    let updated = 0;
    let errors = 0;

    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const products = await this.listProducts(offset, limit);
        if (products.length === 0) break;

        for (const product of products) {
          try {
            const existing = await prisma.dropshipProduct.findFirst({
              where: {
                tenantId: this.tenantId,
                providerId: this.providerId,
                externalId: String(product.id),
              },
            });

            if (existing) {
              await prisma.dropshipProduct.update({
                where: { id: existing.id },
                data: {
                  syncStatus: 'synced',
                  lastSyncAt: new Date(),
                  metadata: {
                    name: product.name,
                    thumbnail: product.thumbnail_url,
                    variants: product.variants,
                  },
                },
              });
              updated++;
            } else {
              await prisma.dropshipProduct.create({
                data: {
                  tenantId: this.tenantId,
                  providerId: this.providerId,
                  externalId: String(product.id),
                  syncStatus: 'synced',
                  lastSyncAt: new Date(),
                  metadata: {
                    name: product.name,
                    thumbnail: product.thumbnail_url,
                    variants: product.variants,
                  },
                },
              });
              imported++;
            }
          } catch (err) {
            logger.error('[Printful] Error syncing product', {
              productId: product.id,
              error: err instanceof Error ? err.message : String(err),
            });
            errors++;
          }
        }

        offset += limit;
        if (products.length < limit) break;
      }

      // Update provider sync timestamp
      await prisma.dropshipProvider.update({
        where: { id: this.providerId },
        data: { syncedAt: new Date() },
      });
    } catch (err) {
      logger.error('[Printful] Error during product sync', {
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }

    return { imported, updated, errors };
  }

  // ── Orders ────────────────────────────────────────────────────

  /** Forward a Koraline order to Printful for fulfillment */
  async forwardOrder(
    orderId: string,
    recipient: PrintfulOrderRecipient,
    items: PrintfulOrderItem[]
  ): Promise<PrintfulOrder> {
    const order = await this.request<PrintfulOrder>('POST', '/orders', {
      external_id: orderId,
      recipient,
      items,
    });

    // Record the forwarded order
    await prisma.dropshipOrder.create({
      data: {
        tenantId: this.tenantId,
        providerId: this.providerId,
        orderId,
        externalOrderId: String(order.id),
        status: 'forwarded',
        forwardedAt: new Date(),
        metadata: { printfulStatus: order.status },
      },
    });

    return order;
  }

  /** Get order status from Printful */
  async getOrder(externalOrderId: string): Promise<PrintfulOrder> {
    return this.request<PrintfulOrder>('GET', `/orders/${externalOrderId}`);
  }

  /** List all orders in the Printful store */
  async listOrders(offset = 0, limit = 100): Promise<PrintfulOrder[]> {
    return this.request<PrintfulOrder[]>(
      'GET',
      `/orders?offset=${offset}&limit=${limit}`
    );
  }

  /** Sync order statuses from Printful back to Koraline */
  async syncOrderStatuses(): Promise<{ updated: number; errors: number }> {
    let updatedCount = 0;
    let errorCount = 0;

    const pendingOrders = await prisma.dropshipOrder.findMany({
      where: {
        tenantId: this.tenantId,
        providerId: this.providerId,
        status: { in: ['forwarded', 'processing'] },
      },
    });

    for (const dropshipOrder of pendingOrders) {
      if (!dropshipOrder.externalOrderId) continue;

      try {
        const printfulOrder = await this.getOrder(dropshipOrder.externalOrderId);
        const statusMap: Record<string, string> = {
          draft: 'pending',
          pending: 'processing',
          failed: 'error',
          canceled: 'error',
          inprocess: 'processing',
          onhold: 'processing',
          partial: 'processing',
          fulfilled: 'shipped',
        };

        const newStatus = statusMap[printfulOrder.status] || dropshipOrder.status;
        const tracking = printfulOrder.shipments?.[0];

        await prisma.dropshipOrder.update({
          where: { id: dropshipOrder.id },
          data: {
            status: newStatus,
            trackingNumber: tracking?.tracking_number || dropshipOrder.trackingNumber,
            trackingUrl: tracking?.tracking_url || dropshipOrder.trackingUrl,
            metadata: {
              printfulStatus: printfulOrder.status,
              lastChecked: new Date().toISOString(),
            },
          },
        });
        updatedCount++;
      } catch (err) {
        logger.error('[Printful] Error syncing order status', {
          orderId: dropshipOrder.orderId,
          error: err instanceof Error ? err.message : String(err),
        });
        errorCount++;
      }
    }

    return { updated: updatedCount, errors: errorCount };
  }

  // ── Shipping Rates ────────────────────────────────────────────

  /** Estimate shipping rates for a potential order */
  async getShippingRates(
    recipient: PrintfulOrderRecipient,
    items: Array<{ variant_id?: number; external_variant_id?: string; quantity: number }>
  ): Promise<PrintfulShippingRate[]> {
    const result = await this.request<Array<{
      id: string;
      name: string;
      rate: string;
      currency: string;
      minDeliveryDays: number;
      maxDeliveryDays: number;
    }>>('POST', '/shipping/rates', { recipient, items });

    return result.map(r => ({
      id: r.id,
      name: r.name,
      rate: r.rate,
      currency: r.currency,
      minDeliveryDays: r.minDeliveryDays,
      maxDeliveryDays: r.maxDeliveryDays,
    }));
  }

  // ── Validation ────────────────────────────────────────────────

  /** Test the API key by fetching store info */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.request('GET', '/store');
      return true;
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Generic Dropship Provider Factory
// ---------------------------------------------------------------------------

export type DropshipProviderType = 'printful' | 'printify' | 'spocket' | 'dsers';

/**
 * Create the appropriate client for a given provider type.
 * Currently only Printful is fully implemented; others return a stub.
 */
export function createDropshipClient(
  provider: DropshipProviderType,
  apiKey: string,
  providerId: string,
  tenantId: string,
): PrintfulClient {
  switch (provider) {
    case 'printful':
      return new PrintfulClient(apiKey, providerId, tenantId);
    // Future: case 'printify': return new PrintifyClient(...)
    default:
      // Fallback: use Printful-compatible client (providers share similar REST patterns)
      logger.warn(`[Dropship] Provider "${provider}" not yet fully implemented, using Printful client`);
      return new PrintfulClient(apiKey, providerId, tenantId);
  }
}
