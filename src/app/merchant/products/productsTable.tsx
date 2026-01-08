"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, Edit, Trash2, Eye, Download, RefreshCw, Power, PowerOff } from "lucide-react"
import { useRouter } from "next/navigation"
import { axiosInstance } from '@/lib/axiosInstance'
import { toast } from 'sonner'
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

export type Product = {
  _id: string
  name: string
  price: number
  discountPrice: number
  stock: number
  isActive: boolean
  description: string
  images: string[]
  sizes: string[]
  category?: {
    _id: string
    name: string
  } | string
  createdAt: string
  updatedAt: string
}

interface ProductsTableProps {
  productsData: Product[]
  getToken: () => Promise<string | null>
  onProductUpdate?: () => void | Promise<void>
}

function ProductDetailsDialog({ product }: { product: Product }) {
  const categoryName = (typeof product.category === 'object' && product.category !== null && 'name' in product.category
    ? product.category.name
    : typeof product.category === 'string' ? product.category : null) || 'غير محدد';
  
  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{product.name}</DialogTitle>
        <DialogDescription>تفاصيل المنتج</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        {product.images && product.images.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">الصور</h3>
            <div className="grid grid-cols-2 gap-2">
              {product.images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border">
                  <Image
                    src={img}
                    alt={`${product.name} - ${idx + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-1">السعر</h3>
            <p className="text-muted-foreground">
              {new Intl.NumberFormat("ar-SD", {
                style: "currency",
                currency: "SDG",
              }).format(product.price)}
            </p>
          </div>
          {product.discountPrice && product.discountPrice > product.price && (
            <div>
              <h3 className="font-semibold mb-1">السعر قبل الخصم</h3>
              <p className="text-muted-foreground line-through">
                {new Intl.NumberFormat("ar-SD", {
                  style: "currency",
                  currency: "SDG",
                }).format(product.discountPrice)}
              </p>
            </div>
          )}
          <div>
            <h3 className="font-semibold mb-1">المخزون</h3>
            <p className={`${product.stock < 10 ? 'text-red-600 font-bold' : 'text-muted-foreground'}`}>
              {product.stock}
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">التصنيف</h3>
            <p className="text-muted-foreground">{categoryName}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">الحالة</h3>
            <Badge variant={product.isActive ? "default" : "secondary"}>
              {product.isActive ? "نشط" : "غير نشط"}
            </Badge>
          </div>
          {product.sizes && product.sizes.length > 0 && (
            <div>
              <h3 className="font-semibold mb-1">المقاسات</h3>
              <div className="flex flex-wrap gap-1">
                {product.sizes.map((size) => (
                  <Badge key={size} variant="outline">{size}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        {product.description && (
          <div>
            <h3 className="font-semibold mb-1">الوصف</h3>
            <p className="text-muted-foreground">{product.description}</p>
          </div>
        )}
        <div className="text-sm text-muted-foreground">
          <p>تاريخ الإنشاء: {new Date(product.createdAt).toLocaleDateString('ar-SA')}</p>
          <p>آخر تحديث: {new Date(product.updatedAt).toLocaleDateString('ar-SA')}</p>
        </div>
      </div>
    </DialogContent>
  );
}

export function ProductsTable({ productsData, getToken, onProductUpdate }: ProductsTableProps) {
  const router = useRouter()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [togglingId, setTogglingId] = React.useState<string | null>(null)
  const [bulkDeleting, setBulkDeleting] = React.useState(false)
  const [bulkToggling, setBulkToggling] = React.useState(false)
  const [refreshing, setRefreshing] = React.useState(false)

  const handleDelete = async (productId: string) => {
    setDeletingId(productId)
    try {
      const token = await getToken()
      
      if (!token) {
        toast.error('فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.')
        setDeletingId(null)
        return
      }
      
      await axiosInstance.delete(`/products/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      toast.success('تم حذف المنتج بنجاح')
      if (onProductUpdate) {
        await onProductUpdate()
      } else {
        window.location.reload()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل حذف المنتج')
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleActive = async (productId: string, currentStatus: boolean) => {
    setTogglingId(productId)
    try {
      const token = await getToken()
      
      if (!token) {
        toast.error('فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.')
        setTogglingId(null)
        return
      }
      
      await axiosInstance.patch(`/products/${productId}`, {
        isActive: !currentStatus
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      toast.success(`تم ${!currentStatus ? 'تفعيل' : 'إلغاء تفعيل'} المنتج بنجاح`)
      if (onProductUpdate) {
        await onProductUpdate()
      } else {
        window.location.reload()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل تحديث حالة المنتج')
    } finally {
      setTogglingId(null)
    }
  }

  const columns: ColumnDef<Product>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "images",
      header: "الصورة",
      cell: ({ row }) => {
        const images = row.getValue("images") as string[]
        return (
          <div className="relative w-16 h-16 rounded-lg overflow-hidden border">
            {images && images.length > 0 ? (
              <Image
                src={images[0]}
                alt={row.original.name}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs">
                لا توجد صورة
              </div>
            )}
          </div>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            اسم المنتج
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "category",
      header: "التصنيف",
      cell: ({ row }) => {
        const category = row.getValue("category")
        let categoryName: string = 'غير محدد'
        if (typeof category === 'object' && category !== null && 'name' in category) {
          categoryName = category.name || 'غير محدد'
        } else if (typeof category === 'string') {
          categoryName = category || 'غير محدد'
        }
        return <div>{categoryName}</div>
      },
    },
    {
      accessorKey: "price",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-right"
          >
            السعر
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const price = parseFloat(row.getValue("price"))
        const formatted = new Intl.NumberFormat("ar-SD", {
          style: "currency",
          currency: "SDG",
        }).format(price)
        return <div className="text-right font-medium">{formatted}</div>
      },
    },
    {
      accessorKey: "discountPrice",
      header: () => <div className="text-right">السعر قبل الخصم</div>,
      cell: ({ row }) => {
        const originalPrice = parseFloat(row.getValue("discountPrice") as string) || 0
        const currentPrice = parseFloat(row.getValue("price") as string)
        
        if (originalPrice > currentPrice && originalPrice > 0) {
          const formatted = new Intl.NumberFormat("ar-SD", {
            style: "currency",
            currency: "SDG",
          }).format(originalPrice)
          
          return (
            <div className="text-right font-medium">
              <span className="line-through text-muted-foreground">{formatted}</span>
            </div>
          )
        }
        return <div className="text-right text-muted-foreground">-</div>
      },
    },
    {
      accessorKey: "stock",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-right"
          >
            المخزون
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const stock = row.getValue("stock") as number
        return (
          <div className={`text-right ${stock < 10 ? 'text-red-600 font-bold' : ''}`}>
            {stock}
          </div>
        )
      },
    },
    {
      accessorKey: "isActive",
      header: "الحالة",
      cell: ({ row }) => {
        const product = row.original
        const isActive = row.getValue("isActive") as boolean
        return (
          <div className="flex items-center gap-2">
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "نشط" : "غير نشط"}
            </Badge>
            <Switch
              checked={isActive}
              onCheckedChange={() => handleToggleActive(product._id, isActive)}
              disabled={togglingId === product._id}
            />
          </div>
        )
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const product = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
              <Dialog>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Eye className="mr-2 h-4 w-4" />
                    عرض التفاصيل
                  </DropdownMenuItem>
                </DialogTrigger>
                <ProductDetailsDialog product={product} />
              </Dialog>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(product._id)}
              >
                نسخ معرف المنتج
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/merchant/products/${product._id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                تعديل المنتج
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    حذف المنتج
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                    <AlertDialogDescription>
                      سيتم حذف المنتج &quot;{product.name}&quot; نهائياً. لا يمكن التراجع عن هذا الإجراء.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(product._id)}
                      disabled={deletingId === product._id}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {deletingId === product._id ? 'جاري الحذف...' : 'حذف'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  // Ensure productsData is always an array
  const safeProductsData = Array.isArray(productsData) ? productsData : []

  const table = useReactTable({
    data: safeProductsData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  const handleBulkDelete = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    if (selectedRows.length === 0) {
      toast.error('لم يتم اختيار أي منتجات')
      return
    }

    setBulkDeleting(true)
    try {
      const token = await getToken()
      
      if (!token) {
        toast.error('فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.')
        setBulkDeleting(false)
        return
      }

      const deletePromises = selectedRows.map(row => 
        axiosInstance.delete(`/products/${row.original._id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      )

      await Promise.all(deletePromises)
      toast.success(`تم حذف ${selectedRows.length} منتج بنجاح`)
      setRowSelection({})
      if (onProductUpdate) {
        await onProductUpdate()
      } else {
        window.location.reload()
      }
    } catch (error: any) {
      toast.error('فشل حذف بعض المنتجات')
    } finally {
      setBulkDeleting(false)
    }
  }

  const handleBulkToggleActive = async (activate: boolean) => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    if (selectedRows.length === 0) {
      toast.error('لم يتم اختيار أي منتجات')
      return
    }

    setBulkToggling(true)
    try {
      const token = await getToken()
      
      if (!token) {
        toast.error('فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.')
        setBulkToggling(false)
        return
      }

      const togglePromises = selectedRows.map(row => 
        axiosInstance.patch(`/products/${row.original._id}`, {
          isActive: activate
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      )

      await Promise.all(togglePromises)
      toast.success(`تم ${activate ? 'تفعيل' : 'إلغاء تفعيل'} ${selectedRows.length} منتج بنجاح`)
      setRowSelection({})
      if (onProductUpdate) {
        await onProductUpdate()
      } else {
        window.location.reload()
      }
    } catch (error: any) {
      toast.error('فشل تحديث حالة بعض المنتجات')
    } finally {
      setBulkToggling(false)
    }
  }

  // CSV escaping function according to RFC 4180
  const escapeCsvField = (value: any): string => {
    if (value === null || value === undefined) {
      return ''
    }
    const stringValue = String(value)
    // If field contains comma, newline, or quote, wrap in quotes and escape internal quotes
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`
    }
    return stringValue
  }

  const handleExport = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    const dataToExport = selectedRows.length > 0 
      ? selectedRows.map(row => row.original)
      : safeProductsData

    const csv = [
      ['اسم المنتج', 'السعر', 'السعر قبل الخصم', 'المخزون', 'الحالة', 'التصنيف', 'تاريخ الإنشاء'].map(escapeCsvField).join(','),
      ...dataToExport.map(product => [
        product.name,
        product.price,
        product.discountPrice || '',
        product.stock,
        product.isActive ? 'نشط' : 'غير نشط',
        (typeof product.category === 'object' && product.category !== null && 'name' in product.category
          ? product.category.name
          : typeof product.category === 'string' ? product.category : '') || '',
        new Date(product.createdAt).toLocaleDateString('ar-SA')
      ].map(escapeCsvField).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.href = url
    link.download = `products_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    // Revoke the object URL after a short delay to allow the download to start
    setTimeout(() => URL.revokeObjectURL(url), 100)
    toast.success('تم تصدير البيانات بنجاح')
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      if (onProductUpdate) {
        await onProductUpdate()
      } else {
        window.location.reload()
        return // reload() will navigate away, so no need to set refreshing to false
      }
    } finally {
      // Only set refreshing to false if we didn't reload
      if (onProductUpdate) {
        setRefreshing(false)
      }
    }
  }

  const selectedRowsCount = table.getFilteredSelectedRowModel().rows.length

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2 flex-1">
          <Input
            placeholder="البحث عن المنتجات..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          {selectedRowsCount > 0 && (
            <div className="flex items-center gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={bulkDeleting}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    حذف المحدد ({selectedRowsCount})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                    <AlertDialogDescription>
                      سيتم حذف {selectedRowsCount} منتج نهائياً. لا يمكن التراجع عن هذا الإجراء.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleBulkDelete}
                      disabled={bulkDeleting}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {bulkDeleting ? 'جاري الحذف...' : 'حذف'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleBulkToggleActive(true)}
                disabled={bulkDeleting || bulkToggling}
              >
                <Power className="mr-2 h-4 w-4" />
                تفعيل المحدد
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleBulkToggleActive(false)}
                disabled={bulkDeleting || bulkToggling}
              >
                <PowerOff className="mr-2 h-4 w-4" />
                إلغاء تفعيل المحدد
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="mr-2 h-4 w-4" />
            تصدير
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                الأعمدة <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id === "name" ? "اسم المنتج" : 
                       column.id === "images" ? "الصورة" :
                       column.id === "category" ? "التصنيف" :
                       column.id === "price" ? "السعر" : 
                       column.id === "discountPrice" ? "السعر قبل الخصم" :
                       column.id === "stock" ? "المخزون" : 
                       column.id === "isActive" ? "الحالة" : 
                       column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {safeProductsData.length === 0 
                    ? "لا توجد منتجات متاحة." 
                    : "لا توجد نتائج."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} من{" "}
          {table.getFilteredRowModel().rows.length} صف(وف) محدد.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            السابق
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            التالي
          </Button>
        </div>
      </div>
    </div>
  )
}

