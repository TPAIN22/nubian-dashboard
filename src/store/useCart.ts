import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, ProductDTO, SelectedAttributes } from '@/types/shop';
import { resolvePrice } from '@/lib/pricing';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  
  // Actions
  addItem: (product: ProductDTO, quantity: number, size?: string, attributes?: SelectedAttributes) => void;
  removeItem: (productId: string, size?: string, attributes?: SelectedAttributes) => void;
  updateQuantity: (productId: string, quantity: number, size?: string, attributes?: SelectedAttributes) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setOpen: (open: boolean) => void;
  
  // Computed (helper getters)
  getTotalItems: () => number;
  getSubtotal: () => number;
}

// Helper to generate a unique ID for cart items based on product/variants
const generateItemId = (productId: string, size?: string, attributes?: SelectedAttributes) => {
  const sizeKey = size ? `|size:${size}` : '';
  const attrKey = attributes 
    ? Object.entries(attributes).sort().map(([k, v]) => `|${k}:${v}`).join('') 
    : '';
  return `${productId}${sizeKey}${attrKey}`;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, quantity, size, attributes) => {
        set((state) => {
          const itemId = generateItemId(product._id, size, attributes);
          const existingItemIndex = state.items.findIndex(
            (item) => generateItemId(item.product._id, item.size, item.attributes) === itemId
          );

          if (existingItemIndex > -1) {
            // Update existing item quantity
            const newItems = [...state.items];
            newItems[existingItemIndex].quantity += quantity;
            return { items: newItems };
          }

          // Add new item
          return {
            items: [
              ...state.items,
              {
                product,
                quantity,
                size,
                attributes,
                _id: itemId, // Temporary local ID
              },
            ],
          };
        });
        
        // Open cart on add user feedback
        set({ isOpen: true });
      },

      removeItem: (productId, size, attributes) => {
        const targetId = generateItemId(productId, size, attributes);
        set((state) => ({
          items: state.items.filter(
            (item) => generateItemId(item.product._id, item.size, item.attributes) !== targetId
          ),
        }));
      },

      updateQuantity: (productId, quantity, size, attributes) => {
        const targetId = generateItemId(productId, size, attributes);
        set((state) => ({
          items: state.items.map((item) => {
            if (generateItemId(item.product._id, item.size, item.attributes) === targetId) {
              const newQuantity = Math.max(0, quantity);
              return { ...item, quantity: newQuantity };
            }
            return item;
          }).filter(item => item.quantity > 0), // Remove if 0
        }));
      },

      clearCart: () => set({ items: [] }),
      
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      setOpen: (open) => set({ isOpen: open }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => {
           // Use the centralized pricing engine to ensure consistency
           // We need to match the logic: if variant selected, use it.
           // However, CartItem stores 'size' and 'attributes'. 
           
           // We need to find the variant object to pass to resolvePrice if we want exact match.
           // But CartItem only has product and quantity. 
           // Ideally CartItem should store the 'price' at time of add, 
           // BUT for a dynamic cart we might want real-time price.
           
           // Let's try to find the variant from product.variants based on item.attributes
           let selectedVariant;
           if (item.product.variants && item.attributes) {
              selectedVariant = item.product.variants.find(v => 
                  Object.entries(item.attributes || {}).every(([key, val]) => v.attributes?.[key] === val)
              );
           }
           
           // If we have a 'size' but no attributes map (legacy), try to match by size attribute?
           // The current shop implementation uses 'attributes' map. 'size' in CartItem might be redundant or fallback.
           
           const { final } = resolvePrice({ 
               product: item.product,
               selectedVariant 
           });
           
           return total + (final * item.quantity);
        }, 0);
      },
    }),
    {
      name: 'nubian-cart-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist items, not UI state like isOpen
      partialize: (state) => ({ items: state.items }),
    }
  )
);
