import { useState } from 'react'
import { Upload } from 'lucide-react'

interface FileUploadProps {
  onFile: (file: File) => void
  accept?: string
  label?: string
}

export default function FileUpload({ onFile, accept = "*", label = "Upload File" }: FileUploadProps) {
  const [dragging, setDragging] = useState(false)
  
  return (
    <div
      onDragOver={() => setDragging(true)}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) onFile(file)
      }}
      className={`border-2 border-dashed p-8 rounded-lg text-center cursor-pointer transition ${
        dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}
    >
      <Upload className="mx-auto mb-2 text-gray-400" size={32} />
      <p className="font-medium">{label}</p>
      <p className="text-sm text-gray-500">or drag and drop</p>
      <input
        type="file"
        accept={accept}
        onChange={(e) => e.target.files && onFile(e.target.files[0])}
        className="hidden"
        id="file-input"
      />
      <label htmlFor="file-input" className="cursor-pointer">
        <input
          type="file"
          accept={accept}
          onChange={(e) => e.target.files && onFile(e.target.files[0])}
          className="hidden"
        />
      </label>
    </div>
  )
}
