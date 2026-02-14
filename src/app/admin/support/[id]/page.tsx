"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, User, MessageCircle, DollarSign, Ban, ShieldAlert } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function TicketDetails({ params }: { params: { id: string } }) {
    // Mock data - In real app, fetch using params.id
    const ticket = {
        id: "NB-2026-0001",
        subject: "Stolen Card Usage",
        description: "I noticed a charge on my card that I didn't authorize. It says Nubian on the statement.",
        status: "escalated",
        priority: "high",
        riskScore: 80,
        category: "fraud",
        createdAt: "2026-02-13T08:00:00",
        user: {
            name: "John Doe",
            email: "john@example.com",
            id: "usr_123"
        },
        relatedOrder: {
            id: "ord_999",
            amount: 500,
            merchantId: "mer_555"
        }
    };

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
                    <p className="text-gray-500 mt-1">تذكرة #{ticket.id} • تم الإنشاء في {new Date(ticket.createdAt).toLocaleDateString("ar-EG")}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">تغيير الحالة</Button>
                    <Button variant="destructive">تصعيد</Button>
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
                            <div className="space-y-4 mb-4">
                                <div className="border p-3 rounded-lg max-w-[80%]">
                                    <p className="text-sm font-semibold text-primary">John Doe (المستخدم)</p>
                                    <p className="text-gray-700">لاحظت عملية شرائية على بطاقتي لم أقم بها.</p>
                                </div>
                                <div className="border p-3 rounded-lg max-w-[80%] mr-auto">
                                    <p className="text-sm font-semibold text-gray-800">فريق الدعم</p>
                                    <p className="text-gray-700">نحن نحقق في هذه المشكلة. تم تصعيد قضيتك.</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Textarea placeholder="اكتب ردك هنا..." className="text-right" />
                                <Button className="self-end">إرسال</Button>
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
                                <p className="text-2xl font-bold text-orange-700">${ticket.relatedOrder.amount.toFixed(2)}</p>
                            </div>
                            <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white border-none">
                                إصدار استرداد كامل
                            </Button>
                            <Button variant="outline" className="w-full border-orange-200 text-orange-700 hover:text-orange-800 hover:bg-transparent">
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
                                    <span>{ticket.user.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">البريد الإلكتروني</span>
                                    <span>{ticket.user.email}</span>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex justify-between">
                                    <span className="text-gray-500">رقم الطلب</span>
                                    <span className="font-mono">{ticket.relatedOrder.id}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
