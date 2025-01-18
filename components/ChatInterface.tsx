'use client'

import { useState, useEffect } from 'react'

interface FileInfo {
  name: string;
  path: string;
}

export default function ChatInterface() {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([])
  const [selectedFile, setSelectedFile] = useState('')

  useEffect(() => {
    const storedFiles = localStorage.getItem('uploadedFiles')
    if (storedFiles) {
      setUploadedFiles(JSON.parse(storedFiles))
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedFile) {
      setResponse('Please select a CV file first.')
      return
    }
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('query', query)
      formData.append('selected_file', selectedFile)

      const res = await fetch('http://127.0.0.1:8000/chat/', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        setResponse(data.response)
      } else {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to get response')
      }
    } catch (error) {
      console.error('Error querying:', error)
      setResponse(error instanceof Error ? error.message : 'Failed to get a response. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl space-y-4">
      <div>
        <label htmlFor="file-select" className="block text-sm font-medium text-gray-700 mb-2">
          Select CV File:
        </label>
        <select
          id="file-select"
          value={selectedFile}
          onChange={(e) => setSelectedFile(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="">Select a file</option>
          {uploadedFiles.map((file, index) => (
            <option key={index} value={file.name}>
              {file.name}
            </option>
          ))}
        </select>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question about your CV"
          className="w-full p-2 border border-gray-300 rounded"
        />
        <button
          type="submit"
          disabled={loading || !query || !selectedFile}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </form>
      {response && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h2 className="font-bold mb-2">Response:</h2>
          <p>{response}</p>
        </div>
      )}
    </div>
  )
}

