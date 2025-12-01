import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../App'
import api from '../../services/api'
import Card from '../../components/Card'
import { Upload, ChevronLeft, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import Papa from 'papaparse'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PapaParseResult = any

interface PreviewRow {
  registration_number: string
  name: string
  department: string
  passout_year: number | string
}

function StudentDataUpload() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<PreviewRow[]>([])
  const [loading, setLoading] = useState(false)
  const [overwrite, setOverwrite] = useState(true)
  const [status, setStatus] = useState<{
    type: 'idle' | 'validating' | 'uploading' | 'success' | 'error'
    message: string
    details?: any
  }>({ type: 'idle', message: '' })

  const handleFileSelect = async (selectedFile: File | null) => {
    if (!selectedFile) return

    setFile(selectedFile)
    setStatus({ type: 'validating', message: 'Validating file structure...' })
    setPreview([])

    try {
      const allowed = ['.csv', '.json', '.svs']
      const ext = '.' + selectedFile.name.split('.').pop()?.toLowerCase()
      
      if (!allowed.includes(ext)) {
        setStatus({
          type: 'error',
          message: `Invalid file type. Allowed: ${allowed.join(', ')}`
        })
        setFile(null)
        return
      }

      let rows: any[] = []

      if (ext === '.csv' || ext === '.svs') {
        await new Promise<void>((resolve, reject) => {
          Papa.parse(selectedFile, {
            complete: (results: PapaParseResult) => {
              rows = results.data.slice(0, 10).filter((row: any) => 
                row && (row.registration_number || row.name)
              )
              resolve()
            },
            error: reject,
            header: true
          })
        })
      } else if (ext === '.json') {
        const text = await selectedFile.text()
        rows = JSON.parse(text).slice(0, 10)
      }

      const required = ['registration_number', 'name', 'department', 'passout_year']
      if (rows.length > 0) {
        const missing = required.filter(col => !(col in rows[0]))
        if (missing.length > 0) {
          setStatus({
            type: 'error',
            message: `Missing required columns: ${missing.join(', ')}`
          })
          setFile(null)
          return
        }
      }

      setPreview(rows)
      setStatus({
        type: 'idle',
        message: `File validated. ${rows.length} preview rows shown.`
      })
    } catch (error) {
      setStatus({
        type: 'error',
        message: `Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
      setFile(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setLoading(true)
    setStatus({ type: 'uploading', message: 'Uploading file...' })

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('overwrite', String(overwrite))

      const response = await api.post('/api/admin/uploadstudentdata', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (response.data.status === 'success') {
        setStatus({
          type: 'success',
          message: `Success! ${response.data.records_imported} records imported`,
          details: response.data
        })
        setFile(null)
        setPreview([])
        if (fileInputRef.current) fileInputRef.current.value = ''
      } else {
        setStatus({
          type: 'error',
          message: 'Upload failed',
          details: response.data
        })
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user || user.role !== 'admin') {
    navigate('/admin/login')
    return null
  }

  return (
    <div className="min-h-screen bg-neutral-bg">
      <header className="bg-primary text-white py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2 text-white/80 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-lg font-semibold">Student Data Upload</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <h2 className="text-xl font-semibold mb-6">Upload Student Master Dataset</h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select File (CSV, XLSX, JSON)
            </label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">
                {file ? file.name : 'Click to select or drag and drop'}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Supports: CSV, XLSX, XLS, SVS, JSON
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
              accept=".csv,.xlsx,.xls,.svs,.json"
              className="hidden"
            />
          </div>

          {preview.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">
                Preview ({preview.length} rows)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-2 text-left">Registration</th>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Department</th>
                      <th className="px-4 py-2 text-left">Passout Year</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">{row.registration_number}</td>
                        <td className="px-4 py-2">{row.name}</td>
                        <td className="px-4 py-2">{row.department}</td>
                        <td className="px-4 py-2">{row.passout_year}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {status.type !== 'idle' && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
                status.type === 'success'
                  ? 'bg-green-50 border border-green-200'
                  : status.type === 'error'
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-blue-50 border border-blue-200'
              }`}
            >
              {status.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              ) : status.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              ) : (
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-medium text-gray-900">{status.message}</p>
                {status.details?.errors && status.details.errors.length > 0 && (
                  <div className="mt-2 text-sm text-gray-700">
                    {status.details.errors.slice(0, 3).map((err: string, idx: number) => (
                      <p key={idx}>• {err}</p>
                    ))}
                    {status.details.errors.length > 3 && (
                      <p>• +{status.details.errors.length - 3} more errors</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={overwrite}
                onChange={(e) => setOverwrite(e.target.checked)}
                disabled={loading}
                className="rounded"
              />
              <span className="text-sm text-gray-700">
                Overwrite existing student records
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              If unchecked, new records will be appended (duplicates skipped)
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload File
                </>
              )}
            </button>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="btn-outline"
            >
              Cancel
            </button>
          </div>
        </Card>
      </main>
    </div>
  )
}

export default StudentDataUpload
