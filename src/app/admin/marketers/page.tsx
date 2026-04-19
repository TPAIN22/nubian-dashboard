"use client";

import { useEffect, useState } from "react";
import { 
  IconUsers, 
  IconSearch, 
  IconFilter, 
  IconDotsVertical,
  IconShieldCheck,
  IconShieldOff,
  IconExternalLink,
  IconUser,
  IconAffiliate,
  IconCash
} from "@tabler/icons-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function MarketersAdminPage() {
  const [marketers, setMarketers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchMarketers();
  }, []);

  const fetchMarketers = async () => {
    try {
      const res = await fetch("/api/admin/marketers");
      const data = await res.json();
      if (res.ok) {
        setMarketers(data.data || []);
      } else {
        toast.error(data.message || "فشل تحميل قائمة المسوقين");
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ar-SD", {
      style: "currency",
      currency: "SDG",
    }).format(amount);
  };

  const filteredMarketers = marketers.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة المسوقين</h1>
          <p className="text-muted-foreground mt-1 text-base">إدارة جميع المسوقين المشتركين في برنامج الإحالة.</p>
        </div>
        <div className="flex items-center gap-2">
           <Badge variant="outline" className="h-8 px-3">إجمالي المسوقين: {marketers.length}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>قائمة المسوقين</CardTitle>
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="بحث بالاسم أو الكود..." 
                className="pl-10" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" className="flex gap-2">
              <IconFilter size={18} /> تصفية
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المسوق</TableHead>
                  <TableHead>الكود</TableHead>
                  <TableHead>إجمالي الأرباح</TableHead>
                  <TableHead>الأرباح المعلقة</TableHead>
                  <TableHead>الطلبات</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-left w-[100px]">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [1, 2, 3].map((i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}><div className="h-8 bg-muted animate-pulse rounded" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredMarketers.length > 0 ? (
                  filteredMarketers.map((m) => (
                    <TableRow key={m._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {m.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium">{m.name}</span>
                            <span className="text-xs text-muted-foreground">{m.phone || "بدون هاتف"}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{m.code}</TableCell>
                      <TableCell className="font-bold">{formatCurrency(m.totalEarnings)}</TableCell>
                      <TableCell className="text-amber-600">{formatCurrency(m.pendingEarnings)}</TableCell>
                      <TableCell>{m.totalOrders}</TableCell>
                      <TableCell>
                        <Badge variant={m.status === 'active' ? 'default' : 'destructive'} className={m.status === 'active' ? 'bg-green-500' : ''}>
                          {m.status === 'active' ? 'نشط' : 'موقف'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu dir="rtl">
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <IconDotsVertical size={18} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>خيارات المسوق</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="flex items-center gap-2">
                              <IconUser size={16} /> عرض الملف الشخصي
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex items-center gap-2">
                              <IconCash size={16} /> عرض العمولات
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {m.status === 'active' ? (
                              <DropdownMenuItem className="text-destructive flex items-center gap-2">
                                <IconShieldOff size={16} /> إيقاف الحساب
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem className="text-green-600 flex items-center gap-2">
                                <IconShieldCheck size={16} /> تفعيل الحساب
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      لا يوجد مسوقين مطابقين للبحث.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
