"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Search, Inbox, Plus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { merchantSupportApi } from "@/lib/merchantApi";

export default function MerchantSupportPage() {
    const { isLoaded } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");

    const [tickets, setTickets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [reloadKey, setReloadKey] = useState(0);
    const [createOpen, setCreateOpen] = useState(false);

    useEffect(() => {
        const fetchTickets = async () => {
            setIsLoading(true);
            try {
                const params: Record<string, string> = {};
                if (statusFilter !== "all") params.status = statusFilter;
                if (categoryFilter !== "all") params.category = categoryFilter;
                if (searchTerm) params.query = searchTerm;

                const ticketsRes = await merchantSupportApi.getTickets(params);
                setTickets(ticketsRes.data || []);
            } catch (error) {
                console.error(error);
                toast.error("حدث خطأ أثناء تحميل التذاكر");
            } finally {
                setIsLoading(false);
            }
        };

        if (isLoaded) {
            fetchTickets();
        }
    }, [isLoaded, statusFilter, categoryFilter, searchTerm, reloadKey]);

    return (
        <div className="p-6 space-y-8 min-h-screen bg-background" dir="rtl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">تذاكر الدعم</h1>
                    <p className="text-muted-foreground mt-1">الشكاوى والطلبات المتعلقة بمتجرك.</p>
                </div>
                <CreateTicketDialog
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                    onCreated={() => setReloadKey((k) => k + 1)}
                />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="بحث برقم التذكرة أو الموضوع..."
                        className="pr-9 text-right"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Select onValueChange={setStatusFilter} value={statusFilter}>
                        <SelectTrigger className="w-[180px] text-right" dir="rtl">
                            <SelectValue placeholder="الحالة" />
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                            <SelectItem value="all">جميع الحالات</SelectItem>
                            <SelectItem value="open">مفتوحة</SelectItem>
                            <SelectItem value="under_review">قيد المراجعة</SelectItem>
                            <SelectItem value="waiting_customer">بانتظار العميل</SelectItem>
                            <SelectItem value="escalated">مصعدة</SelectItem>
                            <SelectItem value="resolved_refund">تم الاسترداد</SelectItem>
                            <SelectItem value="resolved_rejected">مرفوضة</SelectItem>
                            <SelectItem value="closed">مغلقة</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select onValueChange={setCategoryFilter} value={categoryFilter}>
                        <SelectTrigger className="w-[180px] text-right" dir="rtl">
                            <SelectValue placeholder="الفئة" />
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                            <SelectItem value="all">جميع الفئات</SelectItem>
                            <SelectItem value="order_issue">مشاكل الطلب</SelectItem>
                            <SelectItem value="payment_issue">مشاكل الدفع</SelectItem>
                            <SelectItem value="merchant_complaint">شكوى تاجر</SelectItem>
                            <SelectItem value="product_report">بلاغ منتج</SelectItem>
                            <SelectItem value="fraud">احتيال</SelectItem>
                            <SelectItem value="health_risk">مخاطر صحية</SelectItem>
                            <SelectItem value="other">أخرى</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Tabs defaultValue="all" className="w-full" dir="rtl">
                <TabsList className="grid w-full grid-cols-1 lg:w-[200px] mb-6">
                    <TabsTrigger value="all">الكل</TabsTrigger>
                </TabsList>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">جاري تحميل التذاكر...</p>
                    </div>
                ) : tickets.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <Inbox className="h-10 w-10 text-muted-foreground mb-3" />
                            <p className="text-foreground font-medium">لا توجد تذاكر دعم حالياً</p>
                            <p className="text-sm text-muted-foreground mt-1">سيتم عرض التذاكر المتعلقة بمتجرك هنا.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <TabsContent value="all" className="space-y-4">
                        <TicketTable data={tickets} />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}

function TicketTable({ data }: { data: any[] }) {
    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">المعرف</TableHead>
                            <TableHead className="text-right">الموضوع</TableHead>
                            <TableHead className="text-right">النوع</TableHead>
                            <TableHead className="text-right">الحالة</TableHead>
                            <TableHead className="text-right">الأولوية</TableHead>
                            <TableHead className="text-right">التاريخ</TableHead>
                            <TableHead className="text-left">إجراء</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((ticket) => {
                            const status = ticket.status || "";
                            const category = ticket.category || "";
                            const priority = ticket.priority || "";
                            return (
                                <TableRow key={ticket._id || ticket.ticketNumber} className="hover:bg-muted/50 border-b">
                                    <TableCell className="font-medium text-foreground text-right">{ticket.ticketNumber}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-foreground">{ticket.subject}</span>
                                            <span className="text-xs text-muted-foreground capitalize">{category?.replace('_', ' ')}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant="outline" className="capitalize font-normal text-gray-600">
                                            {ticket.type || "—"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
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
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className={`text-sm ${priority === 'high' ? 'text-destructive font-medium' : 'text-gray-600'}`}>
                                            {priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : "—"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                        {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString("ar-EG") : "—"}
                                    </TableCell>
                                    <TableCell className="text-left">
                                        <Link href={`/merchant/support/${ticket._id || ticket.ticketNumber}`}>
                                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">عرض</Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function CreateTicketDialog({
    open,
    onOpenChange,
    onCreated,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated: () => void;
}) {
    const [type, setType] = useState<"support" | "complaint" | "legal">("support");
    const [category, setCategory] = useState("payment_issue");
    const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const reset = () => {
        setType("support");
        setCategory("payment_issue");
        setPriority("medium");
        setSubject("");
        setDescription("");
    };

    const handleSubmit = async () => {
        if (!subject.trim() || !description.trim()) {
            toast.error("الرجاء تعبئة الموضوع والوصف");
            return;
        }
        setSubmitting(true);
        try {
            await merchantSupportApi.createTicket({
                type,
                category,
                subject: subject.trim(),
                description: description.trim(),
                priority,
            });
            toast.success("تم إنشاء التذكرة بنجاح");
            reset();
            onOpenChange(false);
            onCreated();
        } catch (err: any) {
            const msg =
                err?.response?.data?.errors?.map((e: any) => e.msg || e.message).join(" — ") ||
                err?.response?.data?.message ||
                err?.message ||
                "تعذر إنشاء التذكرة";
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    تذكرة جديدة
                </Button>
            </DialogTrigger>
            <DialogContent dir="rtl" className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-right">إنشاء تذكرة دعم جديدة</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">النوع</label>
                            <Select value={type} onValueChange={(v) => setType(v as any)}>
                                <SelectTrigger dir="rtl" className="text-right"><SelectValue /></SelectTrigger>
                                <SelectContent dir="rtl">
                                    <SelectItem value="support">طلب دعم</SelectItem>
                                    <SelectItem value="complaint">شكوى</SelectItem>
                                    <SelectItem value="legal">قانوني</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">الأولوية</label>
                            <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                                <SelectTrigger dir="rtl" className="text-right"><SelectValue /></SelectTrigger>
                                <SelectContent dir="rtl">
                                    <SelectItem value="low">منخفضة</SelectItem>
                                    <SelectItem value="medium">متوسطة</SelectItem>
                                    <SelectItem value="high">عالية</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">الفئة</label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger dir="rtl" className="text-right"><SelectValue /></SelectTrigger>
                            <SelectContent dir="rtl">
                                <SelectItem value="payment_issue">مشاكل الدفع</SelectItem>
                                <SelectItem value="order_issue">مشاكل الطلب</SelectItem>
                                <SelectItem value="product_report">بلاغ منتج</SelectItem>
                                <SelectItem value="other">أخرى</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">الموضوع</label>
                        <Input
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="ملخص قصير للمشكلة"
                            className="text-right"
                            maxLength={200}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">الوصف</label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="اشرح المشكلة بالتفصيل..."
                            className="text-right min-h-[120px]"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                        إلغاء
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting}>
                        {submitting && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                        إرسال
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
