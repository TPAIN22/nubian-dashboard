// src/app/categories/edit/[id]/page.tsx
import React from "react";
import EditCategoryClient from "./EditCategoryClient";

interface EditCategoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const resolvedParams = await params;
  const { id: categoryId } = resolvedParams;
  
  return <EditCategoryClient categoryId={categoryId} />;
}
