'use client';

import { useState, useCallback, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Stepper } from '@/components/ui/stepper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  IconUpload,
  IconFileSpreadsheet,
  IconFileZip,
  IconDownload,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconLoader2,
  IconTrash,
  IconRefresh,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';

// Types
interface ImportRowValidated {
  rowIndex: number;
  sku: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  stock: number;
  images: string[];
  imageFiles?: string[];
  isValid: boolean;
  errors: { field: string; message: string; code: string }[];
  warnings: string[];
}

interface ParseResponse {
  success: boolean;
  sessionId: string;
  preview: ImportRowValidated[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  mode: 'url' | 'zip';
  errors: { message: string; code: string }[];
  warnings: string[];
  duplicateSkus: string[];
}

interface CommitResult {
  success: boolean;
  totalRows: number;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  failures: {
    rowIndex: number;
    sku: string;
    name: string;
    reason: string;
    errors: { field: string; message: string; code: string }[];
  }[];
  uploadedImages: number;
}

interface Merchant {
  _id: string;
  businessName: string;
  status: string;
}

type Step = 'upload' | 'preview' | 'import' | 'report';

export default function ProductImportPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [isLoading, setIsLoading] = useState(false);

  // User role
  const userRole = (user?.publicMetadata?.role as string) || undefined;
  const isAdmin = userRole === 'admin';
  const userMerchantId = (user?.publicMetadata?.merchantId as string) || undefined;

  // File state
  const [dataFile, setDataFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);

  // Merchant selection (admin only)
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>('');

  // Parse result
  const [parseResult, setParseResult] = useState<ParseResponse | null>(null);

  // Commit result
  const [commitResult, setCommitResult] = useState<CommitResult | null>(null);

  // Fetch merchants for admin
  useEffect(() => {
    // Debug: log user role info
    console.log('[Import] User loaded:', {
      userId: user?.id,
      userRole,
      isAdmin,
      userMerchantId,
      publicMetadata: user?.publicMetadata
    });

    if (isAdmin) {
      fetchMerchants();
    } else if (userMerchantId) {
      setSelectedMerchantId(userMerchantId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, userMerchantId, user]);

  const fetchMerchants = async () => {
    console.log('[Import] Fetching merchants...');
    try {
      const token = await getToken();
      const response = await fetch('/api/merchants', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('[Import] Merchants response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[Import] Merchants data:', data);
        const merchantList = data.data || data.merchants || data || [];
        const approved = merchantList.filter((m: Merchant) => m.status === 'APPROVED');
        console.log('[Import] Approved merchants:', approved);
        setMerchants(approved);
      } else {
        const errorData = await response.json();
        console.error('[Import] Failed to fetch merchants:', errorData);
        toast.error('فشل في تحميل قائمة التجار');
      }
    } catch (error) {
      console.error('[Import] Failed to fetch merchants:', error);
      toast.error('فشل في تحميل قائمة التجار');
    }
  };

  // Data file dropzone
  const onDropData = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const ext = file.name.toLowerCase();
      if (!ext.endsWith('.csv') && !ext.endsWith('.xlsx') && !ext.endsWith('.xls')) {
        toast.error('الملف يجب أن يكون CSV أو XLSX');
        return;
      }
      setDataFile(file);
      toast.success(`تم تحميل: ${file.name}`);
    }
  }, []);

  const { getRootProps: getDataRootProps, getInputProps: getDataInputProps, isDragActive: isDataDragActive } = useDropzone({
    onDrop: onDropData,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1
  });

  // ZIP file dropzone
  const onDropZip = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.zip')) {
        toast.error('الملف يجب أن يكون ZIP');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error('حجم ملف ZIP يجب أن يكون أقل من 50MB');
        return;
      }
      setZipFile(file);
      toast.success(`تم تحميل: ${file.name}`);
    }
  }, []);

  const { getRootProps: getZipRootProps, getInputProps: getZipInputProps, isDragActive: isZipDragActive } = useDropzone({
    onDrop: onDropZip,
    accept: {
      'application/zip': ['.zip'],
      'application/x-zip-compressed': ['.zip']
    },
    maxFiles: 1
  });

  // Parse files
  const handleParse = async () => {
    if (!dataFile) {
      toast.error('يرجى تحميل ملف البيانات');
      return;
    }

    if (!selectedMerchantId) {
      toast.error('يرجى اختيار التاجر');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('dataFile', dataFile);
      formData.append('merchantId', selectedMerchantId);

      if (zipFile) {
        formData.append('zipFile', zipFile);
      }

      const response = await fetch('/api/admin/products/import/parse', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'فشل في تحليل الملف');
      }

      setParseResult(result);
      setCurrentStep('preview');

      if (result.warnings.length > 0) {
        result.warnings.forEach((w: string) => toast.warning(w));
      }

      toast.success(`تم تحليل ${result.totalRows} صف`);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'حدث خطأ';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Commit import
  const handleCommit = async () => {
    if (!parseResult?.sessionId) {
      toast.error('لا توجد جلسة استيراد');
      return;
    }

    if (parseResult.validRows === 0) {
      toast.error('لا توجد صفوف صالحة للاستيراد');
      return;
    }

    setIsLoading(true);
    setCurrentStep('import');

    try {
      const response = await fetch('/api/admin/products/import/commit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: parseResult.sessionId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'فشل في الاستيراد');
      }

      setCommitResult(result.result);
      setCurrentStep('report');

      if (result.result.failedCount === 0) {
        toast.success('تم الاستيراد بنجاح');
      } else {
        toast.warning(`تم الاستيراد مع ${result.result.failedCount} أخطاء`);
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'حدث خطأ';
      toast.error(message);
      setCurrentStep('preview');
    } finally {
      setIsLoading(false);
    }
  };

  // Download failures report
  const handleDownloadFailures = async (format: 'csv' | 'json' = 'csv') => {
    if (!commitResult?.failures.length) return;

    try {
      const response = await fetch('/api/admin/products/import/failures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ failures: commitResult.failures, format }),
      });

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `import-failures.${format}`;
      a.click();
      URL.revokeObjectURL(url);

    } catch (error) {
      toast.error('فشل في تحميل التقرير');
    }
  };

  // Reset
  const handleReset = () => {
    setDataFile(null);
    setZipFile(null);
    setParseResult(null);
    setCommitResult(null);
    setCurrentStep('upload');
  };

  // Stepper steps
  const steps = [
    {
      title: 'رفع الملفات',
      description: 'CSV/XLSX + ZIP',
      isCompleted: currentStep !== 'upload',
      isActive: currentStep === 'upload',
      isEnabled: true
    },
    {
      title: 'معاينة',
      description: 'مراجعة البيانات',
      isCompleted: currentStep === 'import' || currentStep === 'report',
      isActive: currentStep === 'preview',
      isEnabled: currentStep !== 'upload'
    },
    {
      title: 'استيراد',
      description: 'جاري المعالجة',
      isCompleted: currentStep === 'report',
      isActive: currentStep === 'import',
      isEnabled: currentStep === 'import' || currentStep === 'report'
    },
    {
      title: 'التقرير',
      description: 'النتائج',
      isCompleted: false,
      isActive: currentStep === 'report',
      isEnabled: currentStep === 'report'
    }
  ];

  return (
    <div className="container max-w-7xl mx-auto px-6 py-8 space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="استيراد المنتجات"
        description="استيراد المنتجات من ملف CSV أو Excel"
      >
        <div className="flex gap-2">
          <a href="/api/admin/products/import/template.csv" download>
            <Button variant="outline" size="sm">
              <IconDownload className="w-4 h-4 ml-2" />
              قالب CSV
            </Button>
          </a>
          <a href="/api/admin/products/import/template.xlsx" download>
            <Button variant="outline" size="sm">
              <IconDownload className="w-4 h-4 ml-2" />
              قالب Excel
            </Button>
          </a>
        </div>
      </PageHeader>

      {/* Stepper */}
      <Card>
        <CardContent className="pt-6">
          <Stepper steps={steps} />
        </CardContent>
      </Card>

      {/* Step: Upload */}
      {currentStep === 'upload' && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Merchant Selector (Admin only) */}
          {isAdmin ? (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">اختيار التاجر</CardTitle>
                <CardDescription>اختر التاجر الذي تريد استيراد المنتجات له</CardDescription>
              </CardHeader>
              <CardContent>
                {merchants.length === 0 ? (
                  <div className="text-muted-foreground text-sm">
                    جاري تحميل قائمة التجار...
                  </div>
                ) : (
                  <Select value={selectedMerchantId} onValueChange={setSelectedMerchantId}>
                    <SelectTrigger className="w-full max-w-md">
                      <SelectValue placeholder="اختر التاجر..." />
                    </SelectTrigger>
                    <SelectContent>
                      {merchants.map((merchant) => (
                        <SelectItem key={merchant._id} value={merchant._id}>
                          {merchant.businessName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>
          ) : userMerchantId ? (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">استيراد لمتجرك</CardTitle>
                <CardDescription>سيتم استيراد المنتجات إلى متجرك الخاص</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="text-sm">
                  معرف المتجر: {userMerchantId}
                </Badge>
              </CardContent>
            </Card>
          ) : (
            <Card className="md:col-span-2 border-destructive">
              <CardHeader>
                <CardTitle className="text-lg text-destructive">خطأ في الصلاحيات</CardTitle>
                <CardDescription>
                  لا يمكنك استيراد المنتجات. تأكد من أنك مسجل كتاجر أو مدير.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Data File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <IconFileSpreadsheet className="w-5 h-5" />
                ملف البيانات
              </CardTitle>
              <CardDescription>CSV أو Excel يحتوي على بيانات المنتجات</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getDataRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
                  isDataDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50',
                  dataFile && 'border-green-500 bg-green-500/5'
                )}
              >
                <input {...getDataInputProps()} />
                {dataFile ? (
                  <div className="space-y-2">
                    <IconCheck className="w-10 h-10 mx-auto text-green-500" />
                    <p className="font-medium">{dataFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(dataFile.size / 1024).toFixed(1)} KB
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDataFile(null);
                      }}
                    >
                      <IconTrash className="w-4 h-4 ml-1" />
                      إزالة
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <IconUpload className="w-10 h-10 mx-auto text-muted-foreground" />
                    <p className="font-medium">اسحب الملف هنا أو انقر للاختيار</p>
                    <p className="text-sm text-muted-foreground">CSV, XLSX</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ZIP File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <IconFileZip className="w-5 h-5" />
                ملف الصور (اختياري)
              </CardTitle>
              <CardDescription>ZIP يحتوي على صور المنتجات</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getZipRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
                  isZipDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50',
                  zipFile && 'border-green-500 bg-green-500/5'
                )}
              >
                <input {...getZipInputProps()} />
                {zipFile ? (
                  <div className="space-y-2">
                    <IconCheck className="w-10 h-10 mx-auto text-green-500" />
                    <p className="font-medium">{zipFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(zipFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setZipFile(null);
                      }}
                    >
                      <IconTrash className="w-4 h-4 ml-1" />
                      إزالة
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <IconUpload className="w-10 h-10 mx-auto text-muted-foreground" />
                    <p className="font-medium">اسحب الملف هنا أو انقر للاختيار</p>
                    <p className="text-sm text-muted-foreground">ZIP (حد أقصى 50MB)</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Parse Button */}
          <div className="md:col-span-2 flex justify-end">
            <Button
              size="lg"
              onClick={handleParse}
              disabled={!dataFile || !selectedMerchantId || isLoading}
            >
              {isLoading ? (
                <>
                  <IconLoader2 className="w-5 h-5 ml-2 animate-spin" />
                  جاري التحليل...
                </>
              ) : (
                <>
                  تحليل الملف
                  <IconFileSpreadsheet className="w-5 h-5 mr-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step: Preview */}
      {currentStep === 'preview' && parseResult && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{parseResult.totalRows}</div>
                <p className="text-sm text-muted-foreground">إجمالي الصفوف</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{parseResult.validRows}</div>
                <p className="text-sm text-muted-foreground">صفوف صالحة</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">{parseResult.invalidRows}</div>
                <p className="text-sm text-muted-foreground">صفوف غير صالحة</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  <Badge variant={parseResult.mode === 'zip' ? 'default' : 'secondary'}>
                    {parseResult.mode === 'zip' ? 'ZIP' : 'URL'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">وضع الصور</p>
              </CardContent>
            </Card>
          </div>

          {/* Warnings */}
          {parseResult.warnings.length > 0 && (
            <Card className="border-yellow-500/50 bg-yellow-500/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <IconAlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">تحذيرات</p>
                    <ul className="mt-2 space-y-1 text-sm text-yellow-700">
                      {parseResult.warnings.map((w, i) => (
                        <li key={i}>• {w}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Duplicate SKUs */}
          {parseResult.duplicateSkus.length > 0 && (
            <Card className="border-red-500/50 bg-red-500/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <IconX className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">SKU مكررة</p>
                    <p className="mt-1 text-sm text-red-700">
                      {parseResult.duplicateSkus.join(', ')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">معاينة البيانات (أول {parseResult.preview.length} صف)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>الاسم</TableHead>
                      <TableHead>السعر</TableHead>
                      <TableHead>المخزون</TableHead>
                      <TableHead>الصور</TableHead>
                      <TableHead>الأخطاء</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parseResult.preview.map((row) => (
                      <TableRow
                        key={row.rowIndex}
                        className={cn(!row.isValid && 'bg-red-500/5')}
                      >
                        <TableCell>{row.rowIndex + 1}</TableCell>
                        <TableCell>
                          {row.isValid ? (
                            <Badge variant="default" className="bg-green-600">
                              <IconCheck className="w-3 h-3 ml-1" />
                              صالح
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <IconX className="w-3 h-3 ml-1" />
                              خطأ
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{row.sku || '-'}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{row.name || '-'}</TableCell>
                        <TableCell>{row.price} {row.currency}</TableCell>
                        <TableCell>{row.stock}</TableCell>
                        <TableCell>{row.images.length}</TableCell>
                        <TableCell className="max-w-[300px]">
                          {row.errors.length > 0 && (
                            <ul className="text-xs text-red-600 space-y-0.5">
                              {row.errors.slice(0, 3).map((e, i) => (
                                <li key={i}>• {e.field}: {e.message}</li>
                              ))}
                              {row.errors.length > 3 && (
                                <li>و {row.errors.length - 3} أخطاء أخرى...</li>
                              )}
                            </ul>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleReset}>
              <IconRefresh className="w-4 h-4 ml-2" />
              البدء من جديد
            </Button>
            <Button
              size="lg"
              onClick={handleCommit}
              disabled={parseResult.validRows === 0 || isLoading}
            >
              {isLoading ? (
                <>
                  <IconLoader2 className="w-5 h-5 ml-2 animate-spin" />
                  جاري الاستيراد...
                </>
              ) : (
                <>
                  استيراد {parseResult.validRows} منتج
                  <IconUpload className="w-5 h-5 mr-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step: Import (Loading) */}
      {currentStep === 'import' && (
        <Card>
          <CardContent className="py-20 text-center">
            <IconLoader2 className="w-16 h-16 mx-auto text-primary animate-spin" />
            <h3 className="mt-6 text-xl font-semibold">جاري استيراد المنتجات...</h3>
            <p className="mt-2 text-muted-foreground">
              يرجى الانتظار، هذه العملية قد تستغرق بضع دقائق
            </p>
            {parseResult?.mode === 'zip' && (
              <p className="mt-4 text-sm text-muted-foreground">
                جاري رفع الصور إلى ImageKit...
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step: Report */}
      {currentStep === 'report' && commitResult && (
        <div className="space-y-6">
          {/* Summary */}
          <Card className={cn(
            commitResult.failedCount === 0
              ? 'border-green-500/50 bg-green-500/5'
              : 'border-yellow-500/50 bg-yellow-500/5'
          )}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                {commitResult.failedCount === 0 ? (
                  <IconCheck className="w-12 h-12 text-green-600" />
                ) : (
                  <IconAlertTriangle className="w-12 h-12 text-yellow-600" />
                )}
                <div>
                  <h3 className="text-xl font-semibold">
                    {commitResult.failedCount === 0
                      ? 'تم الاستيراد بنجاح!'
                      : 'تم الاستيراد مع بعض الأخطاء'}
                  </h3>
                  <p className="text-muted-foreground">
                    تمت معالجة {commitResult.totalRows} صف
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold">{commitResult.totalRows}</div>
                <p className="text-sm text-muted-foreground">إجمالي</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-green-600">{commitResult.insertedCount}</div>
                <p className="text-sm text-muted-foreground">منتجات جديدة</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-blue-600">{commitResult.updatedCount}</div>
                <p className="text-sm text-muted-foreground">تم تحديثها</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-gray-600">{commitResult.skippedCount}</div>
                <p className="text-sm text-muted-foreground">تم تخطيها</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-red-600">{commitResult.failedCount}</div>
                <p className="text-sm text-muted-foreground">فشلت</p>
              </CardContent>
            </Card>
          </div>

          {commitResult.uploadedImages > 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-primary">{commitResult.uploadedImages}</div>
                <p className="text-sm text-muted-foreground">صورة تم رفعها إلى ImageKit</p>
              </CardContent>
            </Card>
          )}

          {/* Failures */}
          {commitResult.failures.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">الصفوف الفاشلة</CardTitle>
                  <CardDescription>{commitResult.failures.length} صف</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleDownloadFailures('csv')}>
                    <IconDownload className="w-4 h-4 ml-1" />
                    CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDownloadFailures('json')}>
                    <IconDownload className="w-4 h-4 ml-1" />
                    JSON
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>الاسم</TableHead>
                        <TableHead>السبب</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commitResult.failures.map((failure, i) => (
                        <TableRow key={i}>
                          <TableCell>{failure.rowIndex + 1}</TableCell>
                          <TableCell className="font-mono text-sm">{failure.sku}</TableCell>
                          <TableCell>{failure.name}</TableCell>
                          <TableCell className="text-red-600">{failure.reason}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-center">
            <Button size="lg" onClick={handleReset}>
              <IconRefresh className="w-5 h-5 ml-2" />
              استيراد جديد
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
