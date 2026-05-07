"use client";

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeft, CheckCircle2, XCircle, Edit3, AlertCircle, ChevronLeft, ChevronRight, X, Download } from "lucide-react";
import Link from 'next/link';

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [notes, setNotes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<'approved' | 'rejected' | 'needs_revision' | 'suspended' | null>(null);

  // Lightbox: -1 = closed, -2 = logo, 0..n = product sample index
  const [viewerIndex, setViewerIndex] = useState<number>(-1);
  const sampleCount: number = app?.productSamples?.length || 0;
  const viewerSrc: string | null =
    viewerIndex === -2
      ? app?.logoUrl ?? null
      : viewerIndex >= 0
        ? app?.productSamples?.[viewerIndex] ?? null
        : null;

  useEffect(() => {
    if (viewerIndex === -1) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setViewerIndex(-1);
      if (viewerIndex >= 0 && sampleCount > 1) {
        if (e.key === 'ArrowRight') setViewerIndex((i) => (i + 1) % sampleCount);
        if (e.key === 'ArrowLeft') setViewerIndex((i) => (i - 1 + sampleCount) % sampleCount);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewerIndex, sampleCount]);

  useEffect(() => {
    // In a real robust app, this would be a server component fetching data,
    // or an SWR/React Query hook. We'll use a fast fetch implementation here.
    const fetchApp = async () => {
      try {
        const res = await fetch(`/api/admin/applications/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setApp(data.application);
      } catch (err) {
        toast.error("Failed to load application details.");
      } finally {
        setLoading(false);
      }
    };
    fetchApp();
  }, [id]);

  const updateStatus = async (status: 'approved' | 'rejected' | 'needs_revision' | 'suspended', reasonOrNotes?: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status,
          ...(status === 'rejected' && { rejectionReason: reasonOrNotes }),
          ...(status === 'needs_revision' && { revisionNotes: reasonOrNotes }),
          ...(status === 'suspended' && { suspensionReason: reasonOrNotes })
        })
      });
      if (!res.ok) throw new Error("Update failed");
      
      const data = await res.json();
      setApp(data.application);
      toast.success(`Application status updated to ${status}`);
      setDialogOpen(false);
      setNotes("");
    } catch (err) {
      toast.error("Failed to update status.");
    } finally {
      setIsUpdating(false);
    }
  };

  const openStatusDialog = (status: 'rejected' | 'needs_revision') => {
    setTargetStatus(status);
    setNotes("");
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Application not found.</p>
        <Link href="/admin/applications" className="text-primary mt-4 inline-block hover:underline">
          Go back to list
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin/applications')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{app.storeName}</h1>
            <p className="text-sm text-muted-foreground">Application submitted on {new Date(app.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant={
            app.status === 'approved' ? 'default' : 
            app.status === 'suspended' ? 'outline' :
            app.status === 'rejected' ? 'destructive' : 
            app.status === 'needs_revision' ? 'outline' : 'secondary'
          } className={`text-sm px-3 py-1 ${
            app.status === 'needs_revision' ? 'border-yellow-500 text-yellow-600' : 
            app.status === 'suspended' ? 'border-red-500 text-red-600 bg-red-500/10' : ''
          }`}>
            Status: {app.status.toUpperCase().replace('_', ' ')}
          </Badge>
          
          {app.status === 'approved' && (
            <Button 
              variant="outline" 
              className="border-red-500 text-red-600 hover:bg-red-500/10 gap-2"
              onClick={() => {
                setTargetStatus('suspended');
                setNotes("");
                setDialogOpen(true);
              }}
              disabled={isUpdating}
            >
              <AlertCircle className="w-4 h-4" />
              Suspend Merchant
            </Button>
          )}

          {app.status === 'suspended' && (
            <Button 
              className="bg-green-600 hover:bg-green-700 gap-2"
              onClick={() => updateStatus('approved')}
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Re-Activate Account
            </Button>
          )}

          {app.status === 'pending' && (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => openStatusDialog('needs_revision')}
                disabled={isUpdating}
                className="gap-2 border-yellow-600/50 text-yellow-600 hover:bg-yellow-600/10 dark:text-yellow-400 dark:border-yellow-400/30 dark:hover:bg-yellow-400/10"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit3 className="w-4 h-4" />}
                Request Revision
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => openStatusDialog('rejected')}
                disabled={isUpdating}
                className="gap-2"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Reject
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700 gap-2"
                onClick={() => updateStatus('approved')}
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Approve
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {targetStatus === 'needs_revision' ? 'Request Revisions' : 
               targetStatus === 'suspended' ? 'Suspend Merchant' : 'Reject Application'}
            </DialogTitle>
            <DialogDescription>
              {targetStatus === 'needs_revision' 
                ? 'Please specify what the merchant needs to fix in their application.' 
                : targetStatus === 'suspended'
                ? 'This will deactivate the merchant account and ALL their products. The merchant will be notified.'
                : 'Please specify the reason for rejecting this application.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="notes" className="mb-2 block">
              {targetStatus === 'needs_revision' ? 'Revision Notes' : 
               targetStatus === 'suspended' ? 'Suspension Remark' : 'Rejection Reason'}
            </Label>
            <Textarea 
              id="notes"
              placeholder={
                targetStatus === 'needs_revision' ? 'e.g. Please upload a clearer logo image...' : 
                targetStatus === 'suspended' ? 'e.g. Violation of marketplace policy Section 4...' :
                'e.g. Business details do not match official records...'
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={isUpdating}>Cancel</Button>
            <Button 
              variant={targetStatus === 'rejected' || targetStatus === 'suspended' ? 'destructive' : 'default'}
              disabled={isUpdating || (targetStatus !== 'suspended' && !notes.trim())}
              onClick={() => updateStatus(targetStatus!, notes)}
            >
              {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {targetStatus === 'needs_revision' ? 'Send Request' : 
               targetStatus === 'suspended' ? 'Confirm Suspension' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {app.status === 'needs_revision' && app.revisionNotes && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          <div>
            <h4 className="font-bold text-yellow-800 dark:text-yellow-300">Revision Notes Sent:</h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-200/80">{app.revisionNotes}</p>
          </div>
        </div>
      )}

      {app.status === 'rejected' && app.rejectionReason && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
          <div>
            <h4 className="font-bold text-red-800 dark:text-red-400">Rejection Reason:</h4>
            <p className="text-sm text-red-700 dark:text-red-300/80">{app.rejectionReason}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="bg-muted/30 pb-4">
            <CardTitle className="text-lg">Merchant Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Owner Name</p>
                <p className="mt-1 font-medium">{app.ownerName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Registration Type</p>
                <p className="mt-1 font-medium capitalize">{app.merchantType}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p className="mt-1 font-medium">{app.phone}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="mt-1 font-medium">{app.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">National ID</p>
                <p className="mt-1 font-medium font-mono bg-muted inline-block px-2 rounded border border-border">{app.nationalId}</p>
              </div>
              {app.merchantType === 'business' && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">CR Number</p>
                  <p className="mt-1 font-medium font-mono">{app.crNumber || "N/A"}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-muted/30 pb-4">
            <CardTitle className="text-lg">Store & Financial Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Store Description</p>
              <p className="text-sm bg-muted p-3 rounded-md border border-border">{app.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">City</p>
                <p className="mt-1 font-medium">{app.city}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Categories</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {app.categories?.map((cat: string) => (
                    <Badge key={cat} variant="outline" className="text-xs">{cat}</Badge>
                  ))}
                </div>
              </div>
              <div className="col-span-2 mt-2">
                <p className="text-sm font-medium text-muted-foreground">IBAN</p>
                <p className="mt-1 font-medium font-mono text-sm tracking-widest">{app.iban}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="bg-muted/30 pb-4">
          <CardTitle className="text-lg">Product Samples & Verification</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">Store Logo</p>
              {app.logoUrl ? (
                <button
                  type="button"
                  onClick={() => setViewerIndex(-2)}
                  className="group relative w-24 h-24 rounded-xl border border-border p-1 bg-background shadow-sm cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                >
                  <img src={app.logoUrl} alt="Store Logo" className="w-full h-full object-cover rounded-lg" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                    <span className="text-white text-[10px] font-medium px-2 py-0.5 bg-black/50 rounded-full backdrop-blur-sm">View Full</span>
                  </div>
                </button>
              ) : (
                <div className="w-24 h-24 rounded-xl border border-dashed border-border bg-muted flex items-center justify-center text-xs text-muted-foreground">No logo</div>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">Product Images ({app.productSamples?.length || 0})</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {app.productSamples?.map((url: string, i: number) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setViewerIndex(i)}
                    className="group relative aspect-square rounded-xl border border-border overflow-hidden bg-muted cursor-pointer hover:ring-2 hover:ring-primary transition-all shadow-sm"
                  >
                    <img src={url} alt={`Sample ${i+1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-medium px-2 py-1 bg-black/40 rounded-full backdrop-blur-sm">View Full</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {viewerSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setViewerIndex(-1)}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setViewerIndex(-1); }}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <a
            href={viewerSrc}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-4 right-16 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
            aria-label="Open in new tab"
          >
            <Download className="w-5 h-5" />
          </a>

          {viewerIndex >= 0 && sampleCount > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setViewerIndex((i) => (i - 1 + sampleCount) % sampleCount); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
                aria-label="Previous"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setViewerIndex((i) => (i + 1) % sampleCount); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
                aria-label="Next"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <div
            className="relative max-w-[90vw] max-h-[85vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={viewerSrc}
              alt={viewerIndex === -2 ? 'Store Logo' : `Sample ${viewerIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
            <div className="mt-3 text-white/80 text-sm font-medium">
              {viewerIndex === -2
                ? 'Store Logo'
                : `Sample ${viewerIndex + 1} of ${sampleCount}`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
