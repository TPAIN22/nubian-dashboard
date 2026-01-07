import React from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import CategoryListClient from "@/components/categoreyClient";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// تعريف نوع البيانات
interface Category {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  parent?: {
    _id: string;
    name: string;
  } | null;
  children?: Category[];
}

// مكون لعرض رسالة الخطأ
function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="min-h-screen p-4 flex items-center justify-center">
      <div className="text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h2 className="text-xl font-semibold text-red-800 mb-2">خطأ في تحميل البيانات</h2>
          <p className="text-red-600 mb-4">{message}</p>
          <Link href="/">
            <Button variant="outline">العودة للصفحة الرئيسية</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

async function CategoriesPage() {
  let categories: Category[] = [];
  let error: string | null = null;

  try {
    // جلب البيانات مع معالجة الأخطاء
    const response = await axiosInstance.get("/categories");
    categories = response.data;
    
    // التحقق من وجود البيانات
    if (!Array.isArray(categories)) {
      throw new Error("تنسيق البيانات المُستلمة غير صحيح");
    }

  } catch (err) {
    error = err instanceof Error ? err.message : "فشل في تحميل التصنيفات. يرجى المحاولة مرة أخرى.";
  }

  // عرض رسالة الخطأ في حالة الفشل
  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* رأس الصفحة */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-primary mb-2">
            إدارة التصنيفات
          </h1>
          <p className="text-lg text-muted-foreground">
            عرض وإدارة جميع تصنيفات المتجر
          </p>
        </div>

        {/* إحصائيات سريعة */}
        <div className="bg-card rounded-lg p-6 mb-6 border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <h3 className="text-2xl font-bold text-primary">{categories.length}</h3>
              <p className="text-muted-foreground">إجمالي التصنيفات</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-primary">
                {categories.filter(cat => !cat.parent).length}
              </h3>
              <p className="text-muted-foreground">التصنيفات الرئيسية</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-primary">
                {categories.filter(cat => cat.parent).length}
              </h3>
              <p className="text-muted-foreground">التصنيفات الفرعية</p>
            </div>
          </div>
        </div>

        {/* زر إضافة تصنيف جديد */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-semibold">قائمة التصنيفات</h2>
        </div>

        {/* قائمة التصنيفات */}
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-muted rounded-lg p-8 max-w-md mx-auto">
              <h3 className="text-xl font-semibold mb-2">لا توجد تصنيفات</h3>
              <p className="text-muted-foreground mb-4">
                لم يتم إنشاء أي تصنيفات بعد. ابدأ بإضافة تصنيف جديد.
              </p>
              <Link href="/categories/add">
                <Button>إضافة أول تصنيف</Button>
              </Link>
            </div>
          </div>
        ) : (
          <CategoryListClient categories={categories} />
        )}
      </div>
    </div>
  );
}

export default CategoriesPage;

// إعدادات Next.js للـ caching والـ revalidation
export const revalidate = 60; // إعادة التحقق كل 60 ثانية
export const dynamic = 'force-dynamic'; // فرض التحديث الديناميكي