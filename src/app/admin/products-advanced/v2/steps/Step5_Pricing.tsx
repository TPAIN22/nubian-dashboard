import { useMemo } from "react";
import { WizardState } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { applyColorPricesToVariants } from "../helpers/applyColorPrices";

interface Step5Props {
    state: WizardState;
    onChange: (updates: Partial<WizardState>) => void;
}

export function Step5_Pricing({ state, onChange }: Step5Props) {
    // Extract unique colors (same logic as Step 4)
    const colorAttrName = useMemo(() => {
        const attrNames = state.attributes.map(a => a.name);
        return attrNames.find(n => n.toLowerCase() === 'color' || n === 'اللون') || "Color";
    }, [state.attributes]);

    const colors = useMemo(() => {
        const set = new Set<string>();
        state.variants.forEach(v => {
            const val = v.attributes[colorAttrName] || v.attributes["Color"] || v.attributes["color"];
            if (val) set.add(val);
        });
        return Array.from(set).sort();
    }, [state.variants, colorAttrName]);

    const handlePriceChange = (color: string, priceStr: string) => {
        const price = parseFloat(priceStr);
        if (isNaN(price)) return; // Don't update if invalid? Or handle empty?

        const newMap = { ...state.colorPrices, [color]: price };

        // Update variants
        const newVariants = applyColorPricesToVariants(state.variants, newMap, colorAttrName);

        onChange({
            colorPrices: newMap,
            variants: newVariants
        });
    };

    // Helper to get current price for a color (from first variant of that color)
    const getDisplayPrice = (color: string) => {
        // Check map first
        if (state.colorPrices[color] !== undefined) return state.colorPrices[color];
        // Fallback to variant
        const variant = state.variants.find(v => {
            const val = v.attributes[colorAttrName] || v.attributes["Color"] || v.attributes["color"];
            return val === color;
        });
        return variant ? variant.merchantPrice : "";
    };


    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold">تحديد الأسعار</h2>
                <p className="text-muted-foreground">
                    حدد سعر التاجر لكل لون. سيتم تطبيقه على جميع المقاسات لهذا اللون.
                </p>
            </div>

            {colors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {colors.map(color => (
                        <Card key={color}>
                            <CardContent className="pt-6">
                                <div className="space-y-2">
                                    <Label className="text-lg font-semibold">{color}</Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={getDisplayPrice(color)}
                                            onChange={(e) => handlePriceChange(color, e.target.value)}
                                            className="pl-16" // space for currency? RTL check
                                        />
                                        <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">د.إ</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        سيتم تعيين هذا السعر لجميع متغيرات اللون {color}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 border rounded-lg">
                    <p className="text-muted-foreground">لم يتم العثور على ألوان. يرجى التأكد من إعداد المتغيرات بشكل صحيح.</p>
                </div>
            )}
        </div>
    );
}
