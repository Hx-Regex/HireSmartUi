"use client"

import { useState, useEffect } from "react"
import { FileText, Loader } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface FileInfo {
  name: string
  path: string
}

interface RankedCV {
  score: number
  name: string
}

export default function CVRanker() {
  const [files, setFiles] = useState<FileList | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([])
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [jobDescription, setJobDescription] = useState("")
  const [ranking, setRanking] = useState<RankedCV[]>([])
  const [isRanking, setIsRanking] = useState(false)

  useEffect(() => {
    const storedFiles = localStorage.getItem("uploadedFiles")
    if (storedFiles) {
      const parsedFiles = JSON.parse(storedFiles) as FileInfo[]
      setUploadedFiles(parsedFiles)
      setSelectedFiles(parsedFiles.map((file) => file.name))
    }
  }, [])

  useEffect(() => {
    setSelectedFiles(uploadedFiles.map((file) => file.name))
  }, [uploadedFiles])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(e.target.files)
    }
  }

  const handleUpload = async () => {
    if (!files || files.length === 0) return

    setUploading(true)
    const formData = new FormData()

    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i])
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/rank/", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        const newFiles = data.files as FileInfo[]
        const updatedFiles = [...uploadedFiles, ...newFiles]
        setUploadedFiles(updatedFiles)
        localStorage.setItem("uploadedFiles", JSON.stringify(updatedFiles))
      } else {
        throw new Error("Upload failed")
      }
    } catch (error) {
      console.error("Error uploading files:", error)
      alert("Failed to upload CVs. Please try again.")
    } finally {
      setUploading(false)
      setFiles(null)
    }
  }

  const handleRank = async () => {
    if (selectedFiles.length === 0 || !jobDescription.trim()) return

    setIsRanking(true)
    try {
      const formData = new FormData()
      formData.append("job_description", jobDescription)
      selectedFiles.forEach((file) => formData.append("selected_files", file))
      formData.append("rank_request", "true")

      const res = await fetch("http://127.0.0.1:8000/rank/", {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        setRanking(data.ranked_cvs.map(([score, name]: [number, string]) => ({ score, name })))
      } else {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to rank CVs")
      }
    } catch (error) {
      console.error("Error ranking CVs:", error)
      alert(error instanceof Error ? error.message : "Failed to rank CVs")
    } finally {
      setIsRanking(false)
    }
  }

  const clearUploadedFiles = () => {
    setUploadedFiles([])
    setFiles(null)
    setRanking([])
    setSelectedFiles([])
    localStorage.removeItem("uploadedFiles")
  }

  const handleFileSelect = (fileName: string) => {
    setSelectedFiles((prev) => (prev.includes(fileName) ? prev.filter((f) => f !== fileName) : [...prev, fileName]))
  }

  return (
    <div className="w-full max-w-3xl h-full flex flex-col space-y-4">
      <h2 className="text-2xl font-bold text-white">CV Ranker</h2>

      <Card className="bg-[#2A2A28] border-[#373735]">
        <CardHeader>
          <CardTitle className="text-white">Rank CVs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-white font-semibold">Select CVs to Rank:</h3>
              <Select onValueChange={handleFileSelect} value={selectedFiles[selectedFiles.length - 1] || ""}>
                <SelectTrigger className="w-full bg-[#3D3D3A] text-white border-[#373735]">
                  <SelectValue placeholder="Select CVs" />
                </SelectTrigger>
                <SelectContent className="bg-[#3D3D3A] text-white border-[#373735] max-h-[300px] overflow-y-auto">
                  {uploadedFiles.map((file, index) => (
                    <SelectItem key={index} value={file.name}>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedFiles.includes(file.name)}
                          onChange={() => handleFileSelect(file.name)}
                          className="mr-2"
                        />
                        {file.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="bg-[#373735] p-4 rounded-lg max-h-[150px] overflow-y-auto">
                <h3 className="text-white font-semibold mb-2">
                  {selectedFiles.length > 5 ? `Selected ${selectedFiles.length} CVs` : "Selected CVs:"}
                </h3>
                {selectedFiles.length <= 5 ? (
                  selectedFiles.map((file, index) => (
                    <div key={index} className="text-white py-1">
                      <FileText className="inline-block mr-2 text-[#D97757]" size={16} />
                      <span>{file}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-white py-1">
                    <FileText className="inline-block mr-2 text-[#D97757]" size={16} />
                    <span>Multiple CVs selected</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <Textarea
            placeholder="Enter job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="bg-[#3D3D3A] text-white border-[#373735] min-h-[100px]"
          />

          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => {
                document.getElementById("file-upload")?.click()
                handleUpload()
              }}
              className="flex-1 bg-[#3D3D3A] text-white hover:bg-[#4D4D4A]"
            >
              {uploading ? "Uploading..." : "Upload"}
            </Button>
            <Button
              onClick={handleRank}
              disabled={selectedFiles.length === 0 || !jobDescription.trim() || isRanking}
              className="flex-1 bg-[#D97757] text-white hover:bg-[#C86746]"
            >
              {isRanking ? (
                <span className="flex gap-2 items-center">
                  <Loader className="w-4 h-4 animate-spin" /> Ranking...{" "}
                </span>
              ) : (
                "Confirm"
              )}
            </Button>
            <Button onClick={clearUploadedFiles} className="flex-1 bg-[#373735] text-white hover:bg-[#4A4A48]">
              Clear
            </Button>
          </div>

          <input
            type="file"
            id="file-upload"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx"
            multiple
            className="hidden"
          />

          {ranking.length > 0 && (
            <div className="bg-[#373735] p-4 rounded-lg max-h-[300px] overflow-y-auto">
              <h3 className="text-white font-semibold mb-2">Ranking Results:</h3>
              {ranking.map((cv, index) => (
                <div key={index} className="flex justify-between text-white py-1">
                  <span>{cv.name}</span>
                  <span>{cv.score.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

