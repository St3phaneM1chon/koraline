'use client';

import type { VideoSection as VideoSectionType } from '@/lib/homepage-sections';

/**
 * Converts a YouTube/Vimeo watch URL to an embed URL.
 * Passes through URLs that are already embed-ready.
 */
function toEmbedUrl(url: string): string {
  // YouTube: https://www.youtube.com/watch?v=XXX → https://www.youtube.com/embed/XXX
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  // Vimeo: https://vimeo.com/123456 → https://player.vimeo.com/video/123456
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return url; // already an embed URL or unsupported
}

export function VideoRenderer({ section }: { section: VideoSectionType }) {
  const embedUrl = toEmbedUrl(section.videoUrl);
  const aspect = section.aspectRatio === '4:3' ? 'aspect-[4/3]' : 'aspect-video';

  return (
    <div>
      {section.title && (
        <h2
          className="text-2xl font-bold mb-6 text-center"
          style={{ color: 'var(--k-text-primary, rgba(255,255,255,0.95))' }}
        >
          {section.title}
        </h2>
      )}
      <div
        className={`relative w-full ${aspect} rounded-2xl overflow-hidden`}
        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <iframe
          src={embedUrl}
          title={section.title || 'Video'}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </div>
  );
}
