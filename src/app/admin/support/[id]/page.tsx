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

export default function TicketDetails({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { isLoaded } = useAuth();
    
    const [ticket, setTicket] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [replyText, setReplyText] = useState("");
    const [isSending, setIsSending] = useState(false);

    const fetchTicket = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/support/${id}`);
            if (!res.ok) throw new Error("Ticket not found");
            const data = await res.json();
            setTicket(data.ticket);
        } catch (error) {
            console.error(error);
            toast.error("خطأ في تحميل بيانات التذكرة");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isLoaded) {
            fetchTicket();
        }
    }, [isLoaded, id]);

    const handleUpdateStatus = async (status: string) => {
        try {
            const res = await fetch(`/api/admin/support/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (!res.ok) throw new Error("Update failed");
            const data = await res.json();
            setTicket(data.ticket);
            toast.success("تم تحديث الحالة بنجاح");
        } catch (error) {
            toast.error("فشل تحديث الحالة");
        }
    };

    const handleSendReply = async () => {
        if (!replyText.trim()) return;
        setIsSending(true);
        try {
            const res = await fetch(`/api/admin/support/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reply: replyText })
            });
            if (!res.ok) throw new Error("Reply failed");
            const data = await res.json();
            setTicket(data.ticket);
            setReplyText("");
            toast.success("تم إرسال الرد");
        } catch (error) {
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
            <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
                <h2 className="text-2xl font-bold mb-4">التذكرة غير موجودة</h2>
                <Link href="/admin/support">
                    <Button variant="outline"><ArrowRight className="ml-2 h-4 w-4" /> العودة للقائمة</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen" dir="rtl">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-gray-900">{ticket.subject}</h1>
                        <Badge variant="outline" className="text-destructive border-destructive flex gap-1">
                            <ShieldAlert size={12} /> مخاطر عالية ({ticket.riskScore})
                        </Badge>
                    </div>
                     <p className="text-gray-500 mt-1">تذكرة #{ticket.ticketId} • تم الإنشاء في {new Date(ticket.createdAt).toLocaleDateString("ar-EG")}</p>
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
                            <p className="text-gray-700">{ticket.description}</p>
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
                                    <p className="text-xs font-bold text-primary mb-1">{ticket.userName} (صاحب التذكرة)</p>
                                    <p className="text-sm text-foreground">{ticket.description}</p>
                                    <p className="text-[10px] text-muted-foreground mt-2 text-left">{new Date(ticket.createdAt).toLocaleTimeString("ar-EG")}</p>
                                </div>

                                {ticket.messages?.map((msg: any, i: number) => (
                                    <div key={i} className={`p-4 rounded-lg max-w-[85%] border ${
                                        msg.role === 'support' 
                                        ? 'bg-blue-500/10 border-blue-500/20 mr-auto rounded-tl-none' 
                                        : 'bg-muted border-border ml-auto rounded-tr-none'
                                    }`}>
                                        <p className={`text-xs font-bold mb-1 ${msg.role === 'support' ? 'text-blue-600' : 'text-primary'}`}>
                                            {msg.sender} {msg.role === 'support' ? '(أنت)' : ''}
                                        </p>
                                        <p className="text-sm text-foreground">{msg.text}</p>
                                        <p className="text-[10px] text-muted-foreground mt-2 text-left">{new Date(msg.timestamp).toLocaleTimeString("ar-EG")}</p>
                                    </div>
                                ))}
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
                            <p className="text-sm text-gray-500 mb-2">
                                درجة مخاطر هذه التذكرة <span className="font-bold text-destructive">80/100</span>.
                            </p>
                            <Button variant="outline" className="w-full justify-start text-destructive border-destructive/20 hover:text-destructive hover:bg-transparent">
                                <Ban className="ml-2 h-4 w-4" /> تجميد رصيد التاجر
                            </Button>
                            <Button variant="outline" className="w-full justify-start text-destructive border-destructive/20 hover:text-destructive hover:bg-transparent">
                                <Ban className="ml-2 h-4 w-4" /> تعليق المنتج
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Dispute Actions */}
                    <Card className="border-r-4 border-r-orange-500 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-orange-600 flex items-center gap-2 text-lg">
                                <DollarSign size={20} /> تسوية النزاعات
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                             <div className="border border-orange-200 p-3 rounded-md mb-2">
                                <p className="text-sm font-medium text-orange-900">المبلغ المتنازع عليه</p>
                                <p className="text-2xl font-bold text-orange-700">${ticket.relatedOrder?.amount?.toFixed(2) || "0.00"}</p>
                            </div>
                            <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white border-none" disabled={!ticket.relatedOrder}>
                                إصدار استرداد كامل
                            </Button>
                            <Button variant="outline" className="w-full border-orange-200 text-orange-700 hover:text-orange-800 hover:bg-transparent" disabled={!ticket.relatedOrder}>
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
                                    <span className="text-gray-500">الاسم</span>
                                    <span>{ticket.userName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">البريد الإلكتروني</span>
                                    <span>{ticket.userEmail}</span>
                                </div>
                                <Separator className="my-2" />
                                 <div className="flex justify-between">
                                    <span className="text-gray-500">رقم الطلب</span>
                                    <span className="font-mono">{ticket.relatedOrder?.id || "N/A"}</span>
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
        { id: 'open', label: 'مفتوحة', color: 'text-blue-600' },
        { id: 'escalated', label: 'مصعدة', color: 'text-destructive' },
        { id: 'resolved', label: 'تم الحل', color: 'text-green-600' },
        { id: 'closed', label: 'مغلقة', color: 'text-gray-500' }
    ];

    return (
        <div className="flex gap-1 bg-white border rounded-lg p-1">
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
