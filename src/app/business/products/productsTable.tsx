// productsTable.tsx

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
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Download,
  RefreshCw,
  Power,
  PowerOff,
  RotateCcw,
  AlertTriangle,
} from "lucide-react"
import { Star } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import logger from "@/lib/logger"
import { useAuth } from "@clerk/nextjs"
import { axiosInstance } from "@/lib/axiosInstance"
import { toast } from "sonner"
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
import { Label } from "@/components/ui/label"




export type Product = {
  _id: string
  name: string
  price: number
  discountPrice?: number // Legacy field
  merchantPrice?: number // Base merchant price
  nubianMarkup?: number // Nubian markup percentage
  dynamicMarkup?: number // Dynamic markup percentage
  finalPrice?: number // Smart pricing final price
  stock: number
  isActive: boolean
  description: string
  images: string[]
  sizes: string[]
  category?:
    | {
        _id: string
        name: string
      }
    | string
  merchant?: {
    _id: string
    businessName: string
    businessEmail: string
    status?: string
  }
  deletedAt?: string | null
  createdAt: string
  updatedAt: string
  // Ranking fields (admin-controlled)
  priorityScore?: number
  featured?: boolean
}

interface ProductsTableProps {
  productsData: Product[]
  getToken?: () => Promise<string | null>
  onProductUpdate?: () => void | Promise<void>
}

function RankingEditDialog({
  product,
  onSave,
  onCancel,
  isUpdating,
}: {
  product: Product
  onSave: (priorityScore: number, featured: boolean) => void
  onCancel: () => void
  isUpdating: boolean
}) {
  const [priorityScore, setPriorityScore] = React.useState<number>(
    product.priorityScore || 0
  )
  const [featured, setFeatured] = React.useState<boolean>(
    product.featured || false
  )

  const handleSave = () => {
    if (priorityScore < 0 || priorityScore > 100) {
      toast.error("يجب أن تكون الأولوية بين 0 و 100")
      return
    }
    onSave(priorityScore, featured)
  }

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="priorityScore">أولوية الترتيب (0-100)</Label>
        <Input
          id="priorityScore"
          type="number"
          min={0}
          max={100}
          value={priorityScore}
          onChange={(e) => {
            const value = parseInt(e.target.value) || 0
            setPriorityScore(Math.max(0, Math.min(100, value)))
          }}
          disabled={isUpdating}
        />
        <p className="text-sm text-muted-foreground">
          القيمة الأعلى = ترتيب أفضل في الصفحة الرئيسية. القيمة الافتراضية: 0
        </p>
      </div>

      <div className="flex items-center space-x-2 space-x-reverse">
        <Switch
          id="featured"
          checked={featured}
          onCheckedChange={setFeatured}
          disabled={isUpdating}
        />
        <Label htmlFor="featured" className="cursor-pointer">
          منتج مميز (يظهر في المقدمة دائماً)
        </Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={isUpdating}>
          إلغاء
        </Button>
        <Button onClick={handleSave} disabled={isUpdating}>
          {isUpdating ? "جاري الحفظ..." : "حفظ"}
        </Button>
      </div>
    </div>
  )
}

type BulkDeleteResult =
  | { ok: true; productId: string }
  | { ok: false; productId: string; productName?: string; error: any }

export function ProductsTable({
  productsData,
  getToken,
  onProductUpdate,
}: ProductsTableProps) {
  const router = useRouter()
  const { getToken: clerkGetToken } = useAuth()

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [togglingId, setTogglingId] = React.useState<string | null>(null)
  const [bulkDeleting, setBulkDeleting] = React.useState(false)
  const [bulkToggling, setBulkToggling] = React.useState(false)
  const [refreshing, setRefreshing] = React.useState(false)
  const [restoringId, setRestoringId] = React.useState<string | null>(null)
  const [hardDeletingId, setHardDeletingId] = React.useState<string | null>(
    null
  )
  const [updatingRankingId, setUpdatingRankingId] = React.useState<
    string | null
  >(null)
  const [rankingDialogOpen, setRankingDialogOpen] = React.useState<
    string | null
  >(null)

  const tokenGetter = getToken || clerkGetToken

  const handleDelete = async (productId: string) => {
    setDeletingId(productId)
    try {
      if (!productId || !/^[0-9a-fA-F]{24}$/.test(productId)) {
        toast.error("معرف المنتج غير صحيح")
        return
      }

      const token = await tokenGetter()
      if (!token) {
        toast.error("فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.")
        return
      }

      await axiosInstance.delete(`/products/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      toast.success("تم حذف المنتج بنجاح")
      if (onProductUpdate) await onProductUpdate()
      else window.location.reload()
    } catch (error: any) {
      logger.error("Error deleting product", {
        error: error instanceof Error ? error.message : String(error),
        status: error.response?.status,
        responseData: error.response?.data,
        productId,
      })

      const errorData = error.response?.data
      const errorMessage =
        errorData?.message ||
        errorData?.error?.message ||
        errorData?.error ||
        "فشل حذف المنتج"

      if (error.response?.status === 400) {
        const validationDetails = errorData?.error?.details || errorData?.details
        if (validationDetails && Array.isArray(validationDetails)) {
          const details = validationDetails
            .map((d: any) => `${d.field}: ${d.message}`)
            .join(", ")
          toast.error(`خطأ في التحقق: ${details}`)
        } else {
          toast.error(`خطأ في التحقق: ${errorMessage}`)
        }
      } else if (error.response?.status === 404) {
        toast.error("المنتج غير موجود")
      } else if (error.response?.status === 403) {
        toast.error("ليس لديك صلاحية لحذف هذا المنتج")
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleActive = async (productId: string, currentStatus: boolean) => {
    setTogglingId(productId)
    try {
      const token = await tokenGetter()
      if (!token) {
        toast.error("فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.")
        return
      }

      await axiosInstance.patch(
        `/products/admin/${productId}/toggle-active`,
        { isActive: !currentStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      toast.success(`تم ${!currentStatus ? "تفعيل" : "إلغاء تفعيل"} المنتج بنجاح`)
      if (onProductUpdate) await onProductUpdate()
      else window.location.reload()
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error?.message ||
          "فشل تحديث حالة المنتج"
      )
    } finally {
      setTogglingId(null)
    }
  }

  const handleRestore = async (productId: string) => {
    setRestoringId(productId)
    try {
      const token = await tokenGetter()
      if (!token) {
        toast.error("فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.")
        return
      }

      await axiosInstance.patch(
        `/products/admin/${productId}/restore`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )

      toast.success("تم استعادة المنتج بنجاح")
      if (onProductUpdate) await onProductUpdate()
      else window.location.reload()
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error?.message ||
          "فشل استعادة المنتج"
      )
    } finally {
      setRestoringId(null)
    }
  }

  const handleHardDelete = async (productId: string, _productName: string) => {
    setHardDeletingId(productId)
    try {
      const token = await tokenGetter()
      if (!token) {
        toast.error("فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.")
        return
      }

      await axiosInstance.delete(`/products/admin/${productId}/hard-delete`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      toast.success("تم حذف المنتج نهائياً")
      if (onProductUpdate) await onProductUpdate()
      else window.location.reload()
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error?.message ||
          "فشل حذف المنتج"
      )
    } finally {
      setHardDeletingId(null)
    }
  }

  const handleUpdateRanking = async (
    productId: string,
    priorityScore?: number,
    featured?: boolean
  ) => {
    setUpdatingRankingId(productId)
    try {
      const token = await tokenGetter()
      if (!token) {
        toast.error("فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.")
        return
      }

      const payload: { priorityScore?: number; featured?: boolean } = {}
      if (priorityScore !== undefined) payload.priorityScore = priorityScore
      if (featured !== undefined) payload.featured = featured

      await axiosInstance.patch(`/products/admin/${productId}/ranking`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })

      toast.success("تم تحديث ترتيب المنتج بنجاح")
      setRankingDialogOpen(null)
      if (onProductUpdate) await onProductUpdate()
      else window.location.reload()
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error?.message ||
          "فشل تحديث ترتيب المنتج"
      )
    } finally {
      setUpdatingRankingId(null)
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
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          اسم المنتج
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "category",
      header: "التصنيف",
      cell: ({ row }) => {
        const category = row.getValue("category")
        let categoryName: string = "غير محدد"
        if (typeof category === "object" && category !== null && "name" in category) {
          categoryName = (category as { name: string }).name || "غير محدد"
        } else if (typeof category === "string") {
          categoryName = category || "غير محدد"
        }
        return <div>{categoryName}</div>
      },
    },
    {
      accessorKey: "merchant",
      header: "التاجر",
      cell: ({ row }) => {
        const merchant = row.getValue("merchant") as Product["merchant"]
        if (typeof merchant === "object" && merchant !== null && "businessName" in merchant) {
          const merchantObj = merchant as { businessName: string; status?: string }
          return (
            <div className="flex flex-col">
              <div className="font-medium">{merchantObj.businessName}</div>
              {merchantObj.status && (
                <Badge
                  variant={merchantObj.status === "APPROVED" ? "default" : "secondary"}
                  className="text-xs mt-1"
                >
                  {merchantObj.status === "APPROVED" ? "موافق" : merchantObj.status}
                </Badge>
              )}
            </div>
          )
        }
        return <div className="text-muted-foreground">عام</div>
      },
    },
    {
      accessorKey: "price",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-right"
        >
          السعر النهائي
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const product = row.original
        const finalPrice = product.finalPrice || product.discountPrice || product.price || 0
        const validFinalPrice = !isNaN(finalPrice) && isFinite(finalPrice) ? finalPrice : 0
        const formatted = new Intl.NumberFormat("ar-SD", {
          style: "currency",
          currency: "SDG",
        }).format(validFinalPrice)

        return <div className="text-right font-medium">{formatted}</div>
      },
    },
    {
      accessorKey: "discountPrice",
      header: () => <div className="text-right">السعر النهائي</div>,
      cell: ({ row }) => {
        const product = row.original
        const merchantPrice = product.merchantPrice || product.price || 0
        const finalPrice = product.finalPrice || product.discountPrice || product.price || 0
        const validOriginalPrice = !isNaN(merchantPrice) && isFinite(merchantPrice) ? merchantPrice : 0
        const validFinalPrice = !isNaN(finalPrice) && isFinite(finalPrice) ? finalPrice : 0

        const hasDiscount = validFinalPrice < validOriginalPrice
        if (hasDiscount) {
          const formatted = new Intl.NumberFormat("ar-SD", {
            style: "currency",
            currency: "SDG",
          }).format(validOriginalPrice)

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
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-right"
        >
          الكمية
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const stock = row.getValue("stock") as number
        return (
          <div className={`text-right ${stock < 10 ? "text-red-600 font-bold" : ""}`}>
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
        const isDeleted = !!product.deletedAt
        return (
          <div className="flex items-center gap-2">
            {isDeleted ? (
              <Badge variant="destructive">محذوف</Badge>
            ) : (
              <>
                <Badge variant={isActive ? "default" : "secondary"}>
                  {isActive ? "نشط" : "غير نشط"}
                </Badge>
                <Switch
                  checked={isActive}
                  onCheckedChange={() => handleToggleActive(product._id, isActive)}
                  disabled={togglingId === product._id}
                />
              </>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "featured",
      header: "مميز",
      cell: ({ row }) => {
        const product = row.original
        const featured = product.featured || false
        const isDeleted = !!product.deletedAt
        return (
          <div className="flex items-center gap-2">
            {isDeleted ? (
              <span className="text-muted-foreground">-</span>
            ) : (
              <div className="flex items-center gap-2">
                <Star
                  className={`h-4 w-4 ${
                    featured ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                  }`}
                />
                <Switch
                  checked={featured}
                  onCheckedChange={(checked) =>
                    handleUpdateRanking(product._id, undefined, checked)
                  }
                  disabled={updatingRankingId === product._id}
                />
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "priorityScore",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-right"
        >
          أولوية الترتيب
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const product = row.original
        const priorityScore = product.priorityScore || 0
        const isDeleted = !!product.deletedAt
        const isUpdating = updatingRankingId === product._id

        return (
          <div className="flex items-center gap-2">
            {isDeleted ? (
              <span className="text-muted-foreground">-</span>
            ) : (
              <Dialog
                open={rankingDialogOpen === product._id}
                onOpenChange={(open) => {
                  if (!open) setRankingDialogOpen(null)
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRankingDialogOpen(product._id)}
                    disabled={isUpdating}
                    className="text-right"
                  >
                    {priorityScore}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>تعديل ترتيب المنتج: {product.name}</DialogTitle>
                    <DialogDescription>
                      الأولوية (0-100): القيمة الأعلى = ترتيب أفضل في الصفحة الرئيسية
                    </DialogDescription>
                  </DialogHeader>
                  <RankingEditDialog
                    product={product}
                    onSave={(priority, feat) => handleUpdateRanking(product._id, priority, feat)}
                    onCancel={() => setRankingDialogOpen(null)}
                    isUpdating={isUpdating}
                  />
                </DialogContent>
              </Dialog>
            )}
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
                <span className="sr-only">فتح القائمة</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuLabel>إجراءات</DropdownMenuLabel>

              <Link href={`/business/products/${product._id}`}>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Eye className="mr-2 h-4 w-4" />
                  عرض التفاصيل
                </DropdownMenuItem>
              </Link>

              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(product._id)}>
                نسخ معرف المنتج
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {!product.deletedAt && (
                <>
                  <DropdownMenuItem
                    onClick={() => router.push(`/business/products/${product._id}/edit`)}
                  >
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
                        حذف المنتج (حذف مؤقت)
                      </DropdownMenuItem>
                    </AlertDialogTrigger>

                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                        <AlertDialogDescription>
                          سيتم حذف المنتج &quot;{product.name}&quot; مؤقتاً (حذف ناعم). يمكن استعادته
                          لاحقاً.
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(product._id)}
                          disabled={deletingId === product._id}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {deletingId === product._id ? "جاري الحذف..." : "حذف"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}

              {product.deletedAt && (
                <>
                  <DropdownMenuItem
                    onClick={() => handleRestore(product._id)}
                    disabled={restoringId === product._id}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {restoringId === product._id ? "جارٍ الاستعادة..." : "استعادة المنتج"}
                  </DropdownMenuItem>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="text-red-600"
                      >
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        حذف نهائي
                      </DropdownMenuItem>
                    </AlertDialogTrigger>

                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>تحذير: حذف نهائي</AlertDialogTitle>
                        <AlertDialogDescription>
                          سيتم حذف المنتج &quot;{product.name}&quot; نهائياً من قاعدة البيانات. لا يمكن
                          التراجع عن هذا الإجراء.
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleHardDelete(product._id, product.name)}
                          disabled={hardDeletingId === product._id}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {hardDeletingId === product._id ? "جاري الحذف..." : "حذف نهائي"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

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
      toast.error("لم يتم اختيار أي منتجات")
      return
    }

    setBulkDeleting(true)
    try {
      const token = await tokenGetter()
      if (!token) {
        toast.error("فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.")
        return
      }

      const validRows = selectedRows.filter((row) => {
        const id = row.original._id
        if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
          logger.warn("Invalid product ID in bulk delete", { id })
          return false
        }
        return true
      })

      if (validRows.length === 0) {
        toast.error("لا توجد منتجات صالحة للحذف")
        return
      }

      if (validRows.length < selectedRows.length) {
        toast.warning(
          `تم تجاهل ${selectedRows.length - validRows.length} منتج بسبب معرفات غير صالحة`
        )
      }

      const deletePromises = validRows.map(async (row): Promise<BulkDeleteResult> => {
        const id = row.original._id
        try {
          await axiosInstance.delete(`/products/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          return { ok: true, productId: id }
        } catch (error: any) {
          logger.error("Error deleting product in bulk operation", {
            productId: id,
            error: error instanceof Error ? error.message : String(error),
            status: error.response?.status,
            responseData: error.response?.data,
          })
          return { ok: false, productId: id, productName: row.original.name, error }
        }
      })

      const results = await Promise.all(deletePromises)

      const successful = results.filter((r) => r.ok).length
      const failed = results.filter((r) => !r.ok).length

      if (successful > 0) toast.success(`تم حذف ${successful} منتج بنجاح`)

      if (failed > 0) {
        const failedProducts = results
          .filter((r) => !r.ok)
          .map((r) => r.productName || r.productId)
          .join(", ")
        toast.error(`فشل حذف ${failed} منتج: ${failedProducts}`)
      }

      if (successful > 0) {
        setRowSelection({})
        if (onProductUpdate) await onProductUpdate()
        else window.location.reload()
      }
    } catch (error: any) {
      logger.error("Error in bulk delete operation", {
        error: error instanceof Error ? error.message : String(error),
        status: error.response?.status,
        responseData: error.response?.data,
      })
      toast.error("حدث خطأ أثناء عملية الحذف الجماعي")
    } finally {
      setBulkDeleting(false)
    }
  }

  const handleBulkToggleActive = async (activate: boolean) => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    if (selectedRows.length === 0) {
      toast.error("لم يتم اختيار أي منتجات")
      return
    }

    setBulkToggling(true)
    try {
      const token = await tokenGetter()
      if (!token) {
        toast.error("فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.")
        return
      }

      const togglePromises = selectedRows
        .filter((row) => !row.original.deletedAt)
        .map((row) =>
          axiosInstance.patch(
            `/products/admin/${row.original._id}/toggle-active`,
            { isActive: activate },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        )

      await Promise.all(togglePromises)
      toast.success(`تم ${activate ? "تفعيل" : "إلغاء تفعيل"} ${selectedRows.length} منتج بنجاح`)
      setRowSelection({})
      if (onProductUpdate) await onProductUpdate()
      else window.location.reload()
    } catch (error: any) {
      toast.error("فشل تحديث حالة بعض المنتجات")
    } finally {
      setBulkToggling(false)
    }
  }

  const escapeCsvField = (value: any): string => {
    if (value === null || value === undefined) return ""
    const stringValue = String(value)
    if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`
    }
    return stringValue
  }

  const handleExport = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    const dataToExport = selectedRows.length > 0 ? selectedRows.map((r) => r.original) : safeProductsData

    const csv = [
      ["اسم المنتج", "السعر الأصلي", "السعر النهائي", "المخزون", "الحالة", "التصنيف", "تاريخ الإنشاء"]
        .map(escapeCsvField)
        .join(","),
      ...dataToExport
        .map((product) =>
          [
            product.name,
            product.price,
            product.discountPrice || "",
            product.stock,
            product.isActive ? "نشط" : "غير نشط",
            (typeof product.category === "object" &&
            product.category !== null &&
            "name" in product.category
              ? product.category.name
              : typeof product.category === "string"
              ? product.category
              : "") || "",
            new Date(product.createdAt).toLocaleDateString("ar-SA"),
          ]
            .map(escapeCsvField)
            .join(",")
        )
        .join("\n"),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.href = url
    link.download = `products_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 100)
    toast.success("تم تصدير البيانات بنجاح")
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      if (onProductUpdate) await onProductUpdate()
      else {
        window.location.reload()
        return
      }
    } finally {
      if (onProductUpdate) setRefreshing(false)
    }
  }

  const selectedRowsCount = table.getFilteredSelectedRowModel().rows.length

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2 flex-1">
          <Input
            placeholder="ابحث باسم المنتج..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
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
                      {bulkDeleting ? "جاري الحذف..." : "حذف"}
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
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            تصدير
          </Button>

          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
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
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id === "name"
                      ? "اسم المنتج"
                      : column.id === "images"
                      ? "الصورة"
                      : column.id === "category"
                      ? "التصنيف"
                      : column.id === "price"
                      ? "السعر الأصلي"
                      : column.id === "discountPrice"
                      ? "السعر النهائي"
                      : column.id === "stock"
                      ? "الكمية"
                      : column.id === "isActive"
                      ? "الحالة"
                      : column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {safeProductsData.length === 0 ? "لا توجد منتجات متاحة." : "لا توجد نتائج."}
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
