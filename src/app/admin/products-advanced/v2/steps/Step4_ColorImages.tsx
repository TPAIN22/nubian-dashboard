import { useMemo } from "react";
import { WizardState } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import ImageUpload from "@/components/imageUpload";
import { applyColorImagesToVariants } from "../helpers/applyColorImages";

interface Step4Props {
    state: WizardState;
    onChange: (updates: Partial<WizardState>) => void;
}

export function Step4_ColorImages({ state, onChange }: Step4Props) {

    // Extract unique colors from variants
    // We assume there's an attribute named 'color' or similar. 
    const colorAttrName = useMemo(() => {
        const attrNames = state.attributes.map(a => a.name);
        return attrNames.find(n => n.toLowerCase() === 'color' || n === 'اللون') || "Color";
    }, [state.attributes]);

    const colors = useMemo(() => {
        const set = new Set<string>();
        state.variants.forEach(v => {
            // find val ignoring case of key?
            // Let's assume standardized key from generation
            const val = v.attributes[colorAttrName] || v.attributes["Color"] || v.attributes["color"];
            if (val) set.add(val);
        });
        return Array.from(set).sort();
    }, [state.variants, colorAttrName]);

    const handleImagesChange = (color: string, urls: string[]) => {
        const newMap = { ...state.colorImages, [color]: urls };

        // Also apply to variants immediately?
        // Yes, UX requires it to be synced.
        const newVariants = applyColorImagesToVariants(state.variants, newMap, colorAttrName);

        onChange({
            colorImages: newMap,
            variants: newVariants
        });
    };

    if (colors.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-muted-foreground">لا يوجد ألوان لإضافة صور لها. يرجى التأكد من إضافة خيار &quot;اللون&quot; في الخطوة 2.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold">صور الألوان</h2>
                <p className="text-muted-foreground">
                    ارفع صوراً لكل لون. سيتم تطبيق هذه الصور على جميع المتغيرات (المقاسات) التابعة لهذا اللون.
                </p>
            </div>

            <div className="space-y-8">
                {colors.map(color => (
                    <Card key={color}>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-primary/20 block border" />
                                {color}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label>صور اللون {color} <span className="text-red-500">*</span></Label>
                                <ImageUpload
                                    initialUrls={state.colorImages[color] || []}
                                    onUploadComplete={(urls) => handleImagesChange(color, urls)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
