import { useState, useEffect } from 'react'
import { useAuth } from '../../App'
import DataTable from '../../components/DataTable'
import { AlertCircle, Download } from 'lucide-react'

export default function ImportHistory() {
  const { user } = useAuth()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Fetch import history from backend
    setLoading(false)
    // Mock data for now
    setHistory([
      { id: 1, fileName: 'students_batch_1.xlsx', uploadDate: '2024-11-29', count: 150, errors: 0 },
      { id: 2, fileName: 'students_batch_2.csv', uploadDate: '2024-11-28', count: 200, errors: 5 }
    ])
  }, [])
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Student Import History</h1>
      
      <DataTable
        columns={[
          { header: 'File Name', accessor: 'fileName' },
          { header: 'Upload Date', accessor: 'uploadDate' },
          { header: 'Processed', accessor: 'count' },
          { header: 'Errors', accessor: 'errors' }
        ]}
        data={history}
        loading={loading}
        actions={(row) => (
          <div className="flex gap-2">
            <button className="text-blue-600 hover:underline text-sm">View Log</button>
            {row.errors > 0 && <button className="text-orange-600 hover:underline text-sm">Retry</button>}
          </div>
        )}
      />
    </div>
  )
}
