import { Metadata } from 'next';
import Link from 'next/link';
import { connect } from '@/lib/connect';
import MerchantApplication from '@/models/MerchantApplication';

export const metadata: Metadata = {
  title: 'Merchant Applications | Admin Dashboard',
};

// Next.js server component to fetch applications securely
async function getApplications() {
  await connect();
  const applications = await MerchantApplication.find({}).sort({ createdAt: -1 }).lean();
  // Stringify and parse to avoid Mongoose doc serialization issues in Next.js Server Components
  return JSON.parse(JSON.stringify(applications));
}

export default async function ApplicationsPage() {
  const applications = await getApplications();

  return (
    <div className="p-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Merchant Applications</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A list of all incoming Merchant requests. Review and approve directly from here.
          </p>
        </div>
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
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No applications found.
                  </td>
                </tr>
              ) : (
                applications.map((app: any) => (
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
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        app.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        app.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      }`}>
                        {app.status}
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
                        Review
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
