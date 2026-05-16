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
import { Loader2, Search, Inbox } from "lucide-react";
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
    }, [isLoaded, statusFilter, categoryFilter, searchTerm]);

    return (
        <div className="p-6 space-y-8 min-h-screen bg-background" dir="rtl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">تذاكر الدعم</h1>
                    <p className="text-muted-foreground mt-1">الشكاوى والطلبات المتعلقة بمتجرك.</p>
                </div>
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
