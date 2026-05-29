import Image, { type ImageProps } from 'next/image';

type Props = Omit<ImageProps, 'alt'> & {
  alt: string;
  fallbackBg?: string;
};

/**
 * next/image wrapper.
 *
 * IMPORTANT: locally-hosted `/uploads/*` files are served by nginx, NOT by the
 * Next.js standalone server. The Next image optimizer runs INSIDE the app
 * container and tries to fetch the source over http://localhost:4310/uploads/...
 * which the app doesn't serve → 400 "not a valid image". So we bypass the
 * optimizer for `/uploads/` (already reasonably sized + nginx caches 30d immutable)
 * and only optimize remote/CDN images.
 */
export function OptimizedImage({ alt, fallbackBg = 'var(--color-cream-deep)', style, src, ...rest }: Props) {
  const isLocalUpload = typeof src === 'string' && src.startsWith('/uploads/');
  return (
    <Image
      src={src}
      alt={alt}
      unoptimized={isLocalUpload || rest.unoptimized}
      style={{ background: fallbackBg, ...style }}
      {...rest}
    />
  );
}
