import { useState } from "react";
import { WizardState } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, X } from "lucide-react";
import { ProductAttributeDefDTO } from "@/domain/product/product.types";
import { generateVariantsFromAttributes } from "../helpers/variantGeneration";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Step2Props {
    state: WizardState;
    onChange: (updates: Partial<WizardState>) => void;
}

export function Step2_VariantSetup({ state, onChange }: Step2Props) {

    // Handlers for Attributes
    const addAttribute = () => {
        const newAttr: ProductAttributeDefDTO = {
            name: "",
            displayName: "",
            type: "select",
            options: [],
            required: true,
        };
        onChange({ attributes: [...state.attributes, newAttr] });
    };

    const removeAttribute = (index: number) => {
        const newAttrs = [...state.attributes];
        newAttrs.splice(index, 1);

        // Regenerate variants immediately or wait? 
        // Plan says "Use current logic to generate".
        // Let's regen on change for instant feedback, OR button.
        // Button is safer to avoid thrashing, but instant is better UX.
        // Let's do it on "Save/Next" or provide a "Generate" button?
        // User requested "Wizard... Auto-generate SKU".

        // Let's update attributes, and maybe clear variants or try to regen.
        // Ideally we regen *after* user finishes typing options.
        onChange({ attributes: newAttrs });
    };

    const updateAttribute = (index: number, updates: Partial<ProductAttributeDefDTO>) => {
        const newAttrs = [...state.attributes];
        newAttrs[index] = { ...newAttrs[index], ...updates };
        onChange({ attributes: newAttrs });
    };

    const addOption = (attrIndex: number, optionValue: string) => {
        if (!optionValue.trim()) return;
        const attr = state.attributes[attrIndex];
        if (attr.options?.includes(optionValue)) return; // duplicate

        const newOptions = [...(attr.options || []), optionValue.trim()];
        updateAttribute(attrIndex, { options: newOptions });
    };

    // Handler to Trigger Generation
    const handleGenerate = () => {
        // Logic is in helper
        const newVariants = generateVariantsFromAttributes(state.attributes, state.variants);
        onChange({ variants: newVariants });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold">خيارات المنتج</h2>
                    <p className="text-muted-foreground">أضف خيارات مثل اللون والمقاس لإنشاء المتغيرات.</p>
                </div>
                <Button onClick={addAttribute} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    إضافة خيار
                </Button>
            </div>

            <div className="space-y-4">
                {state.attributes.map((attr, index) => (
                    <Card key={index} className="relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 left-2 text-destructive"
                            onClick={() => removeAttribute(index)}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>

                        <CardContent className="pt-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>اسم الخيار (مثال: اللون)</Label>
                                    <Select
                                        value={attr.name}
                                        onValueChange={(val) => updateAttribute(index, { name: val, displayName: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر نوع الخاصية" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="اللون">اللون</SelectItem>
                                            <SelectItem value="المقاس">المقاس</SelectItem>
                                            <SelectItem value="الخامة">الخامة</SelectItem>
                                            <SelectItem value="النمط">النمط</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>قيم الخيار (اضغط Enter للإضافة)</Label>
                                    <OptionInput
                                        onAdd={(val) => addOption(index, val)}
                                    />
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {attr.options?.map((opt, optIdx) => (
                                            <Badge key={optIdx} variant="secondary" className="px-3 py-1">
                                                {opt}
                                                <button
                                                    className="ml-2 hover:text-red-500"
                                                    onClick={() => {
                                                        const newOptions = attr.options?.filter((_, i) => i !== optIdx);
                                                        updateAttribute(index, { options: newOptions });
                                                    }}
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {state.attributes.length > 0 && (
                <div className="flex justify-end pt-4">
                    <Button onClick={handleGenerate} size="lg">
                        <Plus className="w-4 h-4 mr-2" />
                        إنشاء / تحديث المتغيرات ({state.variants.length} حالياً)
                    </Button>
                </div>
            )}

            {/* Preview Variants */}
            {state.variants.length > 0 && (
                <Card className="bg-muted/30">
                    <CardHeader>
                        <CardTitle className="text-base">معاينة المتغيرات ({state.variants.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {state.variants.slice(0, 10).map((v) => (
                                <Badge key={v.sku} variant="outline" className="bg-background">
                                    {Object.values(v.attributes).join(" / ")}
                                </Badge>
                            ))}
                            {state.variants.length > 10 && (
                                <Badge variant="outline">+{state.variants.length - 10} المزيد</Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function OptionInput({ onAdd }: { onAdd: (val: string) => void }) {
    const [val, setVal] = useState("");

    return (
        <Input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    onAdd(val);
                    setVal("");
                }
            }}
            placeholder="اكتب قيمة واضغط Enter (مثال: أحمر)"
        />
    );
}
