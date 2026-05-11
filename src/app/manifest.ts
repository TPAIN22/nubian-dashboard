import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'نوبيان | Nubian - منصة السودان الرقمية',
    short_name: 'نوبيان',
    description:
      'نوبيان (Nubian) - أفضل منصة رقمية في السودان. تسوق آلاف المنتجات الأصلية مع شحن سريع وآمن.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    lang: 'ar',
    dir: 'rtl',
    categories: ['shopping', 'business', 'lifestyle'],
    icons: [
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/nubi.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
