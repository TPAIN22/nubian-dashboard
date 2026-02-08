"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { axiosInstance } from "@/lib/axiosInstance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { IconPlus, IconEdit, IconCurrencyDollar, IconRefresh } from "@tabler/icons-react";
import type { Currency } from "./page";

interface CurrencyFormData {
    code: string;
    name: string;
    nameAr?: string;
    symbol: string;
    symbolPosition: "before" | "after";
    isActive: boolean;
    decimals: number;
    roundingStrategy: string;
    sortOrder: number;
    allowManualRate?: boolean;
    manualRate?: number;
    marketMarkupAdjustment: number;
}

const ROUNDING_STRATEGIES = [
    { value: "NONE", label: "No Rounding" },
    { value: "NEAREST_1", label: "Nearest 1" },
    { value: "NEAREST_5", label: "Nearest 5" },
    { value: "NEAREST_10", label: "Nearest 10" },
    { value: "ENDING_9", label: "Psychological (.99)" },
];

export default function CurrenciesClient() {
    const { getToken } = useAuth();

    // State management
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [loading, setLoading] = useState(true);
    const [fxRates, setFxRates] = useState<any>(null);
    const [refreshingFx, setRefreshingFx] = useState(false);

    // Dialog states
    const [currencyDialog, setCurrencyDialog] = useState(false);
    const [editingItem, setEditingItem] = useState<Currency | null>(null);

    // Form state
    const [form, setForm] = useState<CurrencyFormData>({
        code: "",
        name: "",
        nameAr: "",
        symbol: "",
        symbolPosition: "before",
        isActive: false,
        decimals: 2,
        roundingStrategy: "NONE",
        sortOrder: 0,
        allowManualRate: false,
        manualRate: undefined,
        marketMarkupAdjustment: 0,
    });

    // Load data
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [currenciesRes, fxRes] = await Promise.all([
                axiosInstance.get("/meta/currencies"),
                axiosInstance.get("/fx/latest"),
            ]);
            setCurrencies(currenciesRes.data.data || []);
            setFxRates(fxRes.data.data || null);
        } catch (error) {
            toast.error("فشل في تحميل البيانات");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Refresh FX rates
    const handleRefreshFx = async () => {
        try {
            setRefreshingFx(true);
            const token = await getToken();
            await axiosInstance.post("/fx/refresh", {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("تم تحديث أسعار الصرف");
            loadData();
        } catch (error) {
            toast.error("فشل في تحديث أسعار الصرف");
        } finally {
            setRefreshingFx(false);
        }
    };

    // Reset form
    const resetForm = () => {
        setForm({
            code: "",
            name: "",
            nameAr: "",
            symbol: "",
            symbolPosition: "before",
            isActive: false,
            decimals: 2,
            roundingStrategy: "NONE",
            sortOrder: 0,
            allowManualRate: false,
            manualRate: undefined,
            marketMarkupAdjustment: 0,
        });
        setEditingItem(null);
    };

    // Open dialog for add/edit
    const openDialog = (currency?: Currency) => {
        if (currency) {
            setForm({
                code: currency.code,
                name: currency.name,
                nameAr: currency.nameAr || "",
                symbol: currency.symbol,
                symbolPosition: currency.symbolPosition,
                isActive: currency.isActive,
                decimals: currency.decimals,
                roundingStrategy: currency.roundingStrategy,
                sortOrder: currency.sortOrder,
                allowManualRate: currency.allowManualRate || false,
                manualRate: currency.manualRate,
                marketMarkupAdjustment: currency.marketMarkupAdjustment || 0,
            });
            setEditingItem(currency);
        } else {
            resetForm();
        }
        setCurrencyDialog(true);
    };

    // Submit form (Note: This requires backend CRUD endpoints which would need to be added)
    const handleSubmit = async () => {
        try {
            if (!form.code?.trim()) {
                toast.error("رمز العملة مطلوب");
                return;
            }
            if (!form.name.trim()) {
                toast.error("اسم العملة مطلوب");
                return;
            }
            if (!form.symbol.trim()) {
                toast.error("رمز العملة مطلوب");
                return;
            }

            const token = await getToken();
            const headers = { Authorization: `Bearer ${token}` };

            // Note: This requires /admin/currencies endpoints to be implemented
            if (editingItem) {
                await axiosInstance.put(`/admin/currencies/${editingItem._id}`, form, { headers });
                toast.success("تم تحديث العملة بنجاح");
            } else {
                await axiosInstance.post("/admin/currencies", form, { headers });
                toast.success("تم إضافة العملة بنجاح");
            }

            setCurrencyDialog(false);
            resetForm();
            loadData();
        } catch (error: any) {
            const errorMessage = error.response?.data?.error?.message || "فشل في حفظ العملة";
            toast.error(errorMessage);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen p-4 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>جاري تحميل البيانات...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-extrabold text-primary mb-2">
                        إدارة العملات
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        إدارة العملات وأسعار الصرف للمتجر
                    </p>
                </div>

                {/* FX Rates Card */}
                <Card className="mb-6">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <IconCurrencyDollar className="h-5 w-5" />
                            أسعار الصرف
                        </CardTitle>
                        <Button
                            onClick={handleRefreshFx}
                            disabled={refreshingFx}
                            size="sm"
                            variant="outline"
                        >
                            <IconRefresh className={`h-4 w-4 ${refreshingFx ? 'animate-spin' : ''}`} />
                            تحديث
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {fxRates?.hasRates ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>التاريخ: {fxRates.date}</span>
                                    <span>المصدر: {fxRates.provider}</span>
                                    <span>آخر تحديث: {new Date(fxRates.fetchedAt).toLocaleString('ar')}</span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {fxRates.rates && Object.entries(fxRates.rates).map(([code, rate]: [string, any]) => (
                                        <div key={code} className="p-3 border rounded-lg text-center">
                                            <p className="text-lg font-bold">{code}</p>
                                            <p className="text-2xl text-primary">{Number(rate).toFixed(4)}</p>
                                        </div>
                                    ))}
                                </div>
                                {fxRates.missingCurrencies?.length > 0 && (
                                    <p className="text-sm text-amber-600">
                                        عملات غير متوفرة: {fxRates.missingCurrencies.join(', ')}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground py-4">
                                لا توجد بيانات. اضغط على "تحديث" لجلب الأسعار.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Currencies Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <IconCurrencyDollar className="h-5 w-5" />
                            العملات ({currencies.length})
                        </CardTitle>
                        <Button onClick={() => openDialog()} size="sm">
                            <IconPlus className="h-4 w-4 mr-1" />
                            إضافة عملة
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {currencies.map((currency) => (
                                <div
                                    key={currency._id}
                                    className={`p-4 border rounded-lg ${currency.isActive ? 'border-primary/50 bg-primary/5' : ''}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl font-bold">{currency.symbol}</span>
                                            <span className="font-medium">{currency.code}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Switch checked={currency.isActive} disabled onCheckedChange={() => { }} />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openDialog(currency)}
                                            >
                                                <IconEdit className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-sm">{currency.name}</p>
                                    {currency.nameAr && (
                                        <p className="text-sm text-muted-foreground">{currency.nameAr}</p>
                                    )}
                                    <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
                                        <span>Decimals: {currency.decimals}</span>
                                        <span>•</span>
                                        <span>{currency.roundingStrategy}</span>
                                    </div>
                                    {currency.allowManualRate && currency.manualRate && (
                                        <p className="mt-1 text-xs text-amber-600">
                                            Manual Rate: {currency.manualRate}
                                        </p>
                                    )}
                                    {currency.marketMarkupAdjustment !== 0 && (
                                        <p className={`mt-1 text-xs ${currency.marketMarkupAdjustment && currency.marketMarkupAdjustment > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            Market Adj: {currency.marketMarkupAdjustment && currency.marketMarkupAdjustment > 0 ? '+' : ''}{currency.marketMarkupAdjustment}%
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Currency Dialog */}
                <Dialog open={currencyDialog} onOpenChange={setCurrencyDialog}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{editingItem ? 'تعديل عملة' : 'إضافة عملة جديدة'}</DialogTitle>
                            <DialogDescription>
                                {editingItem ? 'قم بتعديل معلومات العملة' : 'أدخل معلومات العملة الجديدة'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="code">رمز العملة (ISO)</Label>
                                    <Input
                                        id="code"
                                        value={form.code}
                                        onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                        placeholder="USD, EGP, SDG"
                                        maxLength={3}
                                        disabled={!!editingItem}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="symbol">الرمز</Label>
                                    <Input
                                        id="symbol"
                                        value={form.symbol}
                                        onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                                        placeholder="$, EGP, ر.س"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="name">الاسم بالإنجليزية</Label>
                                <Input
                                    id="name"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="US Dollar"
                                />
                            </div>
                            <div>
                                <Label htmlFor="nameAr">الاسم بالعربية</Label>
                                <Input
                                    id="nameAr"
                                    value={form.nameAr}
                                    onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                                    placeholder="دولار أمريكي"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>موضع الرمز</Label>
                                    <Select
                                        value={form.symbolPosition}
                                        onValueChange={(value: "before" | "after") =>
                                            setForm({ ...form, symbolPosition: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="before">قبل ($100)</SelectItem>
                                            <SelectItem value="after">بعد (100 EGP)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="decimals">عدد الكسور</Label>
                                    <Input
                                        id="decimals"
                                        type="number"
                                        min={0}
                                        max={4}
                                        value={form.decimals}
                                        onChange={(e) => setForm({ ...form, decimals: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>استراتيجية التقريب</Label>
                                <Select
                                    value={form.roundingStrategy}
                                    onValueChange={(value) =>
                                        setForm({ ...form, roundingStrategy: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ROUNDING_STRATEGIES.map((strategy) => (
                                            <SelectItem key={strategy.value} value={strategy.value}>
                                                {strategy.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="sortOrder">ترتيب العرض</Label>
                                <Input
                                    id="sortOrder"
                                    type="number"
                                    value={form.sortOrder}
                                    onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="marketMarkupAdjustment">تعديل السعر بالسوق (%)</Label>
                                <Input
                                    id="marketMarkupAdjustment"
                                    type="number"
                                    min={-20}
                                    max={30}
                                    value={form.marketMarkupAdjustment}
                                    onChange={(e) => setForm({ ...form, marketMarkupAdjustment: parseInt(e.target.value) || 0 })}
                                    placeholder="0"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    قيمة إيجابية = زيادة السعر للأسواق المرتفعة، قيمة سالبة = خفض للأسواق الحساسة
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="isActive"
                                        checked={form.isActive}
                                        onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                                    />
                                    <Label htmlFor="isActive">نشط</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="allowManualRate"
                                        checked={form.allowManualRate ?? false}
                                        onCheckedChange={(checked) => setForm({ ...form, allowManualRate: checked })}
                                    />
                                    <Label htmlFor="allowManualRate">سعر يدوي</Label>
                                </div>
                            </div>
                            {form.allowManualRate && (
                                <div>
                                    <Label htmlFor="manualRate">السعر اليدوي (1 USD = ?)</Label>
                                    <Input
                                        id="manualRate"
                                        type="number"
                                        step="0.0001"
                                        value={form.manualRate || ""}
                                        onChange={(e) => setForm({ ...form, manualRate: parseFloat(e.target.value) || undefined })}
                                        placeholder="600.00"
                                    />
                                </div>
                            )}
                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => setCurrencyDialog(false)}>
                                    إلغاء
                                </Button>
                                <Button onClick={handleSubmit}>
                                    {editingItem ? 'تحديث' : 'إضافة'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
