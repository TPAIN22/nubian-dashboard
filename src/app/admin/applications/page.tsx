"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, Search } from 'lucide-react';

type MerchantStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'needs_revision';
type TabKey = 'all' | MerchantStatus;

interface MerchantRow {
  _id: string;
  storeName: string;
  ownerName: string;
  email: string;
  city?: string;
  merchantType: 'individual' | 'business';
  status: MerchantStatus;
  createdAt: string;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All Merchants' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'needs_revision', label: 'Needs Revision' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'suspended', label: 'Suspended' },
];

const STATUS_PILL: Record<MerchantStatus, string> = {
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  suspended: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  needs_revision: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<MerchantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        // Load the full set once; filter client-side. Server still supports
        // ?status= for future server-side filtering if the list grows large.
        const res = await fetch('/api/admin/applications', { cache: 'no-store' });
        if (!res.ok) throw new Error(`Server responded with ${res.status}`);
        const data = await res.json();
        setApplications(Array.isArray(data.applications) ? data.applications : []);
      } catch (err: any) {
        setError(err.message || 'Failed to load applications');
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const counts = useMemo(() => {
    const base: Record<TabKey, number> = {
      all: applications.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      suspended: 0,
      needs_revision: 0,
    };
    for (const app of applications) {
      if (app.status in base) base[app.status] += 1;
    }
    return base;
  }, [applications]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return applications.filter((app) => {
      if (activeTab !== 'all' && app.status !== activeTab) return false;
      if (!q) return true;
      return (
        app.storeName?.toLowerCase().includes(q) ||
        app.ownerName?.toLowerCase().includes(q) ||
        app.email?.toLowerCase().includes(q) ||
        app.city?.toLowerCase().includes(q)
      );
    });
  }, [applications, activeTab, search]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 font-medium mb-2">Failed to load applications</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Merchants</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse every merchant on the platform. Use the tabs to filter by status.
          </p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="border-b border-border mb-4 -mx-2 overflow-x-auto">
        <nav className="flex gap-1 px-2" aria-label="Merchant status tabs">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = counts[tab.key];
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {tab.label}
                <span
                  className={`ml-2 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Search */}
      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by store, owner, email, city…"
          className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
          aria-label="Search merchants"
        />
      </div>

      <div className="bg-card rounded-lg shadow border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Store Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Owner
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Applied Date
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Review</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    {applications.length === 0
                      ? 'No applications found.'
                      : `No merchants match the current filter${search ? ' / search' : ''}.`}
                  </td>
                </tr>
              ) : (
                visible.map((app) => (
                  <tr key={app._id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">{app.storeName}</div>
                      <div className="text-sm text-muted-foreground">{app.city}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">{app.ownerName}</div>
                      <div className="text-sm text-muted-foreground">{app.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        app.merchantType === 'business' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                      }`}>
                        {app.merchantType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_PILL[app.status] ?? 'bg-muted text-muted-foreground'}`}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/applications/${app._id}`}
                        className="text-primary hover:text-primary/80 font-semibold"
                      >
                        {app.status === 'pending' || app.status === 'needs_revision' ? 'Review' : 'View'}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

