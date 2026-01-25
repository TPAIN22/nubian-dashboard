"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { axiosInstance } from "@/lib/axiosInstance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { IconPlus, IconEdit, IconTrash, IconMapPin } from "@tabler/icons-react";
import type { Country, City, SubCity } from "./page";

interface LocationFormData {
  code?: string;
  nameAr: string;
  nameEn: string;
  isActive: boolean;
  sortOrder: number;
}

export default function LocationsClient() {
  const { getToken } = useAuth();

  // State management
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [subCities, setSubCities] = useState<SubCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  // Dialog states
  const [countryDialog, setCountryDialog] = useState(false);
  const [cityDialog, setCityDialog] = useState(false);
  const [subCityDialog, setSubCityDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form states
  const [countryForm, setCountryForm] = useState<LocationFormData>({
    code: "",
    nameAr: "",
    nameEn: "",
    isActive: true,
    sortOrder: 0
  });

  const [cityForm, setCityForm] = useState<LocationFormData>({
    nameAr: "",
    nameEn: "",
    isActive: true,
    sortOrder: 0
  });

  const [subCityForm, setSubCityForm] = useState<LocationFormData>({
    nameAr: "",
    nameEn: "",
    isActive: true,
    sortOrder: 0
  });

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [countriesRes, citiesRes, subCitiesRes] = await Promise.all([
        axiosInstance.get("/locations/countries"),
        axiosInstance.get("/locations/cities"),
        axiosInstance.get("/locations/subcities")
      ]);

      setCountries(countriesRes.data.data || []);
      setCities(citiesRes.data.data || []);
      setSubCities(subCitiesRes.data.data || []);
    } catch (error) {
      toast.error("فشل في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Helper functions
  const resetForms = () => {
    setCountryForm({ code: "", nameAr: "", nameEn: "", isActive: true, sortOrder: 0 });
    setCityForm({ nameAr: "", nameEn: "", isActive: true, sortOrder: 0 });
    setSubCityForm({ nameAr: "", nameEn: "", isActive: true, sortOrder: 0 });
    setEditingItem(null);
  };

  const openCountryDialog = (country?: Country) => {
    if (country) {
      setCountryForm({
        code: country.code,
        nameAr: country.nameAr,
        nameEn: country.nameEn,
        isActive: country.isActive,
        sortOrder: country.sortOrder
      });
      setEditingItem(country);
    } else {
      resetForms();
    }
    setCountryDialog(true);
  };

  const openCityDialog = (city?: City) => {
    if (city) {
      setCityForm({
        nameAr: city.nameAr,
        nameEn: city.nameEn,
        isActive: city.isActive,
        sortOrder: city.sortOrder
      });
      setEditingItem(city);
    } else {
      resetForms();
    }
    setCityDialog(true);
  };

  const openSubCityDialog = (subCity?: SubCity) => {
    if (subCity) {
      setSubCityForm({
        nameAr: subCity.nameAr,
        nameEn: subCity.nameEn,
        isActive: subCity.isActive,
        sortOrder: subCity.sortOrder
      });
      setEditingItem(subCity);
    } else {
      resetForms();
    }
    setSubCityDialog(true);
  };

  // CRUD operations
  const handleCountrySubmit = async () => {
    try {
      // Frontend validation
      if (!countryForm.code?.trim()) {
        toast.error("رمز الدولة مطلوب");
        return;
      }
      if (!countryForm.nameAr.trim()) {
        toast.error("الاسم بالعربية مطلوب");
        return;
      }
      if (!countryForm.nameEn.trim()) {
        toast.error("الاسم بالإنجليزية مطلوب");
        return;
      }

      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      if (editingItem) {
        await axiosInstance.put(`/locations/countries/${editingItem._id}`, countryForm, { headers });
        toast.success("تم تحديث الدولة بنجاح");
      } else {
        await axiosInstance.post("/locations/countries", countryForm, { headers });
        toast.success("تم إضافة الدولة بنجاح");
      }
      setCountryDialog(false);
      resetForms();
      loadData();
    } catch (error: any) {
      console.error('Country submit error:', error.response?.data);

      // Check for detailed validation errors
      const errorData = error.response?.data?.error;
      let errorMessage = "فشل في حفظ الدولة";

      if (errorData?.details && Array.isArray(errorData.details)) {
        const firstError = errorData.details[0];
        errorMessage = `${firstError.field}: ${firstError.message}`;
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast.error(errorMessage);
    }
  };

  const handleCitySubmit = async () => {
    try {
      if (!selectedCountry) {
        toast.error("يرجى اختيار دولة أولاً");
        return;
      }

      // Frontend validation
      if (!cityForm.nameAr?.trim()) {
        toast.error("الاسم بالعربية مطلوب");
        return;
      }
      if (!cityForm.nameEn?.trim()) {
        toast.error("الاسم بالإنجليزية مطلوب");
        return;
      }

      // Ensure sortOrder is a number
      const formData = {
        ...cityForm,
        sortOrder: Number(cityForm.sortOrder) || 0
      };

      console.log('Submitting city data:', formData); // Debug log

      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      if (editingItem) {
        await axiosInstance.put(`/locations/cities/${editingItem._id}`, formData, { headers });
        toast.success("تم تحديث المدينة بنجاح");
      } else {
        await axiosInstance.post(`/locations/countries/${selectedCountry._id}/cities`, formData, { headers });
        toast.success("تم إضافة المدينة بنجاح");
      }
      setCityDialog(false);
      resetForms();
      loadData();
    } catch (error: any) {
      console.error('City submit error:', error.response?.data); // Debug log

      // Check for detailed validation errors
      const errorData = error.response?.data?.error;
      let errorMessage = "فشل في حفظ المدينة";

      if (errorData?.details && Array.isArray(errorData.details)) {
        // Show the first validation error
        const firstError = errorData.details[0];
        errorMessage = `${firstError.field}: ${firstError.message}`;
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast.error(errorMessage);
    }
  };

  const handleSubCitySubmit = async () => {
    try {
      if (!selectedCity) {
        toast.error("يرجى اختيار مدينة أولاً");
        return;
      }

      // Frontend validation
      if (!subCityForm.nameAr.trim()) {
        toast.error("الاسم بالعربية مطلوب");
        return;
      }
      if (!subCityForm.nameEn.trim()) {
        toast.error("الاسم بالإنجليزية مطلوب");
        return;
      }

      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      if (editingItem) {
        await axiosInstance.put(`/locations/subcities/${editingItem._id}`, subCityForm, { headers });
        toast.success("تم تحديث الحي بنجاح");
      } else {
        await axiosInstance.post(`/locations/cities/${selectedCity._id}/subcities`, subCityForm, { headers });
        toast.success("تم إضافة الحي بنجاح");
      }
      setSubCityDialog(false);
      resetForms();
      loadData();
    } catch (error: any) {
      console.error('SubCity submit error:', error.response?.data);

      // Check for detailed validation errors
      const errorData = error.response?.data?.error;
      let errorMessage = "فشل في حفظ الحي";

      if (errorData?.details && Array.isArray(errorData.details)) {
        const firstError = errorData.details[0];
        errorMessage = `${firstError.field}: ${firstError.message}`;
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast.error(errorMessage);
    }
  };

  const handleDelete = async (type: 'country' | 'city' | 'subcity', id: string) => {
    const confirmed = window.confirm("هل أنت متأكد من حذف هذا العنصر؟");
    if (!confirmed) return;

    try {
      console.log(`Deleting ${type} with ID: ${id}`);
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      let endpoint = "";
      if (type === 'country') endpoint = `/locations/countries/${id}`;
      else if (type === 'city') endpoint = `/locations/cities/${id}`;
      else if (type === 'subcity') endpoint = `/locations/subcities/${id}`;

      console.log(`Making DELETE request to: ${endpoint}`);
      await axiosInstance.delete(endpoint, { headers });
      console.log(`${type} deleted successfully`);
      toast.success("تم الحذف بنجاح");
      loadData();
    } catch (error: any) {
      console.error('Delete error:', error.response?.data);
      const errorMessage = error.response?.data?.error?.message ||
                          error.response?.data?.message ||
                          "فشل في الحذف";
      toast.error(errorMessage);
    }
  };

  // Filter data based on selections
  const filteredCities = selectedCountry ? cities.filter(city => city.countryId === selectedCountry._id) : [];
  const filteredSubCities = selectedCity ? subCities.filter(subCity => subCity.cityId === selectedCity._id) : [];

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
      <div className="max-w-7xl mx-auto">
        {/* رأس الصفحة */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-primary mb-2">
            إدارة المناطق الجغرافية
          </h1>
          <p className="text-lg text-muted-foreground">
            إدارة الدول والمدن والأحياء للمتجر
          </p>
        </div>

        {/* إحصائيات سريعة */}
        <div className="bg-card rounded-lg p-6 mb-6 border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <h3 className="text-2xl font-bold text-primary">{countries.length}</h3>
              <p className="text-muted-foreground">الدول</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-primary">{cities.length}</h3>
              <p className="text-muted-foreground">المدن</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-primary">{subCities.length}</h3>
              <p className="text-muted-foreground">الأحياء</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-primary">
                {countries.filter(c => c.isActive).length +
                 cities.filter(c => c.isActive).length +
                 subCities.filter(s => s.isActive).length}
              </h3>
              <p className="text-muted-foreground">المناطق النشطة</p>
            </div>
          </div>
        </div>

        {/* الواجهة الثلاثية */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* الدول */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <IconMapPin className="h-5 w-5" />
                الدول
              </CardTitle>
              <Button onClick={() => openCountryDialog()} size="sm">
                <IconPlus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {countries.map((country) => (
                  <div
                    key={country._id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedCountry?._id === country._id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                    }`}
                    onClick={() => setSelectedCountry(country)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{country.nameEn}</p>
                        <p className="text-sm text-muted-foreground">{country.nameAr}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={country.isActive} disabled onCheckedChange={() => {}} />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openCountryDialog(country);
                          }}
                        >
                          <IconEdit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete('country', country._id);
                          }}
                        >
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* المدن */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <IconMapPin className="h-5 w-5" />
                المدن
                {selectedCountry && <span className="text-sm font-normal">({selectedCountry.nameEn})</span>}
              </CardTitle>
              <Button
                onClick={() => openCityDialog()}
                size="sm"
                disabled={!selectedCountry}
              >
                <IconPlus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredCities.map((city) => (
                  <div
                    key={city._id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedCity?._id === city._id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                    }`}
                    onClick={() => setSelectedCity(city)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{city.nameEn}</p>
                        <p className="text-sm text-muted-foreground">{city.nameAr}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={city.isActive} disabled onCheckedChange={() => {}} />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openCityDialog(city);
                          }}
                        >
                          <IconEdit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete('city', city._id);
                          }}
                        >
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {selectedCountry && filteredCities.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    لا توجد مدن لهذه الدولة
                  </p>
                )}
                {!selectedCountry && (
                  <p className="text-center text-muted-foreground py-4">
                    اختر دولة لعرض مدنها
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* الأحياء */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <IconMapPin className="h-5 w-5" />
                الأحياء
                {selectedCity && <span className="text-sm font-normal">({selectedCity.nameEn})</span>}
              </CardTitle>
              <Button
                onClick={() => openSubCityDialog()}
                size="sm"
                disabled={!selectedCity}
              >
                <IconPlus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredSubCities.map((subCity) => (
                  <div key={subCity._id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{subCity.nameEn}</p>
                        <p className="text-sm text-muted-foreground">{subCity.nameAr}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={subCity.isActive} disabled onCheckedChange={() => {}}  />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openSubCityDialog(subCity)}
                        >
                          <IconEdit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete('subcity', subCity._id)}
                        >
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {selectedCity && filteredSubCities.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    لا توجد أحياء لهذه المدينة
                  </p>
                )}
                {!selectedCity && (
                  <p className="text-center text-muted-foreground py-4">
                    اختر مدينة لعرض أحيائها
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dialogs */}
        {/* Country Dialog */}
        <Dialog open={countryDialog} onOpenChange={setCountryDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? 'تعديل دولة' : 'إضافة دولة جديدة'}</DialogTitle>
              <DialogDescription>
                {editingItem ? 'قم بتعديل معلومات الدولة' : 'أدخل معلومات الدولة الجديدة'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="countryCode">رمز الدولة</Label>
                <Input
                  id="countryCode"
                  value={countryForm.code}
                  onChange={(e) => setCountryForm({...countryForm, code: e.target.value.toUpperCase()})}
                  placeholder="مثال: EG, SA, AE"
                />
              </div>
              <div>
                <Label htmlFor="countryNameEn">الاسم بالإنجليزية</Label>
                <Input
                  id="countryNameEn"
                  value={countryForm.nameEn}
                  onChange={(e) => setCountryForm({...countryForm, nameEn: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="countryNameAr">الاسم بالعربية</Label>
                <Input
                  id="countryNameAr"
                  value={countryForm.nameAr}
                  onChange={(e) => setCountryForm({...countryForm, nameAr: e.target.value})}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="countryActive"
                  checked={countryForm.isActive}
                  onCheckedChange={(checked) => setCountryForm({...countryForm, isActive: checked})}
                />
                <Label htmlFor="countryActive">نشط</Label>
              </div>
              <div>
                <Label htmlFor="countrySortOrder">ترتيب العرض</Label>
                <Input
                  id="countrySortOrder"
                  type="number"
                  value={countryForm.sortOrder}
                  onChange={(e) => setCountryForm({...countryForm, sortOrder: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCountryDialog(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleCountrySubmit}>
                  {editingItem ? 'تحديث' : 'إضافة'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* City Dialog */}
        <Dialog open={cityDialog} onOpenChange={setCityDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? 'تعديل مدينة' : 'إضافة مدينة جديدة'}</DialogTitle>
              <DialogDescription>
                {editingItem ? 'قم بتعديل معلومات المدينة' : 'أدخل معلومات المدينة الجديدة'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="cityNameEn">الاسم بالإنجليزية</Label>
                <Input
                  id="cityNameEn"
                  value={cityForm.nameEn}
                  onChange={(e) => setCityForm({...cityForm, nameEn: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="cityNameAr">الاسم بالعربية</Label>
                <Input
                  id="cityNameAr"
                  value={cityForm.nameAr}
                  onChange={(e) => setCityForm({...cityForm, nameAr: e.target.value})}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="cityActive"
                  checked={cityForm.isActive}
                  onCheckedChange={(checked) => setCityForm({...cityForm, isActive: checked})}
                />
                <Label htmlFor="cityActive">نشط</Label>
              </div>
              <div>
                <Label htmlFor="citySortOrder">ترتيب العرض</Label>
                <Input
                  id="citySortOrder"
                  type="number"
                  value={cityForm.sortOrder}
                  onChange={(e) => setCityForm({...cityForm, sortOrder: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCityDialog(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleCitySubmit}>
                  {editingItem ? 'تحديث' : 'إضافة'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* SubCity Dialog */}
        <Dialog open={subCityDialog} onOpenChange={setSubCityDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? 'تعديل حي' : 'إضافة حي جديد'}</DialogTitle>
              <DialogDescription>
                {editingItem ? 'قم بتعديل معلومات الحي' : 'أدخل معلومات الحي الجديد'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="subCityNameEn">الاسم بالإنجليزية</Label>
                <Input
                  id="subCityNameEn"
                  value={subCityForm.nameEn}
                  onChange={(e) => setSubCityForm({...subCityForm, nameEn: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="subCityNameAr">الاسم بالعربية</Label>
                <Input
                  id="subCityNameAr"
                  value={subCityForm.nameAr}
                  onChange={(e) => setSubCityForm({...subCityForm, nameAr: e.target.value})}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="subCityActive"
                  checked={subCityForm.isActive}
                  onCheckedChange={(checked) => setSubCityForm({...subCityForm, isActive: checked})}
                />
                <Label htmlFor="subCityActive">نشط</Label>
              </div>
              <div>
                <Label htmlFor="subCitySortOrder">ترتيب العرض</Label>
                <Input
                  id="subCitySortOrder"
                  type="number"
                  value={subCityForm.sortOrder}
                  onChange={(e) => setSubCityForm({...subCityForm, sortOrder: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSubCityDialog(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleSubCitySubmit}>
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