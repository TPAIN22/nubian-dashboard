"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import BannerForm from "./bannerForm"; 
import type { BannerFormValues } from "./bannerForm";
import { useAuth } from '@clerk/nextjs';


type Banner = BannerFormValues & { _id: string };




export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editBanner, setEditBanner] = useState<Banner | null>(null);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/banners");
      // Handle both direct array response and wrapped response
      const bannersData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setBanners(Array.isArray(bannersData) ? bannersData : []);
    } catch (e: any) {
      const errorMessage = e?.response?.data?.message || e?.message || "حدث خطأ غير معروف";
      toast.error("فشل في جلب العروض", {
        description: typeof errorMessage === 'string' ? errorMessage : "حدث خطأ غير معروف",
      });
      setBanners([]); // Set empty array on error to prevent rendering issues
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);
  const {getToken} = useAuth();

  const handleDelete = async (id:string) => {
    const token = await getToken();
    if (!window.confirm("هل أنت متأكد من حذف هذا العرض؟")) return;
    try {
      await axiosInstance.delete(`/banners/${id}` , {
        headers: {
      Authorization: `Bearer ${token}`,
    },
      });
      toast.success("تم حذف العرض بنجاح");
      fetchBanners();
    } catch (e) {
      toast.error("فشل حذف العرض" , {
        description: e instanceof Error ? e.message : "حدث خطأ غير معروف",
      });
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">العروض (Banners)</h1>
        <Button onClick={() => { setEditBanner(null); setShowForm(true); }} className="flex items-center gap-2">
          <PlusCircle className="h-5 w-5" />
          إضافة عرض جديد
        </Button>
      </div>
      {showForm && (
        <BannerForm
          banner={editBanner || undefined}
          onClose={() => { setShowForm(false); setEditBanner(null); fetchBanners(); }}
        />
      )}
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y divide-gray-500">
          <thead className="bg-gray-600">
            <tr>
              <th className="px-4 py-2">الصورة</th>
              <th className="px-4 py-2">العنوان</th>
              <th className="px-4 py-2">الوصف</th>
              <th className="px-4 py-2">الترتيب</th>
              <th className="px-4 py-2">مفعل؟</th>
              <th className="px-4 py-2">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8">جاري التحميل...</td></tr>
            ) : banners.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8">لا توجد عروض</td></tr>
            ) : banners.map((banner) => (
              <tr key={banner._id} className="border-b">
                <td className="px-4 py-2"><img src={banner.image} alt="banner" className="h-16 w-32 object-cover rounded" /></td>
                <td className="px-4 py-2">{banner.title || "-"}</td>
                <td className="px-4 py-2">{banner.description || "-"}</td>
                <td className="px-4 py-2 text-center">{banner.order}</td>
                <td className="px-4 py-2 text-center">{banner.isActive ? "✅" : "❌"}</td>
                <td className="px-4 py-2 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setEditBanner(banner); setShowForm(true); }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(banner._id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 
