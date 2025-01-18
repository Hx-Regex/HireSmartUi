'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface FileInfo {
  name: string;
  path: string;
}

export default function UploadForm() {
  const [files, setFiles] = useState<FileList | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([])
  const router = useRouter()

  useEffect(() => {
    const storedFiles = localStorage.getItem('uploadedFiles')
    if (storedFiles) {
      setUploadedFiles(JSON.parse(storedFiles))
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(e.target.files)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!files || files.length === 0) return

    setUploading(true)
    const formData = new FormData()
    
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i])
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/chat/', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        const newFiles = data.files as FileInfo[]
        const updatedFiles = [...uploadedFiles, ...newFiles]
        setUploadedFiles(updatedFiles)
        localStorage.setItem('uploadedFiles', JSON.stringify(updatedFiles))
        router.push('/chat')
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Error uploading files:', error)
      alert('Failed to upload CVs. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx"
          multiple
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-violet-50 file:text-violet-700
            hover:file:bg-violet-100"
        />
        <button
          type="submit"
          disabled={!files || uploading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {uploading ? 'Uploading...' : 'Upload CVs'}
        </button>
      </form>
      {uploadedFiles.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Uploaded Files:</h2>
          <ul className="list-disc pl-5">
            {uploadedFiles.map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

