import { useMemo } from "react";
import { WizardState } from "../types";
import { buildStockMatrix } from "../helpers/matrixMapping";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductVariantDTO } from "@/domain/product/product.types";

interface Step3Props {
    state: WizardState;
    onChange: (updates: Partial<WizardState>) => void;
}

export function Step3_VariantMatrix({ state, onChange }: Step3Props) {
    // Pivot variants into Matrix (Row=Color, Col=Size)
    // We need to guess which attribute is Row and which is Col.
    // Default: Color = Row, Size = Col.
    // If no Color/Size, pick 1st and 2nd attributes.

    const { rowAttr, colAttr, dim1Name, dim2Name } = useMemo(() => {
        let r = "color";
        let c = "size";
        // Try to find actual names from attributes
        const attrNames = state.attributes.map(a => a.name);

        // strict match or loose?
        const foundColor = attrNames.find(n => n.toLowerCase() === 'color' || n === 'اللون');
        const foundSize = attrNames.find(n => n.toLowerCase() === 'size' || n === 'المقاس');

        if (foundColor) r = foundColor;
        else if (attrNames.length > 0) r = attrNames[0];

        if (foundSize) c = foundSize;
        else if (attrNames.length > 1) c = attrNames[1];

        // edge case: if r == c (e.g. only 1 attribute), then colAttr is undefined/null logic needed?
        // matrix builder handles it?
        if (r === c && attrNames.length > 1) c = attrNames[1]; // fallback to next

        return { rowAttr: r, colAttr: c, dim1Name: r, dim2Name: c };
    }, [state.attributes]);

    const matrix = useMemo(() => {
        return buildStockMatrix(state.variants, rowAttr, colAttr);
    }, [state.variants, rowAttr, colAttr]);

    const updateVariantStock = (variant: ProductVariantDTO, newStock: string) => {
        const val = parseInt(newStock);
        if (isNaN(val)) return; // or set to 0?

        const newVariants = state.variants.map(v => {
            if (v.sku === variant.sku) { // SKU should be unique
                return { ...v, stock: val };
            }
            return v;
        });
        onChange({ variants: newVariants });
    };

    const updateVariantActive = (variant: ProductVariantDTO, active: boolean) => {
        const newVariants = state.variants.map(v => {
            if (v.sku === variant.sku) {
                return { ...v, isActive: active };
            }
            return v;
        });
        onChange({ variants: newVariants });
    };

    // Bulk Actions
    const setRowStock = (rowKey: string, stock: number) => {
        const newVariants = state.variants.map(v => {
            const vRowVal = v.attributes[rowAttr];
            if (vRowVal === rowKey) {
                return { ...v, stock };
            }
            return v;
        });
        onChange({ variants: newVariants });
    };

    const setColStock = (colKey: string, stock: number) => {
        const newVariants = state.variants.map(v => {
            const vColVal = v.attributes[colAttr];
            if (vColVal === colKey) {
                return { ...v, stock };
            }
            return v;
        });
        onChange({ variants: newVariants });
    };

    const setAllStock = (stock: number) => {
        const newVariants = state.variants.map(v => ({ ...v, stock }));
        onChange({ variants: newVariants });
    };


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold">جدول المخزون</h2>
                    <p className="text-muted-foreground">
                        قم بإدارة المخزون لكل متغير ({dim1Name} × {dim2Name})
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Input
                        className="w-24"
                        placeholder="الكل..."
                        type="number"
                        onChange={(e) => {
                            if (e.target.value) setAllStock(parseInt(e.target.value));
                        }}
                    />
                    <Button variant="secondary" size="sm">تطبيق على الكل</Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[150px] font-bold text-center bg-muted/50">{dim1Name} \ {dim2Name}</TableHead>
                                {matrix.colKeys.map(colKey => (
                                    <TableHead key={colKey} className="text-center min-w-[100px]">
                                        <div className="flex flex-col gap-1 items-center py-2">
                                            <span>{colKey}</span>
                                            <Input
                                                className="h-7 w-20 text-xs text-center"
                                                placeholder="مخزون"
                                                type="number"
                                                onChange={(e) => {
                                                    if (e.target.value) setColStock(colKey, parseInt(e.target.value));
                                                }}
                                            />
                                        </div>
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {matrix.rows.map(row => (
                                <TableRow key={row.rowKey}>
                                    <TableCell className="font-medium bg-muted/20">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline">{row.rowKey}</Badge>
                                            </div>
                                            <Input
                                                className="h-7 w-full text-xs"
                                                placeholder="تعيين للصف"
                                                type="number"
                                                onChange={(e) => {
                                                    if (e.target.value) setRowStock(row.rowKey, parseInt(e.target.value));
                                                }}
                                            />
                                        </div>
                                    </TableCell>
                                    {matrix.colKeys.map(colKey => {
                                        const variant = row.cells[colKey];
                                        if (!variant) {
                                            return <TableCell key={colKey} className="bg-muted/10" />;
                                        }
                                        return (
                                            <TableCell key={colKey} className="text-center p-2">
                                                <div className="space-y-1">
                                                    <Input
                                                        type="number"
                                                        className={`text-center ${variant.stock === 0 ? 'border-red-300 bg-red-50' : ''}`}
                                                        value={variant.stock}
                                                        onChange={(e) => updateVariantStock(variant, e.target.value)}
                                                        min={0}
                                                    />
                                                    <div
                                                        className="text-[10px] text-muted-foreground cursor-pointer hover:text-primary"
                                                        onClick={() => updateVariantActive(variant, !variant.isActive)}
                                                    >
                                                        {variant.isActive ? "نشط" : "غير نشط"}
                                                    </div>
                                                </div>
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
