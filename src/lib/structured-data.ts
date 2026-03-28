const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://attitudes.vip';
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Attitudes VIP';
const ORG_LEGAL_NAME = 'Attitudes VIP inc.';
const DEFAULT_LOGO = `${SITE_URL}/icon-512.png`;

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    legalName: ORG_LEGAL_NAME,
    url: SITE_URL,
    logo: DEFAULT_LOGO,
    description:
      'Plateforme SaaS tout-en-un pour PME : commerce, CRM, comptabilite, marketing, telephonie, formation et IA. Fait au Quebec.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'CA',
      addressRegion: 'QC',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      url: `${SITE_URL}/contact`,
      availableLanguage: ['English', 'French'],
    },
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/shop?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

interface ProductSchemaInput {
  name: string;
  description: string;
  slug: string;
  image?: string;
  images?: { url: string }[];
  price: number;
  purity?: number;
  sku?: string;
  inStock?: boolean;
  categoryName?: string;
  reviewCount?: number;
  ratingValue?: number;
}

export function productSchema(product: ProductSchemaInput) {
  const imageUrls: string[] = [];
  if (product.images && product.images.length > 0) {
    for (const img of product.images) {
      imageUrls.push(img.url.startsWith('http') ? img.url : `${SITE_URL}${img.url}`);
    }
  } else if (product.image) {
    imageUrls.push(product.image.startsWith('http') ? product.image : `${SITE_URL}${product.image}`);
  }

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    url: `${SITE_URL}/product/${product.slug}`,
    image: imageUrls.length > 0 ? imageUrls : undefined,
    brand: {
      '@type': 'Brand',
      name: SITE_NAME,
    },
    offers: {
      '@type': 'Offer',
      price: product.price.toFixed(2),
      priceCurrency: 'CAD',
      availability: product.inStock !== false
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: SITE_NAME,
      },
      url: `${SITE_URL}/product/${product.slug}`,
    },
  };

  if (product.sku) {
    schema.sku = product.sku;
  }

  if (product.categoryName) {
    schema.category = product.categoryName;
  }

  if (product.reviewCount && product.reviewCount > 0 && product.ratingValue) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.ratingValue.toFixed(1),
      reviewCount: product.reviewCount,
      bestRating: '5',
      worstRating: '1',
    };
  }

  return schema;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

interface FaqItem {
  question: string;
  answer: string;
}

export function faqSchema(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

interface ArticleSchemaInput {
  headline: string;
  description: string;
  slug: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  author?: string;
}

export function articleSchema(article: ArticleSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.headline,
    description: article.description,
    url: `${SITE_URL}/learn/${article.slug}`,
    image: article.image
      ? article.image.startsWith('http')
        ? article.image
        : `${SITE_URL}${article.image}`
      : undefined,
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    author: {
      '@type': 'Organization',
      name: article.author || SITE_NAME,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: DEFAULT_LOGO,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// SoftwareApplication schema (Koraline platform / individual modules)
// ---------------------------------------------------------------------------

interface SoftwareAppInput {
  name: string;
  description: string;
  url?: string;
  applicationCategory?: string;
  operatingSystem?: string;
  offers?: {
    price: number; // in dollars (not cents)
    priceCurrency?: string;
    billingPeriod?: string;
  };
  featureList?: string[];
}

export function softwareApplicationSchema(app: SoftwareAppInput) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: app.name,
    description: app.description,
    url: app.url || SITE_URL,
    applicationCategory: app.applicationCategory || 'BusinessApplication',
    operatingSystem: app.operatingSystem || 'Web',
    provider: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };

  if (app.offers) {
    schema.offers = {
      '@type': 'Offer',
      price: app.offers.price.toFixed(2),
      priceCurrency: app.offers.priceCurrency || 'CAD',
      url: `${SITE_URL}/platform/pricing`,
    };
  }

  if (app.featureList && app.featureList.length > 0) {
    schema.featureList = app.featureList.join(', ');
  }

  return schema;
}

// ---------------------------------------------------------------------------
// ItemList schema (list of modules, products, etc.)
// ---------------------------------------------------------------------------

interface ItemListEntry {
  name: string;
  url: string;
  description?: string;
  image?: string;
}

export function itemListSchema(items: ItemListEntry[], listName?: string) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
      ...(item.description ? { description: item.description } : {}),
      ...(item.image ? { image: item.image } : {}),
    })),
  };

  if (listName) {
    schema.name = listName;
  }

  return schema;
}

// ---------------------------------------------------------------------------
// Pricing / Offer catalog schema (for pricing pages)
// ---------------------------------------------------------------------------

interface PlanOffer {
  name: string;
  description: string;
  price: number; // in dollars (not cents)
  priceCurrency?: string;
  url?: string;
  features?: string[];
}

export function offerCatalogSchema(plans: PlanOffer[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Suite Koraline',
    description:
      'Plateforme SaaS tout-en-un pour PME : commerce, CRM, comptabilite, marketing, telephonie, formation et IA.',
    brand: {
      '@type': 'Brand',
      name: SITE_NAME,
    },
    url: `${SITE_URL}/platform/pricing`,
    offers: plans.map((plan) => ({
      '@type': 'Offer',
      name: plan.name,
      description: plan.description,
      price: plan.price.toFixed(2),
      priceCurrency: plan.priceCurrency || 'CAD',
      url: plan.url || `${SITE_URL}/platform/pricing`,
      priceValidUntil: new Date(new Date().getFullYear() + 1, 0, 1)
        .toISOString()
        .split('T')[0],
      ...(plan.features && plan.features.length > 0
        ? { itemOffered: { '@type': 'Service', name: plan.name, description: plan.features.join(', ') } }
        : {}),
    })),
  };
}
