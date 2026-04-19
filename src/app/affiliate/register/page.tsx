"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { IconAffiliate, IconCheck, IconCopy, IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  name: z.string().min(3, "الاسم يجب أن يكون 3 أحرف على الأقل").max(50, "الاسم طويل جداً"),
  phone: z.string().optional(),
});

export default function AffiliateRegisterPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.fullName || "",
      phone: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const response = await fetch("/api/affiliate/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("تم التسجيل كموسق بنجاح!");
        setSuccessData(data.data);
        // Refresh session to get new role
        await user?.reload();
      } else {
        toast.error(data.message || "فشل التسجيل");
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("تم النسخ إلى الحافظة");
  };

  if (!isLoaded) return <div className="p-8 text-center">جاري التحميل...</div>;

  if (user?.publicMetadata?.role === "marketer" && !successData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center space-y-4">
        <IconCheck className="w-16 h-16 text-green-500" />
        <h1 className="text-2xl font-bold">أنت مسجل بالفعل كمسوق</h1>
        <p className="text-muted-foreground">يمكنك الانتقال إلى لوحة التحكم الخاصة بك لمتابعة أرباحك.</p>
        <Button onClick={() => router.push("/affiliate")}>انتقل للوحة التحكم</Button>
      </div>
    );
  }

  if (successData) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <Card className="border-green-500/50 bg-green-500/5">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-4">
              <IconCheck className="text-white w-8 h-8" />
            </div>
            <CardTitle className="text-2xl">تهانينا! تم تفعيل حسابك كمسوق</CardTitle>
            <CardDescription>أنت الآن جاهز للبدء في كسب العمولات.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-background border rounded-lg space-y-2">
              <p className="text-sm font-medium text-muted-foreground">كود الإحالة الخاص بك</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-mono font-bold tracking-widest">{successData.code}</span>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(successData.code)}>
                  <IconCopy size={18} />
                </Button>
              </div>
            </div>

            <div className="p-4 bg-background border rounded-lg space-y-2">
              <p className="text-sm font-medium text-muted-foreground">رابط الإحالة</p>
              <div className="flex items-center gap-2 overflow-hidden">
                <code className="text-xs bg-muted p-2 rounded block flex-1 truncate">{successData.referralLink}</code>
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(successData.referralLink)}>
                  <IconCopy size={18} />
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => window.location.href = "/affiliate"}>
              الذهاب للوحة التحكم
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="mb-8 text-center space-y-2">
        <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary mb-4">
          <IconAffiliate size={32} />
        </div>
        <h1 className="text-3xl font-bold">انضم لبرنامج المسوقين</h1>
        <p className="text-muted-foreground">ابدأ الآن في كسب عمولة 10% على كل طلب يتم من خلالك.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>معلومات المسوق</CardTitle>
          <CardDescription>يرجى ملء البيانات التالية لإصدار كود الإحالة الخاص بك.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم التجاري / الاسم الكامل</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل اسمك كما تفضله أن يظهر" {...field} />
                    </FormControl>
                    <FormDescription>سيستخدم هذا الاسم لإنشاء كود الإحالة الخاص بك.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الهاتف (اختياري)</FormLabel>
                    <FormControl>
                      <Input placeholder="09xxxxxxxx" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">لماذا تنضم إلينا؟</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>عمولة فورية 10% على كل عملية بيع ناجحة.</li>
                  <li>لوحة تحكم خاصة لمتابعة الأرباح والطلبات.</li>
                  <li>دفعات منتظمة عبر بنكك أو كاش.</li>
                  <li>رابط إحالة دائم يعمل على مدار الساعة.</li>
                </ul>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                تأكيد التسجيل كمسوق
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
