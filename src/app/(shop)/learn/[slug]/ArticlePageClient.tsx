'use client';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from '@/hooks/useTranslations';
import type DOMPurifyType from 'dompurify';

// DOMPurify client-only
const DOMPurify: typeof DOMPurifyType =
  typeof window !== 'undefined'
    ? require('dompurify')
    : ({ sanitize: (html: string) => html } as typeof DOMPurifyType);

const articleProductMap: Record<string, { slug: string; name: string }[]> = {
  'bpc-157-research-overview': [{ slug: 'bpc-157', name: 'BPC-157' }],
  'tb500-healing-peptide': [{ slug: 'tb-500', name: 'TB-500' }],
  'glp1-agonists-explained': [
    { slug: 'semaglutide', name: 'Semaglutide' },
    { slug: 'tirzepatide', name: 'Tirzepatide' },
    { slug: 'retatrutide', name: 'Retatrutide' },
  ],
  'how-to-reconstitute-peptides': [{ slug: 'bac-water', name: 'Bacteriostatic Water' }],
  'peptide-calculator-guide': [{ slug: 'bac-water', name: 'Bacteriostatic Water' }],
};

const articlesContent: Record<
  string,
  { title: string; category: string; readTime: string; author: string; date: string; content: string }
> = {
  'what-are-peptides': {
    title: "What Are Peptides? A Beginner's Guide",
    category: 'Education',
    readTime: '5 min read',
    author: 'Peptide Plus+ Research Team',
    date: 'January 15, 2026',
    content: `## Introduction to Peptides\n\nPeptides are short chains of amino acids linked by peptide bonds...`,
  },
  'how-to-reconstitute-peptides': {
    title: 'How to Reconstitute Peptides: Step-by-Step Guide',
    category: 'How-To',
    readTime: '7 min read',
    author: 'Peptide Plus+ Research Team',
    date: 'January 10, 2026',
    content: `## Why Proper Reconstitution Matters\n\nReconstitution is the process of dissolving lyophilized peptides...`,
  },
  'peptide-storage-guide': {
    title: 'Peptide Storage: Best Practices for Researchers',
    category: 'How-To',
    readTime: '4 min read',
    author: 'Peptide Plus+ Research Team',
    date: 'January 8, 2026',
    content: `## Why Proper Storage Matters\n\nPeptides are sensitive biological molecules...`,
  },
  'understanding-coa-documents': {
    title: 'Understanding Certificate of Analysis (COA) Documents',
    category: 'Education',
    readTime: '6 min read',
    author: 'Peptide Plus+ Research Team',
    date: 'January 5, 2026',
    content: `## What is a Certificate of Analysis?\n\nA Certificate of Analysis (COA) is an official document...`,
  },
  'bpc-157-research-overview': {
    title: 'BPC-157 Research Overview: What Scientists Have Discovered',
    category: 'Research',
    readTime: '10 min read',
    author: 'Peptide Plus+ Research Team',
    date: 'January 3, 2026',
    content: `## Introduction to BPC-157\n\nBPC-157 is a pentadecapeptide consisting of 15 amino acids...`,
  },
  'glp1-agonists-explained': {
    title: 'GLP-1 Agonists Explained: Semaglutide, Tirzepatide & Retatrutide',
    category: 'Research',
    readTime: '12 min read',
    author: 'Peptide Plus+ Research Team',
    date: 'January 1, 2026',
    content: `## Introduction to GLP-1 Agonists\n\nGLP-1 agonists mimic the effects of the naturally occurring incretin hormone...`,
  },
  'tb500-healing-peptide': {
    title: 'TB-500: The Healing Peptide in Research',
    category: 'Research',
    readTime: '8 min read',
    author: 'Peptide Plus+ Research Team',
    date: 'December 28, 2025',
    content: `## What is TB-500?\n\nTB-500 (Thymosin Beta-4) is a 43-amino acid peptide...`,
  },
  'peptide-calculator-guide': {
    title: 'How to Use a Peptide Calculator for Reconstitution',
    category: 'How-To',
    readTime: '5 min read',
    author: 'Peptide Plus+ Research Team',
    date: 'December 25, 2025',
    content: `## Why Use a Peptide Calculator?\n\nProper reconstitution requires accurate calculations...`,
  },
};

export default function ArticlePageClient({ slug }: { slug: string }) {
  const { t } = useTranslations();
  const article = articlesContent[slug];

  if (!article) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-[#143C78] text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/learn"
            className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('learn.backToLearning')}
          </Link>
          <span className="inline-block px-3 py-1 bg-primary-500/20 text-primary-400 text-sm font-medium rounded-full mb-4">
            {article.category}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{article.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-neutral-400 text-sm">
            <span>{article.author}</span>
            <span>&bull;</span>
            <span>{article.date}</span>
            <span>&bull;</span>
            <span>{article.readTime}</span>
          </div>
        </div>
      </section>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <div
            className="prose prose-lg prose-gray max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600 prose-strong:text-gray-900 prose-code:bg-gray-100 prose-code:px-2 prose-code:py-0.5 prose-code:rounded prose-table:w-full prose-th:bg-gray-50 prose-th:p-3 prose-td:p-3 prose-td:border-t"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(
                article.content
                  .replace(/\n## /g, '\n<h2>')
                  .replace(/\n### /g, '\n<h3>')
                  .replace(/<h2>([^<]+)/g, '<h2>$1</h2>')
                  .replace(/<h3>([^<]+)/g, '<h3>$1</h3>')
                  .replace(/\n\n/g, '</p>\n<p>'),
                {
                  ALLOWED_TAGS: ['h2', 'h3', 'p', 'li', 'strong', 'em', 'ul', 'ol', 'a', 'br', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div'],
                  ALLOWED_ATTR: ['class', 'href', 'target', 'rel'],
                }
              ),
            }}
          />
        </div>

        {articleProductMap[slug] && articleProductMap[slug].length > 0 && (
          <div className="mt-8 p-6 bg-purple-50 border border-purple-100 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">
              {articleProductMap[slug].length === 1
                ? t('learn.interestedInPeptide')
                : t('learn.interestedInPeptides')}
            </h3>
            <div className="flex flex-wrap gap-3">
              {articleProductMap[slug].map((product) => (
                <Link
                  key={product.slug}
                  href={`/product/${product.slug}`}
                  className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium transition-colors"
                >
                  {t('learn.viewProduct', { name: product.name })}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12">
          <h3 className="text-xl font-bold text-gray-900 mb-6">{t('learn.continueLearning')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/learn/what-are-peptides" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <span className="text-xs text-primary-600 font-medium">{t('learn.education')}</span>
              <h4 className="font-semibold text-gray-900 mt-2">{t('learn.articles.whatArePeptides')}</h4>
            </Link>
            <Link href="/learn/peptide-storage-guide" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <span className="text-xs text-primary-600 font-medium">{t('learn.howTo')}</span>
              <h4 className="font-semibold text-gray-900 mt-2">{t('learn.articles.peptideStorageGuide')}</h4>
            </Link>
          </div>
        </div>

        <div className="mt-12 bg-primary-50 rounded-xl p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{t('learn.readyToStart')}</h3>
          <p className="text-gray-600 mb-6">{t('learn.browseCollection')}</p>
          <Link href="/shop" className="inline-flex items-center px-6 py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors">
            {t('learn.shopPeptides')}
          </Link>
        </div>
      </article>
    </div>
  );
}
