import { useEffect } from "react";
import { WizardState } from "../types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import ImageUpload from "@/components/imageUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Step1Props {
    state: WizardState;
    onChange: (updates: Partial<WizardState>) => void;
    categories: { _id: string; name: string }[];
}

export function Step1_BasicInfo({ state, onChange, categories }: Step1Props) {

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>معلومات المنتج الأساسية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">اسم المنتج <span className="text-red-500">*</span></Label>
                        <Input
                            id="name"
                            placeholder="مثال: قميص قطني فاخر"
                            value={state.name}
                            onChange={(e) => onChange({ name: e.target.value })}
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">وصف المنتج <span className="text-red-500">*</span></Label>
                        <Textarea
                            id="description"
                            placeholder="وصف تفصيلي للمنتج..."
                            value={state.description}
                            onChange={(e) => onChange({ description: e.target.value })}
                            rows={4}
                        />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <Label htmlFor="category">الفئة <span className="text-red-500">*</span></Label>
                        <Select
                            value={state.category}
                            onValueChange={(value) => onChange({ category: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="اختر الفئة" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat._id} value={cat._id}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Is Active */}
                    <div className="flex items-center space-x-2 space-x-reverse">
                        <Switch
                            checked={state.isActive}
                            onCheckedChange={(checked) => onChange({ isActive: checked })}
                        />
                        <Label>منتج نشط (يظهر للعملاء)</Label>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>صور المنتج العامة <span className="text-red-500">*</span></CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label className="text-muted-foreground text-sm">
                            ارفع صوراً عالية الجودة لمنتجك. يجب رفع صورة واحدة على الأقل.
                        </Label>
                        <div className="mt-2">
                            <ImageUpload
                                initialUrls={state.images}
                                onUploadComplete={(urls) => onChange({ images: urls })}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>نوع المنتج</CardTitle>
                </CardHeader>
                <CardContent>
                    <Select
                        value={state.productType}
                        onValueChange={(value: "simple" | "with_variants") => onChange({ productType: value })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="اختر نوع المنتج" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="simple">منتج بسيط (بدون خيارات)</SelectItem>
                            <SelectItem value="with_variants">منتج متعدد الخيارات (ألوان، مقاسات...)</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground mt-2">
                        اختر "منتج بسيط" إذا كان المنتج قطعة واحدة فقط. اختر "متعدد الخيارات" إذا كان للمنتج ألوان أو مقاسات متعددة.
                    </p>
                </CardContent>
            </Card>

            {state.productType === 'simple' && (
                <Card className="border-blue-200 bg-blue-50/50">
                    <CardHeader>
                        <CardTitle className="text-blue-700">بيانات المنتج البسيط</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">السعر (د.إ) <span className="text-red-500">*</span></Label>
                                <Input
                                    id="price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={state.price === undefined ? "" : state.price}
                                    onChange={(e) => onChange({ price: e.target.value === "" ? undefined : parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="stock">المخزون <span className="text-red-500">*</span></Label>
                                <Input
                                    id="stock"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={state.stock === undefined ? "" : state.stock}
                                    onChange={(e) => onChange({ stock: e.target.value === "" ? undefined : parseInt(e.target.value) })}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
