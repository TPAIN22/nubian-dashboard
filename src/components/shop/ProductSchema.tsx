import { ProductDTO } from "@/types/shop";

const baseUrl = "https://nubian-sd.store";

interface ProductSchemaProps {
    product: ProductDTO;
}

/**
 * Product structured data component for SEO rich snippets
 * Implements schema.org Product markup for Google Search
 */
export default function ProductSchema({ product }: ProductSchemaProps) {
    // Resolve price (prefer finalPrice > discountPrice > price)
    const price = product.finalPrice || product.discountPrice || product.price || 0;
    const hasDiscount = product.discountPrice && product.price && product.discountPrice < product.price;

    const schema: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.name,
        "description": product.description,
        "image": product.images || [],
        "sku": product._id,
        "productID": product._id,
        "brand": {
            "@type": "Brand",
            "name": "Nubian"
        },
        "offers": {
            "@type": "Offer",
            "url": `${baseUrl}/shop/product/${product._id}`,
            "priceCurrency": "SDG",
            "price": price,
            "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
            "availability": (product.stock || 0) > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            "itemCondition": "https://schema.org/NewCondition",
            "seller": {
                "@type": "Organization",
                "name": "Nubian",
                "url": baseUrl
            }
        }
    };

    // Add category if available
    if (product.category && typeof product.category === 'object' && 'name' in product.category) {
        schema["category"] = product.category.name;
    }

    // Add aggregate rating if available
    if (product.averageRating && product.averageRating > 0) {
        schema["aggregateRating"] = {
            "@type": "AggregateRating",
            "ratingValue": product.averageRating,
            "reviewCount": product.reviews?.length || 1,
            "bestRating": 5,
            "worstRating": 1
        };
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}
