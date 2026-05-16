"use client";

import { use, useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, MessageCircle, Loader2, ArrowRight, Package } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Link from "next/link";
import { merchantSupportApi } from "@/lib/merchantApi";

export default function MerchantTicketDetails({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { isLoaded } = useAuth();

    const [ticket, setTicket] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [replyText, setReplyText] = useState("");
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        const fetchTicket = async () => {
            setIsLoading(true);
            try {
                const data = await merchantSupportApi.getTicket(id);
                setTicket(data);
            } catch (error) {
                console.error(error);
                toast.error("خطأ في تحميل بيانات التذكرة");
            } finally {
                setIsLoading(false);
            }
        };

        if (isLoaded) {
            fetchTicket();
        }
    }, [isLoaded, id]);

    const handleSendReply = async () => {
        if (!replyText.trim()) return;
        setIsSending(true);
        try {
            const newMessage = await merchantSupportApi.addMessage(id, replyText);
            setTicket((prev: any) => ({
                ...prev,
                messages: [...(prev?.messages || []), newMessage],
            }));
            setReplyText("");
            toast.success("تم إرسال الرد");
        } catch (error) {
            console.error(error);
            toast.error("فشل إرسال الرد");
        } finally {
            setIsSending(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground font-medium">جاري تحميل التذكرة...</p>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center" dir="rtl">
                <h2 className="text-2xl font-bold mb-4">التذكرة غير موجودة</h2>
                <Link href="/merchant/support">
                    <Button variant="outline"><ArrowRight className="ml-2 h-4 w-4" /> العودة للقائمة</Button>
                </Link>
            </div>
        );
    }

    const customerName = ticket.userId?.fullName || "—";
    const orderNumber = ticket.relatedOrderId?.orderNumber;
    const orderAmount = ticket.relatedOrderId?.totalAmount;
    const status = ticket.status || "";

    return (
        <div className="p-6 bg-gray-50 min-h-screen" dir="rtl">
            <div className="flex justify-between items-start mb-6 gap-4 flex-wrap">
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-2xl font-bold text-gray-900">{ticket.subject}</h1>
                        <Badge
                            variant="outline"
                            className={
                                status === 'escalated' ? 'text-destructive border-destructive font-medium' :
                                    status === 'open' ? 'text-blue-700 border-blue-200 font-medium' :
                                        status === 'resolved_refund' ? 'text-green-700 border-green-200 font-medium' :
                                            'text-gray-700 font-medium'
                            }
                        >
                            <span className="capitalize">{status?.replace('_', ' ') || "—"}</span>
                        </Badge>
                    </div>
                    <p className="text-gray-500 mt-1">
                        تذكرة #{ticket.ticketNumber} • تم الإنشاء في {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString("ar-EG") : "—"}
                    </p>
                </div>
                <Link href="/merchant/support">
                    <Button variant="outline" size="sm"><ArrowRight className="ml-2 h-4 w-4" /> العودة للقائمة</Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>الوصف</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-700 whitespace-pre-line">{ticket.description}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageCircle size={20} /> المحادثة
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 mb-6 max-h-[500px] overflow-y-auto p-2">
                                <div className="bg-muted p-4 rounded-lg rounded-tl-none max-w-[85%] border border-border mr-auto">
                                    <p className="text-xs font-bold text-primary mb-1">{customerName} (العميل)</p>
                                    <p className="text-sm text-foreground">{ticket.description}</p>
                                    <p className="text-[10px] text-muted-foreground mt-2 text-left">
                                        {ticket.createdAt ? new Date(ticket.createdAt).toLocaleTimeString("ar-EG") : ""}
                                    </p>
                                </div>

                                {ticket.messages?.map((msg: any, i: number) => {
                                    const isMerchant = msg.senderRole === 'merchant';
                                    return (
                                        <div
                                            key={msg._id || i}
                                            className={`p-4 rounded-lg max-w-[85%] border ${
                                                isMerchant
                                                    ? 'bg-blue-500/10 border-blue-500/20 ml-auto rounded-tr-none'
                                                    : 'bg-muted border-border mr-auto rounded-tl-none'
                                            }`}
                                        >
                                            <p className={`text-xs font-bold mb-1 ${isMerchant ? 'text-blue-600' : 'text-primary'}`}>
                                                {msg.senderId?.fullName || msg.senderRole} {isMerchant ? '(أنت)' : ''}
                                            </p>
                                            <p className="text-sm text-foreground whitespace-pre-line">{msg.message}</p>
                                            <p className="text-[10px] text-muted-foreground mt-2 text-left">
                                                {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString("ar-EG") : ""}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex gap-2 border-t pt-4">
                                <Textarea
                                    placeholder="اكتب ردك هنا..."
                                    className="text-right resize-none min-h-[100px]"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                />
                                <Button
                                    className="self-end px-8 py-6"
                                    onClick={handleSendReply}
                                    disabled={isSending || !replyText.trim()}
                                >
                                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : "إرسال"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package size={18} /> معلومات الطلب
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">رقم الطلب</span>
                                    <span className="font-mono">{orderNumber || "—"}</span>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex justify-between">
                                    <span className="text-gray-500">قيمة الطلب</span>
                                    <span className="font-semibold">
                                        {typeof orderAmount === "number" ? `$${orderAmount.toFixed(2)}` : "—"}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User size={18} /> بيانات العميل
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">الاسم</span>
                                    <span>{customerName}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
