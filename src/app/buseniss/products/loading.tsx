export default function Loading() {
  return (
    <div className="flex flex-col gap-4 h-full mx-15 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-8 w-40 bg-gray-200 rounded" />
        <div className="h-8 w-32 bg-gray-200 rounded" />
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y divide-gray-500">
          <thead className="bg-gray-600">
            <tr>
              {Array.from({ length: 7 }).map((_, i) => (
                <th key={i} className="px-4 py-2">
                  <div className="h-4 w-20 bg-gray-200 rounded" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b">
                {Array.from({ length: 7 }).map((_, j) => (
                  <td key={j} className="px-4 py-2">
                    <div className="h-4 w-16 bg-gray-100 rounded" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 