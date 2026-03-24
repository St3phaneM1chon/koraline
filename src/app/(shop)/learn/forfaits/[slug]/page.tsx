'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Package, BookOpen, Clock, CheckCircle, Lock, ShieldCheck } from 'lucide-react';

interface BundleDetail {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number | null;
  corporatePrice: number | null;
  courseCount: number;
  items: Array<{
    course: {
      id: string; title: string; slug: string; subtitle: string | null;
      thumbnailUrl: string | null; estimatedHours: number | null; level: string;
      price: number | null; enrollmentCount: number; averageRating: number | null; passingScore: number;
      chapters: Array<{ id: string; title: string; _count: { lessons: number } }>;
    };
  }>;
  pricing: { price: number; originalPrice: number; discount: number; isCorporate: boolean };
}

export default function BundleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [bundle, setBundle] = useState<BundleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetch(`/api/lms/bundles/${slug}`)
      .then(r => r.json())
      .then(d => setBundle(d.data ?? null))
      .catch(() => setBundle(null))
      .finally(() => setLoading(false));
  }, [slug]);

  const handlePurchase = async () => {
    if (!bundle) return;
    setPurchasing(true);
    try {
      const res = await fetch('/api/lms/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'bundle', id: bundle.id }),
      });
      const data = await res.json();
      if (data.data?.enrolled) {
        router.push('/learn/dashboard');
      }
      // TODO: redirect to Stripe checkout when integrated
    } catch { /* handled */ }
    finally { setPurchasing(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Chargement...</div>;
  if (!bundle) return <div className="min-h-screen flex items-center justify-center text-destructive">Forfait non trouve</div>;

  const totalLessons = bundle.items.reduce((sum, item) =>
    sum + item.course.chapters.reduce((s, ch) => s + ch._count.lessons, 0), 0);
  const totalHours = bundle.items.reduce((sum, item) => sum + Number(item.course.estimatedHours ?? 0), 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="p-3 rounded-xl bg-primary/10">
          <Package className="h-8 w-8 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{bundle.name}</h1>
          {bundle.description && <p className="text-muted-foreground mt-2">{bundle.description}</p>}
          <div className="flex items-center gap-6 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" /> {bundle.courseCount} cours</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {totalHours} heures</span>
            <span>{totalLessons} lecons</span>
          </div>
        </div>
      </div>

      {/* Pricing card */}
      <div className="rounded-xl border p-6 mb-8 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            {bundle.pricing.isCorporate && (
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">Parraine par votre employeur</span>
              </div>
            )}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold">{bundle.pricing.price.toFixed(0)} $</span>
              {bundle.pricing.discount > 0 && (
                <span className="text-lg text-muted-foreground line-through">{bundle.pricing.originalPrice.toFixed(0)} $</span>
              )}
            </div>
            {bundle.pricing.discount > 0 && (
              <p className="text-sm text-green-600 mt-1">Vous economisez {bundle.pricing.discount.toFixed(0)} $</p>
            )}
          </div>
          <button
            onClick={handlePurchase}
            disabled={purchasing}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {purchasing ? 'En cours...' : bundle.pricing.price === 0 ? "S'inscrire gratuitement" : 'Acheter le forfait'}
          </button>
        </div>
      </div>

      {/* Course list */}
      <h2 className="text-xl font-semibold mb-4">Cours inclus dans ce forfait</h2>
      <div className="space-y-4">
        {bundle.items.map((item, i) => {
          const course = item.course;
          const lessonCount = course.chapters.reduce((s, ch) => s + ch._count.lessons, 0);
          return (
            <div key={course.id} className="rounded-lg border p-4 hover:border-primary/30 transition-colors">
              <div className="flex items-start gap-4">
                <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">{i + 1}</span>
                <div className="flex-1">
                  <h3 className="font-semibold">{course.title}</h3>
                  {course.subtitle && <p className="text-sm text-muted-foreground mt-1">{course.subtitle}</p>}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{course.chapters.length} chapitres</span>
                    <span>{lessonCount} lecons</span>
                    {course.estimatedHours && <span>{Number(course.estimatedHours)}h</span>}
                    <span className="capitalize">{course.level.toLowerCase()}</span>
                    <span>Score requis: {course.passingScore}%</span>
                  </div>
                  {/* Chapter list */}
                  <div className="mt-3 space-y-1">
                    {course.chapters.map(ch => (
                      <div key={ch.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-3.5 w-3.5 text-muted-foreground/50" />
                        <span>{ch.title}</span>
                        <span className="text-xs">({ch._count.lessons} lecons)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sequential completion notice */}
      <div className="mt-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4">
        <div className="flex items-start gap-3">
          <Lock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-800 dark:text-amber-200">Completion sequentielle obligatoire</h4>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Chaque notion doit etre completee dans l&apos;ordre avant de pouvoir passer a la suivante.
              L&apos;examen de qualification n&apos;est accessible qu&apos;apres avoir termine 100% du contenu du cours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
