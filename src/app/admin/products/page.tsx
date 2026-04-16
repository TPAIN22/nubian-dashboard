'use client';

import { useEffect, useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  ShieldAlert, 
  Eye, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  MoreVertical
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface Product {
  _id: string;
  name: string;
  merchantId: { storeName: string; ownerName: string };
  category: { name: string };
  price: number;
  stock: number;
  isFlagged: boolean;
  isActive: boolean;
  images: string[];
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
       toast.error('فشل تحميل المنتجات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleModerate = async (productId: string, action: string) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        body: JSON.stringify({ productId, action, reason: 'System moderation' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`تم ${action === 'flag' ? 'حظر' : 'تفعيل'} المنتج بنجاح`);
        fetchProducts();
      }
    } catch (error) {
       toast.error('حدث خطأ أثناء المحاولة');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.merchantId.storeName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">إدارة المنتجات العالمية</h1>
          <p className="text-muted-foreground">مراقبة وتعديل المنتجات المعروضة في السوق.</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input 
            className="pl-9" 
            placeholder="بحث عن منتج أو متجر..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المنتج</TableHead>
                <TableHead>المتجر</TableHead>
                <TableHead>التصنيف</TableHead>
                <TableHead>السعر</TableHead>
                <TableHead>المخزون</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10">جاري التحميل...</TableCell></TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">لا توجد منتجات مطابقة.</TableCell></TableRow>
              ) : (
                filteredProducts.map((p) => (
                  <TableRow key={p._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded border overflow-hidden shrink-0">
                          <Image 
                            src={p.images[0] || '/placeholder.png'} 
                            alt={p.name} 
                            fill 
                            className="object-cover" 
                            unoptimized
                          />
                        </div>
                        <span className="font-medium truncate max-w-[150px]">{p.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{p.merchantId.storeName}</TableCell>
                    <TableCell><Badge variant="outline">{p.category?.name || 'عام'}</Badge></TableCell>
                    <TableCell>{new Intl.NumberFormat('ar-SD', { style: 'currency', currency: 'SDG' }).format(p.price)}</TableCell>
                    <TableCell>{p.stock}</TableCell>
                    <TableCell>
                       {p.isFlagged ? (
                         <Badge variant="destructive" className="gap-1"><ShieldAlert className="w-3 h-3" /> محظور</Badge>
                       ) : p.isActive ? (
                         <Badge variant="default" className="bg-green-600">نشط</Badge>
                       ) : (
                         <Badge variant="secondary">مخفي</Badge>
                       )}
                    </TableCell>
                    <TableCell className="text-left">
                       <div className="flex items-center gap-2 justify-end">
                          <Button variant="ghost" size="icon" title="عرض"><Eye className="w-4 h-4" /></Button>
                          {p.isFlagged ? (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-green-600" 
                              onClick={() => handleModerate(p._id, 'unflag')}
                              title="إلغاء الحظر"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-amber-600" 
                              onClick={() => handleModerate(p._id, 'flag')}
                              title="حظر المنتج"
                            >
                              <ShieldAlert className="w-4 h-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
                       </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
