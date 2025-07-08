import React, { Suspense } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import CategoryListClient from "@/components/categoreyClient";

async function Page() {
  const categories = await axiosInstance
    .get("/categories")
    .then((res) => res.data);
    (categories);
  return (
    <div className="min-h-screen  p-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold">التصنيفات</h1>
        <p className="text-lg mt-2">عدل او اضف متصنيف جديد.</p>
      </div>
      <Suspense fallback={<div className="text-center text-xl">جاري تحميل التصنيفات...</div>}>
        <CategoryListClient categories={categories} />
      </Suspense>
    </div>
  );
}

export default Page;