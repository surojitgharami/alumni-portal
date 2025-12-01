interface DataTableProps {
  columns: { header: string; accessor: string }[]
  data: any[]
  actions?: (row: any) => React.ReactNode
  loading?: boolean
}

export default function DataTable({ columns, data, actions, loading }: DataTableProps) {
  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (data.length === 0) return <div className="p-8 text-center text-gray-500">No data found</div>
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 border-b">
            {columns.map(col => (
              <th key={col.accessor} className="p-3 text-left font-semibold">{col.header}</th>
            ))}
            {actions && <th className="p-3 text-left font-semibold">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-b hover:bg-gray-50">
              {columns.map(col => (
                <td key={col.accessor} className="p-3">{row[col.accessor]}</td>
              ))}
              {actions && <td className="p-3">{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
