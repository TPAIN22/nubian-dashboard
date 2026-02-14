import { api } from "./api";

export interface TicketStats {
    openTickets: number;
    highRisk: number;
    activeDisputes: number;
    overdue: number;
}

export const adminApi = {
    getTickets: async (params?: any) => {
        const res = await api.get<{ data: any[], pagination: any }>("/tickets", { params });
        return res.data;
    },

    getTicket: async (id: string) => {
        const res = await api.get<{ data: any }>(`/tickets/${id}`);
        return res.data.data;
    },

    getStats: async () => {
        const res = await api.get<{ data: TicketStats }>("/tickets/stats");
        return res.data.data;
    },

    updateTicketStatus: async (id: string, status: string, adminNotes?: string) => {
        const res = await api.patch<{ data: any }>(`/tickets/${id}/status`, { status, adminNotes });
        return res.data.data;
    },

    addMessage: async (id: string, message: string, attachments?: string[]) => {
        const res = await api.post<{ data: any }>(`/tickets/${id}/messages`, { message, attachments });
        return res.data.data;
    },

    // Risk & Dispute Actions
    resolveDispute: async (disputeId: string, resolution: 'refund_full' | 'refund_partial' | 'rejected', approvedAmount?: number, adminNote?: string) => {
        const res = await api.post<{ data: any }>(`/disputes/${disputeId}/resolve`, { resolution, approvedAmount, adminNote });
        return res.data.data;
    },

    // Not implemented yet on backend but adding to client interface for future
    freezeMerchant: async (merchantId: string) => {
        // const res = await api.post(`/merchants/${merchantId}/freeze`);
        // return res.data;
        console.warn("Freeze Merchant API not implemented yet");
        return { success: true };
    },

    suspendProduct: async (productId: string) => {
        // const res = await api.post(`/products/${productId}/suspend`);
        // return res.data;
        console.warn("Suspend Product API not implemented yet");
        return { success: true };
    }
};
