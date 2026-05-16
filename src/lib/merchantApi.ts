import { api } from "./api";

export const merchantSupportApi = {
    getTickets: async (params?: any) => {
        const res = await api.get<{ data: any[]; pagination: any }>("/tickets", { params });
        return res.data;
    },

    getTicket: async (id: string) => {
        const res = await api.get<{ data: any }>(`/tickets/${id}`);
        return res.data.data;
    },

    addMessage: async (id: string, message: string, attachments?: string[]) => {
        const res = await api.post<{ data: any }>(`/tickets/${id}/messages`, { message, attachments });
        return res.data.data;
    },

    createTicket: async (payload: {
        type: "support" | "complaint" | "legal";
        category: string;
        subject: string;
        description: string;
        relatedOrderId?: string;
        priority?: "low" | "medium" | "high";
        attachments?: string[];
    }) => {
        const res = await api.post<{ data: any }>("/tickets", payload);
        return res.data.data;
    },
};
