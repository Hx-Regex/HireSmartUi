"use client"

import { useState, useEffect } from "react"
import { ChatBubbleAvatar } from "./ui/chat-bubble"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "./ui/input"
import { CornerDownLeft, Loader } from "lucide-react"
import { ChatInput } from "./ui/chat-input"
import { Button } from "./ui/button"
import { TextShimmer } from "./ui/text-shimmer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

interface FileInfo {
  name: string
  path: string
}

interface Message {
  content: string
  type: "user" | "assistant"
  timestamp: number
}

interface FileSelectorProps {
  uploadedFiles: FileInfo[]
  onFileSelect: (fileName: string) => void
  selectedFiles: string[]
}

function FileSelector({ uploadedFiles, onFileSelect, selectedFiles }: FileSelectorProps) {
  if (uploadedFiles.length <= 5) {
    return (
      <div className="space-y-2">
        {uploadedFiles.map((file, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Checkbox
              id={`file-${index}`}
              checked={selectedFiles.includes(file.name)}
              onCheckedChange={() => onFileSelect(file.name)}
            />
            <label htmlFor={`file-${index}`} className="text-sm font-medium leading-none text-white cursor-pointer">
              {file.name}
            </label>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Select onValueChange={(value) => onFileSelect(value)} value={selectedFiles[selectedFiles.length - 1] || ""}>
      <SelectTrigger className="w-full bg-[#3D3D3A] text-white border-[#373735]">
        <SelectValue placeholder={`${selectedFiles.length} CVs selected`} />
      </SelectTrigger>
      <SelectContent className="bg-[#3D3D3A] text-white border-[#373735] max-h-[300px] overflow-y-auto">
        {uploadedFiles.map((file, index) => (
          <SelectItem key={index} value={file.name}>
            <div className="flex items-center">
              <Checkbox
                checked={selectedFiles.includes(file.name)}
                onCheckedChange={() => onFileSelect(file.name)}
                className="mr-2"
              />
              {file.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default function CVChatInterface() {
  const [files, setFiles] = useState<FileList | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([])
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    const storedFiles = localStorage.getItem("uploadedFiles")
    if (storedFiles) {
      const parsedFiles = JSON.parse(storedFiles) as FileInfo[]
      setUploadedFiles(parsedFiles)
      setSelectedFiles(parsedFiles.map((file) => file.name))
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
      const response = await fetch("http://127.0.0.1:8000/chat/", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        const newFiles = data.files as FileInfo[]
        const updatedFiles = [...uploadedFiles, ...newFiles]
        setUploadedFiles(updatedFiles)
        setSelectedFiles(updatedFiles.map((file) => file.name))
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
    setSelectedFiles((prev) => (prev.includes(fileName) ? prev.filter((f) => f !== fileName) : [...prev, fileName]))
  }

  const handleChat = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (selectedFiles.length === 0 || !query.trim()) return

    const userMessage: Message = {
      content: query,
      type: "user",
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("query", query)
      selectedFiles.forEach((file) => formData.append("selected_files", file))

      const res = await fetch("http://127.0.0.1:8000/chat/", {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()

        const assistantMessage: Message = {
          content: data.response,
          type: "assistant",
          timestamp: Date.now(),
        }

        setMessages((prev) => [...prev, assistantMessage])
      } else {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to get response")
      }
    } catch (error) {
      console.error("Error querying:", error)
      alert(error instanceof Error ? error.message : "Failed to get a response")
    } finally {
      setLoading(false)
      setQuery("")
    }
  }

  if (uploadedFiles.length === 0) {
    return (
      <Card className="w-full max-w-3xl mx-auto bg-[#2A2A28] border-[#373735]">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white">Upload Your CVs</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <Input
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
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-3xl h-full flex flex-col space-y-4">
      <h2 className="text-2xl font-bold text-white">CV Chat Interface</h2>

      <Card className="bg-[#2A2A28] border-[#373735]">
        <CardHeader>
          <CardTitle className="text-white">Selected CVs</CardTitle>
        </CardHeader>
        <CardContent>
          <FileSelector uploadedFiles={uploadedFiles} onFileSelect={handleFileSelect} selectedFiles={selectedFiles} />
          <input
            type="file"
            id="file-upload"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx"
            multiple
            className="hidden"
          />
        </CardContent>
      </Card>

      <Card className="bg-[#2A2A28] border-[#373735] flex-grow">
        <CardHeader>
          <CardTitle className="text-white">Chat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex-grow overflow-y-auto space-y-4 h-[calc(100vh-500px)] py-4">
            <div className="gap-2 flex flex-col">
              {messages.map((message, index) => {
                const variant = message.type === "user" ? "sent" : "received"
                return (
                  <div
                    key={index}
                    className={`py-6 px-2 rounded-lg border-0 ${variant === "sent" ? "bg-[#1D1C1B]" : "bg-[#373735]"}`}
                  >
                    <div className="flex gap-3">
                      <ChatBubbleAvatar
                        src={
                          variant === "sent"
                            ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&q=80&crop=faces&fit=crop"
                            : "/assets/bot.png"
                        }
                        fallback={variant === "sent" ? "US" : "AI"}
                      />
                      <div className="flex-1 text-white">{message.content}</div>
                    </div>
                  </div>
                )
              })}
              {loading && (
                <div className={`py-6 px-2 rounded-lg bg-[#373735] border-0`}>
                  <div className="flex gap-3">
                    <ChatBubbleAvatar src={"/assets/bot.png"} fallback={"AI"} />
                    <div className="flex-1">
                      <TextShimmer className="font-mono text-sm" duration={1}>
                        Generating Response...
                      </TextShimmer>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#2A2A28] border-[#373735] ">
        <CardContent>
          <form
            className="relative rounded-lg border bg-[#2A2A28] border-none focus-visible:ring-0 focus-visible:outline-none p-1 "
            onSubmit={handleChat}
          >
            <ChatInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type your message here..."
              className="min-h-12 resize-none rounded-lg bg-[#2A2A28] border-0 p-3 shadow-none focus-visible:outline-none text-white"
            />
            <div className="flex items-center p-3 pt-2">
              <Button
                disabled={loading || selectedFiles.length === 0}
                type="submit"
                size="sm"
                className="ml-auto gap-1.5 bg-[#D97757] text-white hover:bg-[#C86746]"
              >
                {loading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Send Message
                    <CornerDownLeft className="size-3.5" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

 