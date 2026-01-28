"use client";

import { useState, useEffect } from "react";
import { ProductAttributeDefDTO, SelectedAttributes } from "@/types/shop"; // Ensure this type exists
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface VariantSelectorProps {
  attributes: ProductAttributeDefDTO[];
  onSelectionChange: (selection: SelectedAttributes) => void;
}

export function VariantSelector({ attributes, onSelectionChange }: VariantSelectorProps) {
  const [selected, setSelected] = useState<SelectedAttributes>({});

  // Initialize defaults if needed or wait for user input?
  // Usually better to wait or select first option.
  // For now, let's start empty to force user selection, or select 1st if required.
  useEffect(() => {
     // Optional: Auto-select first options
     const defaults: SelectedAttributes = {};
     let hasDefaults = false;
     attributes.forEach(attr => {
        if (attr.options && attr.options.length > 0) {
           defaults[attr.name] = attr.options[0];
           hasDefaults = true;
        }
     });
     if (hasDefaults) {
        setSelected(defaults);
        onSelectionChange(defaults);
     }
  }, [attributes]); // Run only when attributes definition changes (mount)

  const handleSelect = (attrName: string, value: string) => {
    const newSelection = { ...selected, [attrName]: value };
    setSelected(newSelection);
    onSelectionChange(newSelection);
  };

  if (!attributes || attributes.length === 0) return null;

  return (
    <div className="space-y-6">
      {attributes.map((attr) => (
        <div key={attr._id}>
          <h4 className="text-sm font-medium text-zinc-900 mb-3 block">
            {attr.displayName || attr.name}: <span className="text-zinc-500 font-normal">{selected[attr.name]}</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {attr.options?.map((option) => {
               const isActive = selected[attr.name] === option;
               return (
                 <button
                   key={option}
                   onClick={() => handleSelect(attr.name, option)}
                   className={cn(
                     "px-4 py-2 rounded-lg text-sm font-medium border transition-all",
                     isActive
                       ? "border-zinc-900 bg-zinc-900 text-white shadow-md"
                       : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
                   )}
                 >
                   {option}
                 </button>
               );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
