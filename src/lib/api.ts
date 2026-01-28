import axios from "axios";
import { ProductDTO, Cart, Order, AddToCartRequest, UpdateCartItemRequest, RemoveFromCartRequest, CreateOrderRequest } from "@/types/shop";

// Base URL from env or default to local backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add Clerk Token
api.interceptors.request.use(async (config) => {
  // Check if Clerk is loaded on the client window object
  const clerk = (window as any).Clerk;
  if (clerk && clerk.session) {
    const token = await clerk.session.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// --- API Methods ---

export const shopApi = {
  // Products
  getProducts: async (params?: any) => {
    // Backend API route: /api/products (from index.js: app.use('/api/products', productRoutes))
    const res = await api.get<{ data: ProductDTO[]; pagination: any }>("/products", { params });
    return res.data;
  },
  getProduct: async (id: string) => {
    const res = await api.get<{ data: ProductDTO }>(`/products/${id}`);
    return res.data.data;
  },

  // Categories
  getCategories: async () => {
    const res = await api.get<any[]>("/categories");
    return res.data;
  },
  getCategory: async (id: string) => {
    const res = await api.get<any>(`/categories/${id}`);
    return res.data;
  },

  // Stores (Merchants)
  getStores: async (params?: any) => {
    const res = await api.get<{ data: any[]; pagination: any }>("/merchants/list", { params });
    return res.data;
  },
  getStore: async (id: string) => {
    const res = await api.get<{ data: any }>(`/merchants/store/${id}`);
    return res.data.data;
  },
  getStoreProducts: async (id: string, params?: any) => {
     const res = await api.get<{ data: ProductDTO[]; pagination: any }>(`/merchants/store/${id}/products`, { params });
     return res.data;
  },

  // Cart
  getCart: async () => {
    // Backend API route: /api/carts
    const res = await api.get<{ data: Cart }>("/carts");
    return res.data.data;
  },
  addToCart: async (payload: AddToCartRequest) => {
    const res = await api.post<{ data: Cart }>("/carts/add", payload);
    return res.data.data;
  },
  updateCartItem: async (payload: UpdateCartItemRequest) => {
    const res = await api.put<{ data: Cart }>("/carts/update", payload);
    return res.data.data;
  },
  removeFromCart: async (payload: RemoveFromCartRequest) => {
    const res = await api.post<{ data: Cart }>("/carts/remove", payload);
    return res.data.data;
  },

  // Orders
  createOrder: async (data: any) => {
    const res = await api.post<any>("/orders", data);
    return res.data;
  },
  getOrders: async () => {
    const res = await api.get<Order[]>("/orders/my-orders");
    return res.data;
  },
  getOrder: async (id: string) => {
    const res = await api.get<any>(`/orders/${id}`);
    return res.data;
  },

  // Addresses
  getAddresses: async () => {
    const res = await api.get<any>("/addresses");
    return res.data;
  },
  
  addAddress: async (data: any) => {
    const res = await api.post<any>("/addresses", data);
    return res.data;
  },

  // Upload (ImageKit)
  getImageKitAuth: async () => {
     const res = await api.get<any>("/upload/imagekit-auth");
     return res.data;
  },

  // Locations
  getCountries: async () => {
    const res = await api.get<any>("/locations/countries?active=true");
    return res.data.data || [];
  },
  
  getCities: async (countryId: string) => {
    const res = await api.get<any>(`/locations/countries/${countryId}/cities?active=true`);
    return res.data.data || [];
  },

  getSubCities: async (cityId: string) => {
    const res = await api.get<any>(`/locations/cities/${cityId}/subcities?active=true`);
    return res.data.data || [];
  },
};
