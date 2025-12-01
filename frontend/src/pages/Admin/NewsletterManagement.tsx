import { useState, useEffect } from 'react'
import { useAuth } from '../../App'
import DataTable from '../../components/DataTable'
import FileUpload from '../../components/FileUpload'
import { Upload, Eye, Trash2 } from 'lucide-react'

export default function NewsletterManagement() {
  const { user, token } = useAuth()
  const [newsletters, setNewsletters] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  
  useEffect(() => {
    fetchNewsletters()
  }, [])
  
  const fetchNewsletters = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/newsletters`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      setNewsletters(data)
    } catch (error) {
      console.error('Error fetching newsletters:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleUpload = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/newsletters`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      setShowUpload(false)
      fetchNewsletters()
    } catch (error) {
      console.error('Upload error:', error)
    }
  }
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Newsletter Management</h1>
        <button
          onClick={() => setShowUpload(true)}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 flex items-center gap-2"
        >
          <Upload size={18} /> Upload Newsletter
        </button>
      </div>
      
      {showUpload && (
        <div className="mb-6 p-4 border rounded-lg">
          <FileUpload onFile={handleUpload} accept=".pdf" label="Upload PDF Newsletter" />
        </div>
      )}
      
      <DataTable
        columns={[
          { header: 'Title', accessor: 'title' },
          { header: 'Date', accessor: 'publishedDate' },
          { header: 'Status', accessor: 'status' }
        ]}
        data={newsletters}
        loading={loading}
        actions={(row) => (
          <div className="flex gap-2">
            <button className="text-blue-600"><Eye size={18} /></button>
            <button className="text-red-600"><Trash2 size={18} /></button>
          </div>
        )}
      />
    </div>
  )
}
