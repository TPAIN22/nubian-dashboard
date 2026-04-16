import React from "react";
import CurrenciesClient from "./CurrenciesClient";

// Currency type definition
export interface Currency {
    _id: string;
    code: string;
    name: string;
    nameAr?: string;
    symbol: string;
    symbolPosition: "before" | "after";
    isActive: boolean;
    decimals: number;
    roundingStrategy: string;
    sortOrder: number;
    allowManualRate?: boolean;
    manualRate?: number;
    manualRateUpdatedAt?: string;
    marketMarkupAdjustment?: number;
    createdAt: string;
    updatedAt: string;
}

async function CurrenciesPage() {
    return <CurrenciesClient />;
}

export default CurrenciesPage;

// Next.js settings for caching and revalidation
export const revalidate = 60;
export const dynamic = 'force-dynamic';
