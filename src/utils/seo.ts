import { Product, StoreSettings, OFFICIAL_CATEGORIES } from '../types/store';

export const CANONICAL_ORIGIN = 'https://dulzara.vercel.app';

export const HOME_SEO = {
  title: 'Dulzara | Maquillaje, belleza y cuidado personal en Barranquilla',
  description:
    'Descubre Dulzara, tu tienda de maquillaje, productos de belleza y cuidado personal en Barranquilla con envíos a toda Colombia. Explora nuestro catálogo y realiza tus pedidos fácilmente por WhatsApp.',
};

export interface CategorySeoMeta {
  category: string;
  slug: string;
  title: string;
  description: string;
  subtitle: string;
}

export const CATEGORY_SEO_MAP: Record<string, CategorySeoMeta> = {
  Rostro: {
    category: 'Rostro',
    slug: 'rostro',
    title: 'Maquillaje para el Rostro en Barranquilla | Dulzara Colombia',
    description:
      'Compra iluminadores, polvos compactos y maquillaje para el rostro en Dulzara Barranquilla. Texturas ligeras para todo tipo de piel con envíos a toda Colombia.',
    subtitle:
      'Fórmulas sedosas y acabado natural para realzar la luminosidad de tu piel todos los días.',
  },
  'Ojos y Cejas': {
    category: 'Ojos y Cejas',
    slug: 'ojos-y-cejas',
    title: 'Paletas de Sombras, Ojos y Cejas | Dulzara Barranquilla',
    description:
      'Encuentra paletas de sombras de alta pigmentación y productos para ojos y cejas en Dulzara, tu tienda de maquillaje en Barranquilla con envíos a toda Colombia.',
    subtitle:
      'Tonos versátiles, pigmentos suaves y fijación duradera para miradas expresivas.',
  },
  Labios: {
    category: 'Labios',
    slug: 'labios',
    title: 'Labiales Mate y Lip Gloss Hidratantes | Dulzara Barranquilla',
    description:
      'Descubre labiales mate aterciopelados y lip gloss con aceites botánicos en Dulzara Barranquilla. Compra maquillaje online en Colombia y pide fácil por WhatsApp.',
    subtitle:
      'Colores intensos, brillo espejo y nutrición con manteca de karité y aceites naturales.',
  },
  'Skincare y Cuidado': {
    category: 'Skincare y Cuidado',
    slug: 'skincare-y-cuidado',
    title: 'Skincare y Productos de Cuidado Personal | Dulzara Barranquilla',
    description:
      'Cuida tu piel con sueros de niacinamida, cremas hidratantes, tónicos de rosas y mantecas corporales en Dulzara. Productos de belleza y cuidado personal en Barranquilla.',
    subtitle:
      'Rutinas de hidratación y cuidado personal con extractos botánicos para una piel radiante.',
  },
  'Kits y Accesorios': {
    category: 'Kits y Accesorios',
    slug: 'kits-y-accesorios',
    title: 'Brochas de Maquillaje, Kits y Accesorios | Dulzara Barranquilla',
    description:
      'Complementa tu rutina con sets de brochas profesionales y accesorios de belleza en Dulzara Barranquilla. Envíos seguros a toda Colombia y atención por WhatsApp.',
    subtitle:
      'Herramientas suaves y estuches prácticos para aplicar tu maquillaje con acabado profesional.',
  },
};

export function toSlug(text: string): string {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function getProductSlug(product: Product): string {
  if (product.slug && product.slug.trim().length > 0) {
    return toSlug(product.slug);
  }
  return toSlug(product.name) || product.id;
}

export function getCategorySlug(category: string): string {
  return CATEGORY_SEO_MAP[category]?.slug || toSlug(category);
}

export function findCategoryBySlug(slug: string): string | null {
  const clean = toSlug(slug);
  for (const cat of OFFICIAL_CATEGORIES) {
    if (getCategorySlug(cat) === clean) {
      return cat;
    }
  }
  return null;
}

export function findProductBySlug(slug: string, products: Product[]): Product | null {
  const clean = toSlug(slug);
  if (!clean) return null;
  return (
    products.find(
      (p) => getProductSlug(p) === clean || toSlug(p.name) === clean || p.id.toLowerCase() === clean
    ) || null
  );
}

export function parseStorePath(
  pathname: string,
  products: Product[]
): { product: Product | null; category: string | null } {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  const parts = cleanPath.split('/').filter(Boolean);

  if (parts.length >= 2 && (parts[0] === 'productos' || parts[0] === 'producto')) {
    const productSlug = decodeURIComponent(parts[1]);
    const matchedProduct = findProductBySlug(productSlug, products);
    return {
      product: matchedProduct,
      category: matchedProduct ? matchedProduct.category : null,
    };
  }

  if (parts.length >= 2 && (parts[0] === 'categoria' || parts[0] === 'categorias')) {
    const categorySlug = decodeURIComponent(parts[1]);
    const matchedCategory = findCategoryBySlug(categorySlug);
    return {
      product: null,
      category: matchedCategory,
    };
  }

  return { product: null, category: null };
}

function setMetaTag(attrName: 'name' | 'property', attrValue: string, content: string) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonicalUrl(url: string) {
  if (typeof document === 'undefined') return;
  let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

function buildProductSchemaObject(product: Product) {
  const slug = getProductSlug(product);
  const productUrl = `${CANONICAL_ORIGIN}/productos/${slug}`;
  const isAvailable = (Number(product.stock) || 0) > 0;
  const imageUrl =
    product.imageUrl && product.imageUrl.startsWith('http')
      ? product.imageUrl
      : `${CANONICAL_ORIGIN}/favicon-512x512.png`;

  return {
    '@type': 'Product',
    '@id': `${productUrl}#product`,
    name: product.name,
    description: product.description || product.shortDescription,
    sku: product.id,
    category: product.category,
    image: [imageUrl],
    url: productUrl,
    brand: {
      '@type': 'Brand',
      name: 'Dulzara',
    },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'COP',
      price: String(Math.max(0, Math.round(Number(product.price) || 0))),
      availability: isAvailable
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: 'Dulzara',
      },
    },
  };
}

export function updatePageSEO(params: {
  selectedProduct: Product | null;
  activeCategory: string | null;
  products: Product[];
  settings: StoreSettings;
}) {
  if (typeof document === 'undefined') return;
  const { selectedProduct, activeCategory, products, settings } = params;

  let title = HOME_SEO.title;
  let description = HOME_SEO.description;
  let canonicalPath = '/';

  if (selectedProduct) {
    const slug = getProductSlug(selectedProduct);
    canonicalPath = `/productos/${slug}`;
    title = `${selectedProduct.name} | Dulzara Barranquilla`;
    const rawDesc =
      selectedProduct.shortDescription && selectedProduct.description
        ? `${selectedProduct.shortDescription} ${selectedProduct.description}`
        : selectedProduct.description || selectedProduct.shortDescription || HOME_SEO.description;
    description =
      rawDesc.length > 158 ? `${rawDesc.slice(0, 155).trim()}...` : rawDesc;
  } else if (activeCategory && CATEGORY_SEO_MAP[activeCategory]) {
    const catMeta = CATEGORY_SEO_MAP[activeCategory];
    canonicalPath = `/categoria/${catMeta.slug}`;
    title = catMeta.title;
    description = catMeta.description;
  }

  const canonicalUrl = `${CANONICAL_ORIGIN}${canonicalPath}`;

  document.title = title;
  setMetaTag('name', 'description', description);
  setMetaTag('property', 'og:title', title);
  setMetaTag('property', 'og:description', description);
  setMetaTag('property', 'og:url', canonicalUrl);
  setMetaTag('property', 'og:site_name', 'Dulzara');
  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:title', title);
  setMetaTag('name', 'twitter:description', description);
  setCanonicalUrl(canonicalUrl);

  // Build Schema.org JSON-LD (Store + Product/Offer or ItemList, strictly without fake ratings/reviews)
  const storeGraphNode = {
    '@type': 'OnlineStore',
    '@id': `${CANONICAL_ORIGIN}/#store`,
    name: 'Dulzara',
    alternateName: 'Dulzara Belleza y Cuidado Personal',
    url: `${CANONICAL_ORIGIN}/`,
    description: HOME_SEO.description,
    currenciesAccepted: 'COP',
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Barranquilla',
      addressRegion: 'Atlántico',
      addressCountry: 'CO',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Colombia',
    },
    sameAs: settings.instagramHandle
      ? [`https://instagram.com/${settings.instagramHandle.replace('@', '').trim()}`]
      : ['https://instagram.com/dulzara_bq'],
  };

  const graph: unknown[] = [storeGraphNode];

  if (selectedProduct) {
    graph.push({
      '@context': 'https://schema.org',
      ...buildProductSchemaObject(selectedProduct),
    });
  } else if (products.length > 0) {
    const listProducts = activeCategory
      ? products.filter((p) => p.category === activeCategory)
      : products;

    graph.push({
      '@type': 'ItemList',
      name: activeCategory
        ? `Catálogo de ${activeCategory} - Dulzara Barranquilla`
        : 'Catálogo Oficial Dulzara - Maquillaje y Cuidado Personal',
      url: canonicalUrl,
      numberOfItems: listProducts.length,
      itemListElement: listProducts.slice(0, 24).map((prod, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `${CANONICAL_ORIGIN}/productos/${getProductSlug(prod)}`,
        item: buildProductSchemaObject(prod),
      })),
    });
  }

  const jsonLdPayload = {
    '@context': 'https://schema.org',
    '@graph': graph,
  };

  let scriptEl = document.getElementById('dulzara-schema-jsonld') as HTMLScriptElement | null;
  if (!scriptEl) {
    scriptEl = document.createElement('script');
    scriptEl.id = 'dulzara-schema-jsonld';
    scriptEl.type = 'application/ld+json';
    document.head.appendChild(scriptEl);
  }
  scriptEl.textContent = JSON.stringify(jsonLdPayload);
}
