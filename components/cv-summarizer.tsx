"use client"

import { useState, useEffect } from "react"
import { FileText, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IT_DICTIONARY } from "@/components/itDictionary"
import { extractInfo } from "@/components/extractInfo"

interface FileInfo {
  name: string
  path: string
}

interface FileSelectorProps {
  uploadedFiles: FileInfo[]
  onFileSelect: (fileName: string) => void
  onUploadClick: () => void
  selectedFile: string
  uploadFiles: () => void
}

function FileSelector({ uploadedFiles, onFileSelect, onUploadClick, selectedFile, uploadFiles }: FileSelectorProps) {
  const useSelect = uploadedFiles.length > 0

  return (
    <div className="space-y-4">
      {useSelect ? (
        <Select onValueChange={onFileSelect} value={selectedFile}>
          <SelectTrigger className="w-full bg-[#3D3D3A] text-white border-[#373735]">
            <SelectValue placeholder="Select a CV" />
          </SelectTrigger>
          <SelectContent className="bg-[#3D3D3A] text-white border-[#373735] max-h-[300px] overflow-y-auto">
            {uploadedFiles.map((file, index) => (
              <SelectItem key={index} value={file.name}>
                {file.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <RadioGroup className="grid grid-cols-4 gap-2" defaultValue={selectedFile} onValueChange={onFileSelect}>
          {uploadedFiles.map((file, index) => (
            <label
              key={index}
              className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-[#373735] px-4 py-3 text-center shadow-sm outline-offset-2 transition-colors has-[[data-state=checked]]:border-[#D97757] has-[[data-state=checked]]:bg-[#2A2A28] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[#D97757]/70"
            >
              <RadioGroupItem id={`file-${index}`} value={file.name} className="sr-only after:absolute after:inset-0" />
              <FileText className="text-[#D97757]" size={24} aria-hidden="true" />
              <p className="text-sm font-medium leading-none text-white truncate max-w-[120px]">{file.name}</p>
            </label>
          ))}
        </RadioGroup>
      )}
      <div className="flex gap-2">
        <Button onClick={onUploadClick} className="flex-1 bg-[#3D3D3A] text-white border-[#373735] hover:bg-[#4D4D4A]">
          <Plus className="mr-2 h-4 w-4" /> Upload New
        </Button>
        <Button onClick={uploadFiles} className="flex-1 bg-[#3D3D3A] text-white border-[#373735] hover:bg-[#4D4D4A]">
          <Plus className="mr-2 h-4 w-4" /> Upload Files
        </Button>
      </div>
    </div>
  )
}

export default function CVSummarizer() {
  const [files, setFiles] = useState<FileList | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([])
  const [selectedFile, setSelectedFile] = useState("")
  const [summarizeSection, setSummarizeSection] = useState("full")
  const [summary, setSummary] = useState("")
  const [fulltext, setFulltext] = useState("")
  const [summarizing, setSummarizing] = useState(false)
  const [entities, setEntities] = useState<[string, string][]>([])
  const [skills, setSkills] = useState<string[]>([])
  const [detectedSkills, setDetectedSkills] = useState<string[]>([])
  const [contactInfo, setContactInfo] = useState<{
    emails: string[]
    phoneNumbers: string[]
    links: string[]
  }>({ emails: [], phoneNumbers: [], links: [] })

  useEffect(() => {
    const storedFiles = localStorage.getItem("uploadedFiles")
    if (storedFiles) {
      setUploadedFiles(JSON.parse(storedFiles))
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(e.target.files)
    }
  }

  const handleUploadClick = () => {
    document.getElementById("file-upload")?.click()
  }

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!files || files.length === 0) return

    setUploading(true)
    const formData = new FormData()

    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i])
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/summarize/", {
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
    }
  }

  const handleFileSelect = (fileName: string) => {
    setSelectedFile(fileName)
  }

  const handleSummarize = async () => {
    if (!selectedFile) return

    setSummarizing(true)
    try {
      const formData = new FormData()
      formData.append("file_name", selectedFile)
      formData.append("section", summarizeSection)
      formData.append("summarize_request", "true")

      const res = await fetch("http://127.0.0.1:8000/summarize/", {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        setSummary(data.summary)
        setFulltext(data.fulltext)
        setEntities(data.ner["Entities (spaCy)"] || [])
        setSkills(data.ner["Skills"] || [])

        // Extract contact information from fulltext
        const extractedInfo = extractInfo(data.fulltext)
        setContactInfo(extractedInfo)

        // Detect skills from the IT_DICTIONARY
        const detectedSkills = IT_DICTIONARY.filter(
          (skill) =>
            data.fulltext.toLowerCase().includes(skill.toLowerCase()) ||
            (data.ner["Skills"] || []).some((s: string) => s.toLowerCase() === skill.toLowerCase()),
        )
        setDetectedSkills(detectedSkills)
      } else {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to get summary")
      }
    } catch (error) {
      console.error("Error summarizing:", error)
      alert(error instanceof Error ? error.message : "Failed to get a summary")
    } finally {
      setSummarizing(false)
    }
  }

  if (uploadedFiles.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-4 text-white">Upload Your CVs</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <input
            type="file"
            onChange={handleFileChange}
            id="cv"
            name="cv"
            accept=".pdf,.doc,.docx"
            multiple
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-[#D97757] file:text-white
              hover:file:bg-[#C86746]"
          />
          <Button
            type="submit"
            disabled={!files || uploading}
            className="w-full bg-[#D97757] text-white hover:bg-[#C86746]"
          >
            {uploading ? "Uploading..." : "Upload CVs"}
          </Button>
        </form>
      </div>
    )
  }

  const EntitiesAndSkills = () => {
    // Filter out DATE entities
    const filteredEntities = entities.filter(([_, type]) => type !== "DATE")

    return (
      <Card className="bg-[#2A2A28] border-[#373735] mt-4">
        <CardHeader>
          <CardTitle className="text-white">Entities, Skills, and Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Contact Information</h3>
              <div className="space-y-2">
                {contactInfo.emails.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-white">Emails:</h4>
                    <ul className="list-disc pl-5">
                      {contactInfo.emails.map((email, index) => (
                        <li key={index} className="text-white">
                          {email}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {contactInfo.phoneNumbers.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-white">Phone Numbers:</h4>
                    <ul className="list-disc pl-5">
                      {contactInfo.phoneNumbers.map((phone, index) => (
                        <li key={index} className="text-white">
                          {phone}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {contactInfo.links.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-white">Links:</h4>
                    <ul className="list-disc pl-5">
                      {contactInfo.links.map((link, index) => (
                        <li key={index} className="text-white">
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#D97757] hover:underline"
                          >
                            {link}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Entities</h3>
              <div className="flex flex-wrap gap-2">
                {filteredEntities.map(([entity, type], index) => (
                  <Badge key={index} variant="secondary" className="bg-[#3D3D3A] text-white">
                    {entity} ({type})
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Detected Skills</h3>
              <div className="flex flex-wrap gap-2">
                {detectedSkills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="bg-[#D97757] text-white">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
            {/* <div>
              <h3 className="text-lg font-semibold text-white mb-2">Other Skills</h3>
              <div className="flex flex-wrap gap-2">
                {skills
                  .filter((skill) => !detectedSkills.includes(skill))
                  .map((skill, index) => (
                    <Badge key={index} variant="secondary" className="bg-[#3D3D3A] text-white">
                      {skill}
                    </Badge>
                  ))}
              </div>
            </div> */}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-3xl h-full flex flex-col space-y-4">
      <h2 className="text-2xl font-bold text-white">CV Summarizer</h2>
      <div className="my-2">
        <FileSelector
          uploadedFiles={uploadedFiles}
          onFileSelect={handleFileSelect}
          onUploadClick={handleUploadClick}
          selectedFile={selectedFile}
          //@ts-expect-error
          uploadFiles={handleUpload}
        />
        <input
          type="file"
          id="file-upload"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx"
          multiple
          className="hidden"
        />
      </div>

      <Card className="bg-[#2A2A28] border-[#373735]">
        <CardHeader>
          <CardTitle className="text-white">Summarize CV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select onValueChange={(value) => setSummarizeSection(value)}>
            <SelectTrigger className="w-full bg-[#3D3D3A] text-white border-[#373735]">
              <SelectValue placeholder="Select section to summarize" />
            </SelectTrigger>
            <SelectContent className="bg-[#3D3D3A] text-white border-[#373735]">
              <SelectItem value="full">Full CV</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="experience">Experience</SelectItem>
              <SelectItem value="skills">Skills</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleSummarize}
            disabled={!selectedFile || summarizing}
            className="w-full bg-[#D97757] text-white hover:bg-[#C86746]"
          >
            {summarizing ? "Summarizing..." : "Summarize"}
          </Button>
          <div className="bg-[#373735] p-4 rounded-lg min-h-[200px] max-h-[400px] overflow-y-auto">
            {summary ? (
              <p className="text-white">{summary}</p>
            ) : (
              <p className="text-gray-400">Summary will appear here</p>
            )}
          </div>
        </CardContent>
      </Card>
      <EntitiesAndSkills />
    </div>
  )
}

