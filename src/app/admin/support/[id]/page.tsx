"use client";

import { use, useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, User, MessageCircle, DollarSign, Ban, ShieldAlert, Loader2, ArrowRight } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Link from "next/link";
import { adminApi } from "@/lib/adminApi";

export default function TicketDetails({ params }: { params: Promise<{ id: string }> }) {
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
                const data = await adminApi.getTicket(id);
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

    const handleUpdateStatus = async (status: string) => {
        try {
            const updated = await adminApi.updateTicketStatus(id, status);
            setTicket((prev: any) => ({ ...prev, ...updated }));
            toast.success("تم تحديث الحالة بنجاح");
        } catch (error) {
            toast.error("فشل تحديث الحالة");
        }
    };

    const handleSendReply = async () => {
        if (!replyText.trim()) return;
        setIsSending(true);
        try {
            const newMessage = await adminApi.addMessage(id, replyText);
            setTicket((prev: any) => ({
                ...prev,
                messages: [...(prev?.messages || []), newMessage]
            }));
            setReplyText("");
            toast.success("تم إرسال الرد");
        } catch (error) {
            toast.error("فشل إرسال الرد");
        } finally {
            setIsSending(false);
        }
    };

    const handleResolveDispute = async (resolution: 'refund_full' | 'rejected') => {
        if (!ticket?.dispute?._id) {
            toast.error("لا يوجد نزاع مرتبط بهذه التذكرة");
            return;
        }
        try {
            await adminApi.resolveDispute(ticket.dispute._id, resolution);
            toast.success(resolution === 'refund_full' ? "تم إصدار الاسترداد" : "تم رفض النزاع");
            const refreshed = await adminApi.getTicket(id);
            setTicket(refreshed);
        } catch (error) {
            toast.error("فشل تنفيذ الإجراء");
        }
    };

    const handleFreezeMerchant = async () => {
        try {
            const merchantId = ticket?.merchantId?._id || ticket?.merchantId;
            await adminApi.freezeMerchant(merchantId);
            toast.success("تم تجميد رصيد التاجر");
        } catch (error) {
            toast.error("فشل تجميد رصيد التاجر");
        }
    };

    const handleSuspendProduct = async () => {
        try {
            const productId = ticket?.productId?._id || ticket?.productId;
            await adminApi.suspendProduct(productId);
            toast.success("تم تعليق المنتج");
        } catch (error) {
            toast.error("فشل تعليق المنتج");
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
            <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
                <h2 className="text-2xl font-bold mb-4">التذكرة غير موجودة</h2>
                <Link href="/admin/support">
                    <Button variant="outline"><ArrowRight className="ml-2 h-4 w-4" /> العودة للقائمة</Button>
                </Link>
            </div>
        );
    }

    const ownerName = ticket.userId?.fullName || "—";
    const ownerEmail = ticket.userId?.emailAddress || "—";
    const orderNumber = ticket.relatedOrderId?.orderNumber;
    const orderAmount = ticket.relatedOrderId?.totalAmount;

    return (
        <div className="p-6 bg-background min-h-screen" dir="rtl">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-foreground">{ticket.subject}</h1>
                        <Badge variant="outline" className="text-destructive border-destructive flex gap-1">
                            <ShieldAlert size={12} /> مخاطر عالية ({ticket.riskScore})
                        </Badge>
                    </div>
                     <p className="text-muted-foreground mt-1">تذكرة #{ticket.ticketNumber} • تم الإنشاء في {new Date(ticket.createdAt).toLocaleDateString("ar-EG")}</p>
                </div>
                <div className="flex gap-2">
                    <SelectStatus currentStatus={ticket.status} onUpdate={handleUpdateStatus} />
                    <Button variant="destructive" onClick={() => handleUpdateStatus('escalated')} disabled={ticket.status === 'escalated'}>تصعيد</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Details & Chat */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    <Card>
                        <CardHeader>
                            <CardTitle>الوصف</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-foreground">{ticket.description}</p>
                        </CardContent>
                    </Card>

                    {/* Message Thread */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageCircle size={20} /> المحادثة
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 mb-6 max-h-[500px] overflow-y-auto p-2">
                                {/* Owner's original description as first message */}
                                <div className="bg-muted p-4 rounded-lg rounded-tr-none max-w-[85%] border border-border">
                                    <p className="text-xs font-bold text-primary mb-1">{ownerName} (صاحب التذكرة)</p>
                                    <p className="text-sm text-foreground">{ticket.description}</p>
                                    <p className="text-[10px] text-muted-foreground mt-2 text-left">{new Date(ticket.createdAt).toLocaleTimeString("ar-EG")}</p>
                                </div>

                                {ticket.messages?.map((msg: any, i: number) => {
                                    const isSupport = msg.senderRole === 'support' || msg.senderRole === 'admin';
                                    return (
                                        <div key={i} className={`p-4 rounded-lg max-w-[85%] border ${
                                            isSupport
                                            ? 'bg-blue-500/10 border-blue-500/20 mr-auto rounded-tl-none'
                                            : 'bg-muted border-border ml-auto rounded-tr-none'
                                        }`}>
                                            <p className={`text-xs font-bold mb-1 ${isSupport ? 'text-blue-600 dark:text-blue-400' : 'text-primary'}`}>
                                                {msg.senderId?.fullName || msg.senderRole} {isSupport ? '(أنت)' : ''}
                                            </p>
                                            <p className="text-sm text-foreground">{msg.message}</p>
                                            <p className="text-[10px] text-muted-foreground mt-2 text-left">{new Date(msg.createdAt).toLocaleTimeString("ar-EG")}</p>
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

                {/* Right Column - Actions & Info */}
                <div className="space-y-6">
                    {/* Risk Actions */}
                    <Card className="border-r-4 border-r-destructive shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-destructive flex items-center gap-2 text-lg">
                                <ShieldAlert size={20} /> إدارة المخاطر
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-sm text-muted-foreground mb-2">
                                درجة مخاطر هذه التذكرة <span className="font-bold text-destructive">{ticket.riskScore}/100</span>.
                            </p>
                            <Button variant="outline" className="w-full justify-start text-destructive border-destructive/20 hover:text-destructive hover:bg-transparent" onClick={handleFreezeMerchant}>
                                <Ban className="ml-2 h-4 w-4" /> تجميد رصيد التاجر
                            </Button>
                            <Button variant="outline" className="w-full justify-start text-destructive border-destructive/20 hover:text-destructive hover:bg-transparent" onClick={handleSuspendProduct}>
                                <Ban className="ml-2 h-4 w-4" /> تعليق المنتج
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Dispute Actions */}
                    <Card className="border-r-4 border-r-orange-500 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-orange-600 dark:text-orange-400 flex items-center gap-2 text-lg">
                                <DollarSign size={20} /> تسوية النزاعات
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                             <div className="border border-orange-300/40 dark:border-orange-400/30 bg-orange-500/10 p-3 rounded-md mb-2">
                                <p className="text-sm font-medium text-orange-900 dark:text-orange-200">المبلغ المتنازع عليه</p>
                                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">${orderAmount?.toFixed(2) || "0.00"}</p>
                            </div>
                            <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white border-none" disabled={!ticket.dispute} onClick={() => handleResolveDispute('refund_full')}>
                                إصدار استرداد كامل
                            </Button>
                            <Button variant="outline" className="w-full border-orange-300/40 dark:border-orange-400/30 text-orange-700 dark:text-orange-300 hover:text-orange-800 dark:hover:text-orange-200 hover:bg-transparent" disabled={!ticket.dispute} onClick={() => handleResolveDispute('rejected')}>
                                رفض النزاع
                            </Button>
                        </CardContent>
                    </Card>

                    {/* User Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User size={18} /> بيانات المستخدم
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                 <div className="flex justify-between">
                                    <span className="text-muted-foreground">الاسم</span>
                                    <span>{ownerName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">البريد الإلكتروني</span>
                                    <span>{ownerEmail}</span>
                                </div>
                                <Separator className="my-2" />
                                 <div className="flex justify-between">
                                    <span className="text-muted-foreground">رقم الطلب</span>
                                    <span className="font-mono">{orderNumber || "N/A"}</span>
                                </div>
                                 </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function SelectStatus({ currentStatus, onUpdate }: { currentStatus: string, onUpdate: (s: string) => void }) {
    const statuses = [
        { id: 'open', label: 'مفتوحة', color: 'text-blue-600 dark:text-blue-400' },
        { id: 'under_review', label: 'قيد المراجعة', color: 'text-amber-600 dark:text-amber-400' },
        { id: 'waiting_customer', label: 'بانتظار العميل', color: 'text-purple-600 dark:text-purple-400' },
        { id: 'escalated', label: 'مصعدة', color: 'text-destructive' },
        { id: 'resolved_refund', label: 'تم الاسترداد', color: 'text-green-600 dark:text-green-400' },
        { id: 'resolved_rejected', label: 'مرفوضة', color: 'text-rose-600 dark:text-rose-400' },
        { id: 'closed', label: 'مغلقة', color: 'text-muted-foreground' }
    ];

    return (
        <div className="flex gap-1 bg-card border border-border rounded-lg p-1 flex-wrap">
            {statuses.map(s => (
                <Button
                    key={s.id}
                    variant={currentStatus === s.id ? "secondary" : "ghost"}
                    size="sm"
                    className={`text-xs px-3 ${currentStatus === s.id ? s.color + " font-bold bg-muted" : "text-muted-foreground"}`}
                    onClick={() => onUpdate(s.id)}
                >
                    {s.label}
                </Button>
            ))}
        </div>
    );
}
