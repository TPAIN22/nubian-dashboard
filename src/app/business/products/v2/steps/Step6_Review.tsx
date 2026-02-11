import { WizardState } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Step6Props {
    state: WizardState;
    onChange: (updates: Partial<WizardState>) => void;
}

export function Step6_Review({ state, onChange }: Step6Props) {

    const categoriesMap: Record<string, string> = {
        // Ideally pass categories map or name, but ID is what we have in state.
        // For review, ID might be ugly. ProductWizard could pass category Name if we improved state or props.
        // For now, let's display what we have or just label it.
    };

    const primaryImage = state.images.length > 0 ? state.images[0] : null;

    return (
        <div className="space-y-6">
            <div className="bg-muted p-4 rounded-lg border">
                <h2 className="text-xl font-bold mb-2">مراجعة المنتج</h2>
                <p className="text-muted-foreground">يرجى مراجعة كافة التفاصيل قبل الحفظ النهائي.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>البيانات الأساسية</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">اسم المنتج</label>
                                    <p className="font-semibold">{state.name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">التصنيف</label>
                                    <p>{state.category}</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-sm font-medium text-muted-foreground">الوصف</label>
                                    <p className="whitespace-pre-wrap text-sm">{state.description}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {state.productType === 'with_variants' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>المتغيرات ({state.variants.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {state.variants.slice(0, 20).map(v => (
                                        <Badge key={v.sku} variant={v.isActive ? 'default' : 'secondary'}>
                                            {Object.values(v.attributes).join("/")}
                                            {v.stock !== undefined ? ` (${v.stock})` : ''}
                                        </Badge>
                                    ))}
                                    {state.variants.length > 20 && <Badge variant="outline">+{state.variants.length - 20}</Badge>}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar / Media */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>الصور</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-2">
                                {state.images.map((img, i) => (
                                    <div
                                        key={i}
                                        className={`
                                        aspect-square relative rounded-lg overflow-hidden border cursor-pointer
                                        ${i === 0 ? 'ring-2 ring-primary' : 'hover:ring-2 hover:ring-gray-300'}
                                      `}
                                        onClick={() => {
                                            if (i === 0) return;
                                            const newImages = [...state.images];
                                            const [selected] = newImages.splice(i, 1);
                                            newImages.unshift(selected);
                                            onChange({ images: newImages });
                                        }}
                                    >
                                        <img src={img} alt={`Product ${i + 1}`} className="object-cover w-full h-full" />
                                        {i === 0 && (
                                            <Badge className="absolute top-2 right-2 bg-primary text-white">الرئيسية</Badge>
                                        )}
                                        {i !== 0 && (
                                            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 flex items-center justify-center transition-all opacity-0 hover:opacity-100">
                                                <Badge variant="secondary">اجعلها الرئيسية</Badge>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {state.images.length === 0 && <div className="col-span-3 text-center py-4 text-muted-foreground">لا توجد صور</div>}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>السعر والمخزون</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {state.productType === 'simple' ? (
                                <>
                                    <div className="flex justify-between">
                                        <span>السعر:</span>
                                        <span className="font-bold">{state.price} د.إ</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>المخزون:</span>
                                        <span className="font-bold">{state.stock}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="text-sm text-muted-foreground">
                                    يختلف حسب المتغير (انظر جدول المتغيرات)
                                </div>
                            )}
                            <Separator className="my-2" />
                            <div className="flex justify-between items-center">
                                <span>الحالة:</span>
                                <Badge variant={state.isActive ? 'default' : 'destructive'}>
                                    {state.isActive ? 'نشط' : 'غير نشط'}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
