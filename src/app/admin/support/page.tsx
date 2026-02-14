"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Clock, Search, ShieldAlert } from "lucide-react";
import Link from "next/link";

// Mock Data for visualisation until API integration
const MOCK_TICKETS = [
    { id: "NB-2026-0001", type: "complaint", category: "fraud", subject: "Stolen Card Usage", status: "escalated", priority: "high", riskScore: 80, slaDue: "2026-02-14T10:00:00" },
    { id: "NB-2026-0002", type: "support", category: "order_issue", subject: "Where is my order?", status: "open", priority: "medium", riskScore: 10, slaDue: "2026-02-15T12:00:00" },
    { id: "NB-2026-0003", type: "complaint", category: "health_risk", subject: "Expired Food", status: "escalated", priority: "high", riskScore: 90, slaDue: "2026-02-13T09:00:00" }, // Overdue
    { id: "NB-2026-0004", type: "support", category: "payment_issue", subject: "Payment Failed", status: "resolved_refund", priority: "medium", riskScore: 0, slaDue: "2026-02-10T10:00:00" },
];

export default function SupportDashboard() {
    const [activeTab, setActiveTab] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");

    const getRiskColor = (score: number) => {
        if (score >= 50) return "text-destructive border-destructive font-medium"; // High Risk
        if (score >= 20) return "text-orange-600 border-orange-200 font-medium"; // Medium Risk
        return "text-green-600 border-green-200 font-medium"; // Low Risk
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
                        <div className="text-2xl font-bold text-foreground">12</div>
                        <p className="text-xs text-muted-foreground mt-1">+2 عن الأمس</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-destructive/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-destructive">مخاطر عالية</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">3</div>
                        <p className="text-xs text-muted-foreground mt-1">يتطلب اهتمام فوري</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">نزاعات نشطة</CardTitle>
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">5</div>
                        <p className="text-xs text-muted-foreground mt-1">$1,250 مبلغ مجمد</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">تجاوز SLA</CardTitle>
                        <Clock className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">1</div>
                        <p className="text-xs text-muted-foreground mt-1">تذاكر متأخرة</p>
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
                    <Select>
                        <SelectTrigger className="w-[180px] text-right" dir="rtl">
                            <SelectValue placeholder="الحالة" />
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                            <SelectItem value="all">جميع الحالات</SelectItem>
                            <SelectItem value="open">مفتوحة</SelectItem>
                            <SelectItem value="escalated">مصعدة</SelectItem>
                            <SelectItem value="resolved">تم الحل</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select>
                        <SelectTrigger className="w-[180px] text-right" dir="rtl">
                            <SelectValue placeholder="الفئة" />
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                            <SelectItem value="all">جميع الفئات</SelectItem>
                            <SelectItem value="fraud">احتيال</SelectItem>
                            <SelectItem value="support">دعم</SelectItem>
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

                <TabsContent value="all" className="space-y-4">
                    <TicketTable data={MOCK_TICKETS} getRiskColor={getRiskColor} isOverdue={isOverdue} />
                </TabsContent>
                <TabsContent value="risk" className="space-y-4">
                    <TicketTable data={MOCK_TICKETS.filter(t => t.riskScore >= 50)} getRiskColor={getRiskColor} isOverdue={isOverdue} />
                </TabsContent>
                <TabsContent value="disputes" className="space-y-4">
                    <div className="text-center py-10 text-muted-foreground">عرض النزاعات هنا</div>
                </TabsContent>
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
                            const overdue = isOverdue(ticket.slaDue) && ticket.status !== 'resolved_refund';
                            const highRisk = ticket.riskScore >= 50;

                            return (
                                <TableRow key={ticket.id} className="hover:bg-gray-50">
                                    <TableCell className="font-medium text-gray-900 text-right">{ticket.id}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900">{ticket.subject}</span>
                                            <span className="text-xs text-gray-500 capitalize">{ticket.category.replace('_', ' ')}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant="outline" className="capitalize font-normal text-gray-600">
                                            {ticket.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant="outline" className={
                                            ticket.status === 'escalated' ? 'text-destructive border-destructive font-medium' :
                                                ticket.status === 'open' ? 'text-blue-700 border-blue-200 font-medium' :
                                                    ticket.status === 'resolved_refund' ? 'text-green-700 border-green-200 font-medium' :
                                                        'text-gray-700 font-medium'
                                        }>
                                            <span className="capitalize">{ticket.status.replace('_', ' ')}</span>
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className={`text-sm ${ticket.priority === 'high' ? 'text-destructive font-medium' : 'text-gray-600'}`}>
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
                                    <TableCell className={`text-right ${overdue ? "text-destructive font-medium" : "text-gray-500"}`}>
                                        {new Date(ticket.slaDue).toLocaleDateString("ar-EG")}
                                        {overdue && <span className="mr-1 text-xs text-destructive font-bold">!</span>}
                                    </TableCell>
                                    <TableCell className="text-left">
                                        <Link href={`/admin/support/${ticket.id}`}>
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
