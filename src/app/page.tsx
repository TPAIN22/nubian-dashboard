// app/page.tsx

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const { userId } =await auth();

  // 🟥 إذا مو مسجل دخول → نوجهه لـ صفحة تسجيل الدخول
  if (!userId) {
    redirect("/auth");
  }

  // 🟩 نجيب بيانات المستخدم
    redirect("/dashboard");


  // 🔁 توجيه حسب الدور
  
}
