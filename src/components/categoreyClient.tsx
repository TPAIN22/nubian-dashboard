// src/app/categories/page.tsx (أو حيث تستخدم CategoryListClient)
'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { axiosInstance } from '@/lib/axiosInstance';
import { useAuth } from '@clerk/nextjs';
import { Button } from './ui/button';
import { PlusCircle, MoreHorizontal, Trash2, Edit } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Category {
  _id: string;
  name: string;
  description?: string;
  parent?: {
    _id: string;
    name: string;
  } | null;
}

interface CategoryListClientProps {
  categories: Category[];
}

export default function CategoryListClient({ categories: initialCategories }: CategoryListClientProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const organizedCategories = useMemo(() => {
    const categoryMap: Record<string, Category & { children: Category[] }> = {};
    const topLevelCategories: (Category & { children: Category[] })[] = [];

    // Initialize map with children arrays
    initialCategories.forEach(cat => {
      categoryMap[cat._id] = { ...cat, children: [] };
    });

    // Populate children arrays
    initialCategories.forEach(cat => {
      if (cat.parent) {
        categoryMap[cat.parent._id]?.children.push(categoryMap[cat._id]);
      } else {
        topLevelCategories.push(categoryMap[cat._id]);
      }
    });

    // Flatten the list for rendering with better hierarchy display
    const flatList: (Category & { level: number; isParent: boolean })[] = [];
    const traverse = (category: Category, level: number) => {
      const isParent = categoryMap[category._id].children.length > 0;
      flatList.push({ ...category, level, isParent });
      (categoryMap[category._id].children || []).forEach(child => traverse(child, level + 1));
    };

    topLevelCategories.forEach(cat => traverse(cat, 0));
    return flatList;
  }, [initialCategories]);

  const handleAddNewCategory = () => {
    router.push('/categories/new');
  };

  const handleEditCategory = (categoryId: string) => {
    router.push(`/categories/edit/${categoryId}`);
  };
  
  const openDeleteDialog = (category: Category) => {
    setCategoryToDelete(category);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      const token = await getToken();
      await axiosInstance.delete(`/categories/${categoryToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCategories(prev => prev.filter(cat => cat._id !== categoryToDelete._id));
      initialCategories = initialCategories.filter(c => c._id !== categoryToDelete._id)
      
      toast.success(`تم حذف الفئة "${categoryToDelete.name}" بنجاح.`);
      router.refresh()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "فشل حذف الفئة. يرجى المحاولة مرة أخرى.");
    } finally {
      setCategoryToDelete(null);
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-6">
        <Button onClick={handleAddNewCategory} className="flex items-center gap-2">
          <PlusCircle className="h-5 w-5" />
          <span>إضافة فئة جديدة</span>
        </Button>
      </div>
      
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead className="hidden md:table-cell">الوصف</TableHead>
              <TableHead className="hidden sm:table-cell">الفئة الرئيسية</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizedCategories.map((category) => (
              <TableRow key={category._id}>
                <TableCell style={{ paddingLeft: `${category.level * 20 + 10}px` }}>
                  <div className="flex items-center gap-2">
                    {category.level > 0 && (
                      <span className="text-gray-400">└─</span>
                    )}
                    {category.isParent && (
                      <span className="text-blue-500 text-xs">📁</span>
                    )}
                    <span className={category.isParent ? "font-semibold" : ""}>
                      {category.name}
                    </span>
                    {category.isParent && (
                      <span className="text-xs text-gray-500 ml-2">
                        ({category.children?.length || 0} فئة فرعية)
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{category.description}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  {category.parent?.name ? (
                    <span className="text-blue-600">{category.parent.name}</span>
                  ) : (
                    <span className="text-gray-500">فئة رئيسية</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditCategory(category._id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>تعديل</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openDeleteDialog(category)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>حذف</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف الفئة بشكل دائم.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className="bg-red-600 hover:bg-red-700">
              تأكيد الحذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}