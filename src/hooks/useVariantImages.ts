/**
 * #8 Dynamic Variant Images
 * When user selects a product variant (format/size), show format-specific images.
 * Falls back to main product images if variant has no dedicated images.
 */

import { useState, useEffect, useCallback } from 'react';

interface VariantImage {
  url: string;
  alt: string;
  variantId?: string;
}

interface UseVariantImagesOptions {
  productId: string;
  productImages: string[];
  selectedVariantId?: string | null;
}

export function useVariantImages({
  productId,
  productImages,
  selectedVariantId,
}: UseVariantImagesOptions) {
  const [variantImages, setVariantImages] = useState<Map<string, VariantImage[]>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  // Fetch variant-specific images
  useEffect(() => {
    if (!selectedVariantId || variantImages.has(selectedVariantId)) return;

    const fetchVariantImages = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/products/${productId}/variant-images?variantId=${selectedVariantId}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.images?.length > 0) {
            setVariantImages(prev => {
              const next = new Map(prev);
              next.set(selectedVariantId, data.images);
              return next;
            });
          }
        }
      } catch {
        // Silently fall back to product images
      } finally {
        setIsLoading(false);
      }
    };

    fetchVariantImages();
  }, [productId, selectedVariantId, variantImages]);

  // Get current display images
  const getDisplayImages = useCallback((): string[] => {
    if (selectedVariantId && variantImages.has(selectedVariantId)) {
      return variantImages.get(selectedVariantId)!.map(img => img.url);
    }
    return productImages;
  }, [selectedVariantId, variantImages, productImages]);

  return {
    displayImages: getDisplayImages(),
    isLoading,
    hasVariantImages: selectedVariantId ? variantImages.has(selectedVariantId) : false,
  };
}
