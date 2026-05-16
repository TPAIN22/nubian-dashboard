"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Clock, Loader2, Search, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { adminApi } from "@/lib/adminApi";

export default function SupportDashboard() {
    const { isLoaded, userId } = useAuth();
    const [activeTab, setActiveTab] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");

    const [tickets, setTickets] = useState<any[]>([]);
    const [stats, setStats] = useState({
        openTickets: 0,
        highRisk: 0,
        activeDisputes: 0,
        overdue: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTickets = async () => {
            setIsLoading(true);
            try {
                const params: Record<string, string> = {};
                if (statusFilter !== "all") params.status = statusFilter;
                if (categoryFilter !== "all") params.category = categoryFilter;
                if (searchTerm) params.query = searchTerm;

                const [ticketsRes, statsRes] = await Promise.all([
                    adminApi.getTickets(params),
                    adminApi.getStats()
                ]);
                setTickets(ticketsRes.data || []);
                setStats(statsRes);
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

    const getRiskColor = (score: number) => {
        if (score >= 50) return "text-destructive border-destructive/40 font-medium bg-destructive/10";
        if (score >= 20) return "text-orange-600 dark:text-orange-400 border-orange-300/40 dark:border-orange-400/40 font-medium bg-orange-500/10";
        return "text-green-600 dark:text-green-400 border-green-300/40 dark:border-green-400/40 font-medium bg-green-500/10";
    };

    const isOverdue = (dateString: string) => {
        return new Date(dateString) < new Date();
    };

    return (
        <div className="p-6 space-y-8 min-h-screen bg-background" dir="rtl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">مركز الدعم والمخاطر</h1>
                    <p className="text-muted-foreground mt-1">إدارة التذاكر والنزاعات ومخاطر المنصة.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline">تصدير التقرير</Button>
                    <Button>إنشاء تذكرة</Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-foreground">تذاكر مفتوحة</CardTitle>
                        <Clock className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{stats.openTickets}</div>
                        <p className="text-xs text-muted-foreground mt-1">يتطلب استجابة</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-destructive/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-destructive">مخاطر عالية</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{stats.highRisk}</div>
                        <p className="text-xs text-muted-foreground mt-1">تتطلب فحص دقيق</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">نزاعات نشطة</CardTitle>
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{stats.activeDisputes}</div>
                        <p className="text-xs text-muted-foreground mt-1">شكاوى حول الطلبات</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-destructive/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-destructive">تجاوز SLA</CardTitle>
                        <Clock className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{stats.overdue}</div>
                        <p className="text-xs text-muted-foreground mt-1">تجاوزت وقت الحل</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="بحث عن تذكرة، رقم الطلب، أو مستخدم..."
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
                            <SelectItem value="fraud">احتيال</SelectItem>
                            <SelectItem value="order_issue">مشاكل الطلب</SelectItem>
                            <SelectItem value="payment_issue">مشاكل الدفع</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Main Tabs */}
            <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab} dir="rtl">
                <TabsList className="grid w-full grid-cols-5 lg:w-[600px] mb-6">
                    <TabsTrigger value="all">الكل</TabsTrigger>
                    <TabsTrigger value="risk" className="data-[state=active]:text-destructive">مخاطر عالية</TabsTrigger>
                    <TabsTrigger value="disputes">النزاعات</TabsTrigger>
                    <TabsTrigger value="suspended">معلقة</TabsTrigger>
                    <TabsTrigger value="merchants">تجار</TabsTrigger>
                </TabsList>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">جاري تحميل التذاكر...</p>
                    </div>
                ) : (
                    <>
                        <TabsContent value="all" className="space-y-4">
                            <TicketTable data={tickets} getRiskColor={getRiskColor} isOverdue={isOverdue} />
                        </TabsContent>
                        <TabsContent value="risk" className="space-y-4">
                            <TicketTable data={tickets.filter(t => t.riskScore >= 50)} getRiskColor={getRiskColor} isOverdue={isOverdue} />
                        </TabsContent>
                        <TabsContent value="disputes" className="space-y-4">
                           <TicketTable data={tickets.filter(t => t.type === 'complaint')} getRiskColor={getRiskColor} isOverdue={isOverdue} />
                        </TabsContent>
                    </>
                )}
            </Tabs>
        </div>
    );
}

function TicketTable({ data, getRiskColor, isOverdue }: { data: any[], getRiskColor: any, isOverdue: any }) {
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
                            <TableHead className="text-right">درجة الخطر</TableHead>
                            <TableHead className="text-right">SLA</TableHead>
                            <TableHead className="text-left">إجراء</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((ticket) => {
                            const overdue = isOverdue(ticket.slaDeadline) && ticket.status !== 'resolved_refund';
                            const highRisk = ticket.riskScore >= 50;

                            return (
                                <TableRow key={ticket.ticketNumber || ticket._id} className="hover:bg-muted/50 border-b">
                                    <TableCell className="font-medium text-foreground text-right">{ticket.ticketNumber}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-foreground">{ticket.subject}</span>
                                            <span className="text-xs text-muted-foreground capitalize">{(ticket.category || '').replace('_', ' ')}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant="outline" className="capitalize font-normal text-muted-foreground">
                                            {ticket.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant="outline" className={
                                            ticket.status === 'escalated' ? 'text-destructive border-destructive/40 font-medium bg-destructive/10' :
                                                ticket.status === 'open' ? 'text-blue-700 dark:text-blue-400 border-blue-300/40 dark:border-blue-400/40 font-medium bg-blue-500/10' :
                                                    ticket.status === 'resolved_refund' ? 'text-green-700 dark:text-green-400 border-green-300/40 dark:border-green-400/40 font-medium bg-green-500/10' :
                                                        'text-foreground border-border font-medium'
                                        }>
                                            <span className="capitalize">{ticket.status.replace('_', ' ')}</span>
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className={`text-sm ${ticket.priority === 'high' ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                                            {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center gap-2">
                                            <Badge className={getRiskColor(ticket.riskScore)} variant="outline">
                                                {ticket.riskScore}
                                            </Badge>
                                            {highRisk && <ShieldAlert className="h-4 w-4 text-destructive" />}
                                        </div>
                                    </TableCell>
                                    <TableCell className={`text-right ${overdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                                        {new Date(ticket.slaDeadline).toLocaleDateString("ar-EG")}
                                        {overdue && <span className="mr-1 text-xs text-destructive font-bold">!</span>}
                                    </TableCell>
                                    <TableCell className="text-left">
                                        <Link href={`/admin/support/${ticket._id || ticket.ticketNumber}`}>
                                            <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">عرض</Button>
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
