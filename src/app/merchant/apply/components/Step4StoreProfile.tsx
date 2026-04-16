import React, { useState, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { Loader2, Sparkles, UploadCloud, X, Check, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MerchantRegistrationData } from "../schema";
import { uploadImageToImageKit } from "@/lib/upload";

const SUDAN_CITIES = [
  "Khartoum", 
  "Omdurman", 
  "Khartoum North", 
  "Nyala", 
  "Port Sudan", 
  "Kassala", 
  "Al-Ubayyid", 
  "Wad Madani"
];

export default function Step4StoreProfile() {
  const { register, formState: { errors }, watch, setValue } = useFormContext<MerchantRegistrationData>();
  
  const description = watch("description");
  const categories = watch("categories") || [];
  const logoUrl = watch("logoUrl");
  const productSamples = watch("productSamples") || [];
  
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);
  const [categoryInput, setCategoryInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const samplesInputRef = useRef<HTMLInputElement>(null);
  const [isSamplesUploading, setIsSamplesUploading] = useState(false);

  const handleAiCategories = async () => {
    if (!description || description.length < 10) return;
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/ai/suggest-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const data = await res.json();
      if (data.categories) {
        setSuggestedCategories(data.categories);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const addCategory = (cat: string) => {
    if (cat.trim() && !categories.includes(cat.trim())) {
      setValue("categories", [...categories, cat.trim()], { shouldValidate: true });
    }
    setCategoryInput("");
  };

  const removeCategory = (cat: string) => {
    setValue("categories", categories.filter(c => c !== cat), { shouldValidate: true });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن لا يتجاوز 2 ميجابايت");
      return;
    }

    setIsUploading(true);
    try {
      const uploadedUrl = await uploadImageToImageKit(file);
      setValue("logoUrl", uploadedUrl, { shouldValidate: true });
      toast.success("تم رفع الشعار بنجاح!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("فشل رفع الشعار، يرجى المحاولة مرة أخرى");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSamplesUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsSamplesUploading(true);
    const newSamples = [...productSamples];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 3 * 1024 * 1024) {
          toast.error(`الصورة ${file.name} تتجاوز 3 ميجابايت`);
          continue;
        }
        const url = await uploadImageToImageKit(file);
        newSamples.push(url);
      }
      setValue("productSamples", newSamples, { shouldValidate: true });
      toast.success("تم رفع عينات المنتجات!");
    } catch (error) {
      console.error("Samples upload error:", error);
      toast.error("حدث خطأ أثناء رفع الصور");
    } finally {
      setIsSamplesUploading(false);
      if (samplesInputRef.current) samplesInputRef.current.value = "";
    }
  };

  const removeSample = (index: number) => {
    const newSamples = productSamples.filter((_: any, i: number) => i !== index);
    setValue("productSamples", newSamples, { shouldValidate: true });
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4">
      <div>
        <h3 className="text-xl font-semibold mb-1 border-b pb-2">ملف المتجر</h3>
        <p className="text-sm text-muted-foreground mb-6">تفاصيل حول ما تبيعه، وهي المعلومات التي ستظهر للعملاء.</p>
      </div>

      <div className="space-y-5">
        {/* Logo Upload */}
        <div>
          <Label className="font-semibold block mb-2">شعار المتجر <span className="text-red-500">*</span></Label>
          <input 
            type="file" 
            accept="image/png, image/jpeg, image/jpg"
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <div 
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors ${logoUrl ? 'border-green-500 bg-green-50/50' : 'border-border cursor-pointer hover:bg-muted/50'}`}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                <p className="text-sm font-medium">جاري الرفع...</p>
              </>
            ) : logoUrl ? (
              <>
                <div className="relative group">
                  <img src={logoUrl} alt="Store Logo" className="w-16 h-16 object-cover rounded-lg shadow-sm border mb-2" />
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setValue("logoUrl", ""); }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-sm text-green-700 font-medium flex items-center gap-1"><Check className="w-4 h-4"/> تم رفع الشعار</p>
                <p className="text-xs text-muted-foreground mt-1">اضغط لتغيير الصورة</p>
              </>
            ) : (
              <>
                <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">اضغط لرفع الشعار</p>
                <p className="text-xs text-muted-foreground mt-1">صيغ PNG أو JPG بحجم لا يتجاوز 2 ميجابايت</p>
              </>
            )}
          </div>
          {errors.logoUrl && <p className="text-sm text-red-500 mt-1.5">{errors.logoUrl.message as string}</p>}
        </div>

        {/* Product Samples Upload */}
        <div className="bg-muted/30 border border-border p-4 rounded-xl">
          <Label className="font-semibold block mb-1">عينات من منتجاتك <span className="text-red-500">*</span></Label>
          <p className="text-xs text-muted-foreground mb-4">يرجى رفع 3 صور على الأقل لمنتجاتك للمراجعة.</p>
          
          <input 
            type="file" 
            multiple
            accept="image/*"
            className="hidden" 
            ref={samplesInputRef}
            onChange={handleSamplesUpload}
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {productSamples.map((url: string, index: number) => (
              <div key={index} className="relative group aspect-square border-2 border-border rounded-lg overflow-hidden bg-background">
                <img src={url} alt={`Sample ${index + 1}`} className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={() => removeSample(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            
            {productSamples.length < 10 && (
              <button
                type="button"
                onClick={() => !isSamplesUploading && samplesInputRef.current?.click()}
                disabled={isSamplesUploading}
                className="aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center hover:bg-muted/50 transition-colors"
              >
                {isSamplesUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-muted-foreground mb-1" />
                    <span className="text-[10px] font-medium text-muted-foreground">إضافة صورة</span>
                  </>
                )}
              </button>
            )}
          </div>
          {errors.productSamples && <p className="text-sm text-red-500 mt-1">{errors.productSamples.message as string}</p>}
        </div>

        {/* City Settings */}
        <div>
          <Label htmlFor="city" className="font-semibold">المدينة الرئيسية <span className="text-red-500">*</span></Label>
          <select 
            id="city"
            {...register("city")}
            className={`flex h-10 w-full mt-1.5 items-center justify-between rounded-md border bg-background text-foreground px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${errors.city ? "border-red-500" : "border-input"}`}
          >
            <option value="">اختر مدينتك...</option>
            {SUDAN_CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {errors.city && <p className="text-sm text-red-500 mt-1">{errors.city.message}</p>}
        </div>

        {/* Description */}
        <div>
          <div className="flex justify-between items-end mb-1.5">
            <Label htmlFor="description" className="font-semibold">وصف المتجر <span className="text-red-500">*</span></Label>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={handleAiCategories} 
              disabled={isAiLoading || !description || description.length < 10}
              className="text-xs h-7 py-0 px-2"
            >
              {isAiLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
              اقتراح فئات
            </Button>
          </div>
          <Textarea 
            id="description"
            rows={4}
            placeholder="أخبر العملاء عن طبيعة متجرك وما تبيعه..." 
            {...register("description")} 
            className={`resize-none ${errors.description ? "border-red-500" : ""}`}
            onBlur={() => {
              if (description?.length > 15 && categories.length === 0 && suggestedCategories.length === 0) {
                 handleAiCategories(); // Optional auto-fetch
              }
            }}
          />
          {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>}
        </div>

        {/* Categories */}
        <div className="bg-muted/30 border border-border p-4 rounded-xl">
          <Label className="font-semibold block mb-2">فئات المتجر <span className="text-red-500">*</span></Label>
          
          {/* Selected Categories Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {categories.map(c => (
              <span key={c} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                {c}
                <button type="button" onClick={() => removeCategory(c)} className="hover:opacity-75">&times;</button>
              </span>
            ))}
          </div>

          {/* AI Suggested Tags */}
          {suggestedCategories.length > 0 && (
            <div className="mb-3 pt-2 border-t border-gray-200">
               <p className="text-xs text-blue-600 font-medium mb-1.5">اقتراحات الذكاء الاصطناعي (اضغط للإضافة):</p>
               <div className="flex flex-wrap gap-2">
                 {suggestedCategories.filter(sc => !categories.includes(sc)).map(sc => (
                   <button 
                     type="button" 
                     key={sc} 
                     onClick={() => addCategory(sc)}
                     className="text-xs px-2 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100"
                   >
                     + {sc}
                   </button>
                 ))}
               </div>
            </div>
          )}

          {/* Add Manual Category */}
          <div className="flex gap-2">
            <Input 
              placeholder="إضافة فئة يدوياً..." 
              value={categoryInput}
              onChange={(e) => setCategoryInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCategory(categoryInput);
                }
              }}
            />
            <Button type="button" variant="secondary" onClick={() => addCategory(categoryInput)}>إضافة</Button>
          </div>
          {errors.categories && <p className="text-sm text-red-500 mt-1">{errors.categories.message}</p>}
        </div>

      </div>
    </div>
  );
}
