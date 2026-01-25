import React from "react";
import LocationsClient from "./LocationsClient";

// تعريف أنواع البيانات
export interface Country {
  _id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface City {
  _id: string;
  countryId: string;
  nameAr: string;
  nameEn: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubCity {
  _id: string;
  cityId: string;
  nameAr: string;
  nameEn: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

async function LocationsPage() {
  return <LocationsClient />;
}

export default LocationsPage;

// إعدادات Next.js للـ caching والـ revalidation
export const revalidate = 60; // إعادة التحقق كل 60 ثانية
export const dynamic = 'force-dynamic'; // فرض التحديث الديناميكي