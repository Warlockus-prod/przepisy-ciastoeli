import Image, { type ImageProps } from 'next/image';

type Props = Omit<ImageProps, 'alt'> & {
  alt: string;
  fallbackBg?: string;
};

export function OptimizedImage({ alt, fallbackBg = 'var(--color-cream-deep)', style, ...rest }: Props) {
  return (
    <Image
      alt={alt}
      style={{ background: fallbackBg, ...style }}
      {...rest}
    />
  );
}
