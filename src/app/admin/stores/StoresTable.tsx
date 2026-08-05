"use client";

import * as React from "react";
import Link from "next/link";
// Aliased: `Store` is already this module's exported row type.
import { PackagePlus, Store as StoreIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LinkOwnerDialog } from "./LinkOwnerDialog";
import { StoreFormDialog } from "./StoreFormDialog";

export type Store = {
  _id: string;
  storeName: string;
  ownerName: string;
  email: string;
  phone?: string;
  city?: string;
  description?: string;
  merchantType?: "individual" | "business";
  nationalId?: string;
  crNumber?: string;
  iban?: string;
  logoUrl?: string;
  status: string;
  claimStatus: "unclaimed" | "claimed";
  claimRequestedBy?: string | null;
  claimRequestedAt?: string | null;
  profileComplete?: boolean;
  createdAt: string;
};

export function StoresTable({ stores }: { stores: Store[] }) {
  if (stores.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-16 text-center">
        <p className="text-sm text-muted-foreground">
          لا توجد متاجر غير مرتبطة. أنشئ متجراً لتبدأ بإضافة منتجات نيابة عن التاجر.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-start">المتجر</TableHead>
            <TableHead className="text-start">المالك</TableHead>
            <TableHead className="text-start">البريد الإلكتروني</TableHead>
            <TableHead className="text-start">المدينة</TableHead>
            <TableHead className="text-start">الحالة</TableHead>
            <TableHead className="text-start">إجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stores.map((store) => (
            <TableRow key={store._id}>
              <TableCell className="font-medium">
                <span className="flex items-center gap-2">
                  {store.logoUrl ? (
                    <img
                      src={store.logoUrl}
                      alt=""
                      className="h-8 w-8 shrink-0 rounded-md border object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-dashed text-muted-foreground"
                    >
                      <StoreIcon className="h-4 w-4" />
                    </span>
                  )}
                  {store.storeName}
                </span>
              </TableCell>
              <TableCell>{store.ownerName}</TableCell>
              <TableCell dir="ltr" className="text-start">{store.email}</TableCell>
              <TableCell>{store.city || "—"}</TableCell>
              <TableCell>
                {store.claimRequestedBy ? (
                  <Badge className="bg-amber-500 hover:bg-amber-500 text-white">
                    بانتظار تأكيد الربط
                  </Badge>
                ) : (
                  <Badge variant="secondary">غير مرتبط</Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <LinkOwnerDialog store={store} />
                  <StoreFormDialog store={store} />
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/admin/products-advanced/new">
                      <PackagePlus className="h-4 w-4 ms-1" />
                      إضافة منتج
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
