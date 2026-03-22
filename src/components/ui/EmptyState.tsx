'use client';

/**
 * EmptyState — Composant réutilisable pour les pages/sections sans données
 *
 * Utilisé quand un nouveau tenant n'a pas encore de données.
 * Empêche les pages de crasher en affichant un état vide propre.
 */

interface EmptyStateProps {
  /** Icône ou emoji à afficher (optionnel) */
  icon?: string;
  /** Titre principal */
  title: string;
  /** Description secondaire */
  description?: string;
  /** Texte du bouton d'action (optionnel) */
  actionLabel?: string;
  /** URL du bouton d'action */
  actionHref?: string;
  /** Callback du bouton d'action (alternative à href) */
  onAction?: () => void;
  /** Taille du composant */
  size?: 'sm' | 'md' | 'lg';
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  size = 'md',
}: EmptyStateProps) {
  const sizeClasses = {
    sm: 'py-6',
    md: 'py-12',
    lg: 'py-20',
  };

  return (
    <div className={`flex flex-col items-center justify-center ${sizeClasses[size]} text-center px-4`}>
      {icon && (
        <div className="text-4xl mb-4">{icon}</div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-md mb-4">{description}</p>
      )}
      {actionLabel && (actionHref || onAction) && (
        actionHref ? (
          <a
            href={actionHref}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            {actionLabel}
          </a>
        ) : (
          <button
            onClick={onAction}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            {actionLabel}
          </button>
        )
      )}
    </div>
  );
}

/**
 * ErrorFallback — Composant pour les erreurs de chargement
 * Affiche un message d'erreur sans crasher l'application.
 */
export function ErrorFallback({
  title = 'Une erreur est survenue',
  description = 'Impossible de charger les données. Veuillez réessayer.',
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <span className="text-red-600 text-xl">!</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-md mb-4">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Réessayer
        </button>
      )}
    </div>
  );
}

/**
 * MaintenanceMode — Affiché quand un tenant est suspendu
 */
export function MaintenanceMode({
  tenantName,
}: {
  tenantName?: string;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md px-4">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-yellow-600 text-2xl">&#9888;</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {tenantName ? `${tenantName} — Maintenance` : 'Site en maintenance'}
        </h1>
        <p className="text-gray-500">
          Ce site est temporairement indisponible. Veuillez réessayer plus tard.
        </p>
      </div>
    </div>
  );
}
