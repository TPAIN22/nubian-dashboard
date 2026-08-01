"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Link2, Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Store } from "./StoresTable";

type Candidate = {
  clerkUserId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string | null;
  existingStore: { storeName: string } | null;
  linkable: boolean;
};

export function LinkOwnerDialog({ store }: { store: Store }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState(store.email);
  const [searching, setSearching] = React.useState(false);
  const [linkingId, setLinkingId] = React.useState<string | null>(null);
  const [candidates, setCandidates] = React.useState<Candidate[] | null>(null);

  const search = React.useCallback(async (searchEmail: string) => {
    setSearching(true);
    try {
      const res = await fetch(
        `/api/merchants/${store._id}/claim-candidates?email=${encodeURIComponent(searchEmail)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "فشل البحث عن المستخدمين");
      setCandidates(data?.candidates || []);
    } catch (error: any) {
      toast.error(error.message || "فشل البحث عن المستخدمين");
      setCandidates([]);
    } finally {
      setSearching(false);
    }
  }, [store._id]);

  // Prefill with the store's own email the first time the dialog opens — that is
  // the match an admin is almost always confirming.
  React.useEffect(() => {
    if (open && candidates === null) search(store.email);
  }, [open, candidates, search, store.email]);

  const handleLink = async (candidate: Candidate) => {
    setLinkingId(candidate.clerkUserId);
    try {
      const res = await fetch(`/api/merchants/${store._id}/link-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkUserId: candidate.clerkUserId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "فشل ربط المتجر");

      toast.success(`تم ربط "${store.storeName}" بالمستخدم ومنحه صلاحية التاجر.`);
      setOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "فشل ربط المتجر");
    } finally {
      setLinkingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={store.claimRequestedBy ? "default" : "outline"}>
          <Link2 className="h-4 w-4 ms-1" />
          ربط بمالك
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>ربط &quot;{store.storeName}&quot; بمستخدم مسجَّل</DialogTitle>
          <DialogDescription>
            سينتقل المتجر ومنتجاته إلى هذا المستخدم وتُمنح له صلاحية التاجر. لا يمكن التراجع من هنا.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search-email">البحث بالبريد الإلكتروني</Label>
            <div className="flex gap-2">
              <Input
                id="search-email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    search(email);
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={() => search(email)} disabled={searching}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {searching && candidates === null && (
            <p className="text-sm text-muted-foreground">جاري البحث...</p>
          )}

          {candidates?.length === 0 && !searching && (
            <p className="text-sm text-muted-foreground">
              لا يوجد مستخدم مسجَّل بهذا البريد. اطلب من التاجر إنشاء حساب أولاً، ثم أعد المحاولة.
            </p>
          )}

          {candidates?.map((candidate) => (
            <div
              key={candidate.clerkUserId}
              className="flex items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium truncate">
                  {[candidate.firstName, candidate.lastName].filter(Boolean).join(" ") || "—"}
                </p>
                <p className="text-xs text-muted-foreground truncate" dir="ltr">
                  {candidate.email}
                </p>
                {candidate.existingStore && (
                  <Badge variant="destructive" className="text-[10px]">
                    يملك متجراً بالفعل: {candidate.existingStore.storeName}
                  </Badge>
                )}
              </div>
              <Button
                size="sm"
                disabled={!candidate.linkable || linkingId !== null}
                onClick={() => handleLink(candidate)}
              >
                {linkingId === candidate.clerkUserId && (
                  <Loader2 className="h-4 w-4 animate-spin ms-1" />
                )}
                تأكيد الربط
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
