"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { shopApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue
} from "@/components/ui/select";
import { IconMapPin, IconPlus, IconCheck } from "@tabler/icons-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Address {
   _id: string;
   name: string;
   city: string;
   area: string;
   street: string;
   building: string;
   phone: string;
   notes?: string;
   isDefault?: boolean;
}

interface AddressSelectorProps {
   selectedId: string | null;
   onSelect: (id: string, address: Address) => void;
}

export function AddressSelector({ selectedId, onSelect }: AddressSelectorProps) {
   const queryClient = useQueryClient();
   const [isOpen, setIsOpen] = useState(false);

   const [formData, setFormData] = useState({
      name: "",
      phone: "",
      street: "",
      building: "",
      notes: "",
      countryId: "",
      cityId: "",
      subCityId: "",
      countryName: "",
      cityName: "",
      subCityName: ""
   });

   const { data: addresses, isLoading: loadingAddresses } = useQuery({
      queryKey: ["addresses"],
      queryFn: shopApi.getAddresses
   });

   const { data: countries } = useQuery({
      queryKey: ["countries"],
      queryFn: shopApi.getCountries,
      enabled: isOpen
   });

   const { data: cities } = useQuery({
      queryKey: ["cities", formData.countryId],
      queryFn: () => shopApi.getCities(formData.countryId),
      enabled: !!formData.countryId && isOpen
   });

   const { data: subCities } = useQuery({
      queryKey: ["subCities", formData.cityId],
      queryFn: () => shopApi.getSubCities(formData.cityId),
      enabled: !!formData.cityId && isOpen
   });

   const addMutation = useMutation({
      mutationFn: (data: any) =>
         shopApi.addAddress({
            ...data,
            area: data.subCityName
         }),
      onSuccess: (newAddress) => {
         queryClient.invalidateQueries({ queryKey: ["addresses"] });
         toast.success("تم إضافة العنوان بنجاح");
         setIsOpen(false);

         if (newAddress?._id) onSelect(newAddress._id, newAddress);

         setFormData({
            name: "",
            phone: "",
            street: "",
            building: "",
            notes: "",
            countryId: "",
            cityId: "",
            subCityId: "",
            countryName: "",
            cityName: "",
            subCityName: ""
         });
      },
      onError: () => toast.error("فشل إضافة العنوان")
   });

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      addMutation.mutate(formData);
   };

   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
   };

   if (loadingAddresses) {
      return <div className="text-center py-4 text-black">جاري تحميل العناوين...</div>;
   }

   return (
      <div className="space-y-4">
         {/* Address List */}
         <div className="grid grid-cols-1 gap-4">
            {addresses?.map((addr: Address) => (
               <div
                  key={addr._id}
                  onClick={() => onSelect(addr._id, addr)}
                  className={cn(
                     "cursor-pointer border-2 rounded-2xl p-4 transition-all hover:bg-zinc-50 relative",
                     selectedId === addr._id ? "border-black bg-zinc-50" : "border-zinc-100"
                  )}
               >
                  <div className="flex items-start gap-3">
                     <div
                        className={cn(
                           "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                           selectedId === addr._id ? "bg-black text-white" : "bg-zinc-100 text-black"
                        )}
                     >
                        <IconMapPin className="w-5 h-5" />
                     </div>

                     <div>
                        <div className="font-bold text-black">{addr.name}</div>
                        <div className="text-sm text-black mt-1">
                           {addr.city}، {addr.area}، {addr.street}
                        </div>
                        <div className="text-sm text-black">
                           {addr.building} • {addr.phone}
                        </div>
                     </div>

                     {selectedId === addr._id && (
                        <div className="mr-auto text-black">
                           <IconCheck className="w-6 h-6" />
                        </div>
                     )}
                  </div>
               </div>
            ))}
         </div>

         {/* Add New Address Dialog */}
         <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
               <Button
                  variant="outline"
                  className="w-full h-14 rounded-2xl border-dashed border-2 border-zinc-200 hover:border-black hover:bg-zinc-50 text-zinc-600 gap-3 text-base font-medium transition-all group"
               >
                  <div className="w-8 h-8 rounded-full bg-zinc-100 group-hover:bg-black group-hover:text-white flex items-center justify-center transition-colors">
                     <IconPlus className="w-5 h-5" />
                  </div>
                  إضافة عنوان جديد
               </Button>
            </DialogTrigger>

            {/* IMPORTANT: remove overflow from DialogContent to avoid clipping select popper */}
            <DialogContent
               className="sm:max-w-[600px] p-0 gap-0 bg-white border-0 shadow-2xl rounded-3xl"
               dir="rtl"
            >
               <DialogHeader className="p-6 pb-2 bg-zinc-50/50 border-b border-zinc-100">
                  <DialogTitle className="text-center text-xl font-bold flex items-center justify-center gap-2">
                     <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                        <IconMapPin className="w-5 h-5" />
                     </span>
                     تفاصيل العنوان الجديد
                  </DialogTitle>
               </DialogHeader>

               {/* Scroll is here now (not on DialogContent) */}
               <form
                  onSubmit={handleSubmit}
                  className="p-6 space-y-6 max-h-[75vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
               >
                  {/* Personal Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label className="text-black font-medium">الاسم</Label>
                        <Input
                           name="name"
                           required
                           value={formData.name}
                           onChange={handleInputChange}
                           placeholder="مثال: المنزل، العمل"
                           className="h-12 rounded-xl bg-white border-zinc-200 focus:ring-black text-black focus:border-black transition-all font-medium placeholder:text-zinc-400"
                        />
                     </div>

                     <div className="space-y-2">
                        <Label className="text-black font-medium">رقم الهاتف</Label>
                        <Input
                           name="phone"
                           required
                           type="tel"
                           value={formData.phone}
                           onChange={handleInputChange}
                           className="h-12 rounded-xl bg-white border-zinc-200 focus:ring-black text-black focus:border-black transition-all text-left font-mono placeholder:text-zinc-400"
                           dir="ltr"
                           placeholder="0912345678"
                        />
                     </div>
                  </div>

                  <div className="h-px bg-zinc-100" />

                  {/* Location Details */}
                  <div className="space-y-4">
                     {/* Country */}
                     <div className="space-y-2">
                        <Label className="text-black font-medium">الدولة</Label>

                        <Select
                           value={formData.countryId}
                           onValueChange={(id) => {
                              const country = countries?.find((c: any) => c._id === id);
                              setFormData({
                                 ...formData,
                                 countryId: id,
                                 countryName: country?.nameAr || country?.nameEn || "",
                                 cityId: "",
                                 cityName: "",
                                 subCityId: "",
                                 subCityName: ""
                              });
                           }}
                        >
                           <SelectTrigger
                              className={`h-12 rounded-xl bg-white border-zinc-200 focus:ring-black focus:border-black text-right dir-rtl
                      ${formData.countryId ? "text-black font-medium" : "text-zinc-400"}
                      data-[placeholder]:text-zinc-400
                      [&_[data-slot=select-value]]:text-black
                    `}
                           >
                              <SelectValue placeholder="اختر الدولة" />
                           </SelectTrigger>

                           <SelectContent
                              dir="rtl"
                              position="popper"
                              sideOffset={8}
                              className="bg-white border-zinc-200 z-[9999] shadow-xl rounded-xl"
                           >
                              {countries?.map((c: any) => (
                                 <SelectItem
                                    key={c._id}
                                    value={c._id}
                                    className="cursor-pointer text-black hover:bg-zinc-50 focus:bg-zinc-50 focus:text-black"
                                 >
                                    {c.nameAr || c.nameEn}
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        {/* City */}
                        <div className="space-y-2">
                           <Label className="text-black font-medium">المدينة</Label>

                           <Select
                              disabled={!formData.countryId}
                              value={formData.cityId}
                              onValueChange={(id) => {
                                 const city = cities?.find((c: any) => c._id === id);
                                 setFormData({
                                    ...formData,
                                    cityId: id,
                                    cityName: city?.nameAr || city?.nameEn || "",
                                    subCityId: "",
                                    subCityName: ""
                                 });
                              }}
                           >
                              <SelectTrigger
                                 className={`h-12 rounded-xl bg-white border-zinc-200 focus:ring-black focus:border-black text-right dir-rtl
                        disabled:opacity-50 disabled:bg-zinc-50
                        ${formData.cityId ? "text-black font-medium" : "text-zinc-400"}
                        data-[placeholder]:text-zinc-400
                        [&_[data-slot=select-value]]:text-black
                      `}
                              >
                                 <SelectValue placeholder="اختر المدينة" />
                              </SelectTrigger>

                              <SelectContent
                                 dir="rtl"
                                 position="popper"
                                 sideOffset={8}
                                 className="bg-white border-zinc-200 z-[9999] shadow-xl rounded-xl"
                              >
                                 {cities?.map((c: any) => (
                                    <SelectItem
                                       key={c._id}
                                       value={c._id}
                                       className="cursor-pointer text-black hover:bg-zinc-50 focus:bg-zinc-50 focus:text-black"
                                    >
                                       {c.nameAr || c.nameEn}
                                    </SelectItem>
                                 ))}
                              </SelectContent>
                           </Select>
                        </div>

                        {/* Area / SubCity */}
                        <div className="space-y-2">
                           <Label className="text-black font-medium">المنطقة</Label>

                           <Select
                              disabled={!formData.cityId}
                              value={formData.subCityId}
                              onValueChange={(id) => {
                                 const sub = subCities?.find((s: any) => s._id === id);
                                 setFormData({
                                    ...formData,
                                    subCityId: id,
                                    subCityName: sub?.nameAr || sub?.nameEn || ""
                                 });
                              }}
                           >
                              <SelectTrigger
                                 className={`h-12 rounded-xl bg-white border-zinc-200 focus:ring-black focus:border-black text-right dir-rtl
                        disabled:opacity-50 disabled:bg-zinc-50
                        ${formData.subCityId ? "text-black font-medium" : "text-zinc-400"}
                        data-[placeholder]:text-zinc-400
                        [&_[data-slot=select-value]]:text-black
                      `}
                              >
                                 <SelectValue placeholder="اختر المنطقة" />
                              </SelectTrigger>

                              <SelectContent
                                 dir="rtl"
                                 position="popper"
                                 sideOffset={8}
                                 className="bg-white border-zinc-200 z-[9999] shadow-xl rounded-xl"
                              >
                                 {subCities?.map((s: any) => (
                                    <SelectItem
                                       key={s._id}
                                       value={s._id}
                                       className="cursor-pointer text-black hover:bg-zinc-50 focus:bg-zinc-50 focus:text-black"
                                    >
                                       {s.nameAr || s.nameEn}
                                    </SelectItem>
                                 ))}
                              </SelectContent>
                           </Select>
                        </div>
                     </div>
                  </div>

                  <div className="h-px bg-zinc-100" />

                  {/* Street Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label className="text-black font-medium">الشارع</Label>
                        <Input
                           name="street"
                           required
                           value={formData.street}
                           onChange={handleInputChange}
                           className="h-12 rounded-xl bg-white border-zinc-200 focus:ring-black text-black focus:border-black transition-all font-medium placeholder:text-zinc-400"
                        />
                     </div>

                     <div className="space-y-2">
                        <Label className="text-black font-medium">المبنى / رقم المنزل</Label>
                        <Input
                           name="building"
                           required
                           value={formData.building}
                           onChange={handleInputChange}
                           className="h-12 rounded-xl bg-white border-zinc-200 focus:ring-black text-black focus:border-black transition-all font-medium placeholder:text-zinc-400"
                        />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <Label className="text-black font-medium">ملاحظات (اختياري)</Label>
                     <Input
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="علامة مميزة، تعليمات توصيل..."
                        className="h-12 rounded-xl bg-white border-zinc-200 focus:ring-black text-black focus:border-black transition-all font-medium placeholder:text-zinc-400"
                     />
                  </div>

                  <div className="pt-2">
                     <Button
                        type="submit"
                        className="w-full h-14 text-lg bg-black hover:bg-zinc-800 text-white rounded-xl shadow-lg shadow-black/10 hover:shadow-black/20 transition-all"
                        disabled={addMutation.isPending}
                     >
                        {addMutation.isPending ? "جاري الحفظ..." : "حفظ واستخدام العنوان"}
                     </Button>
                  </div>
               </form>
            </DialogContent>
         </Dialog>
      </div>
   );
}
