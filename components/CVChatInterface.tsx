"use client";

import { useState, useEffect } from "react";
import { ChatBubbleAvatar } from "./ui/chat-bubble";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "./ui/input";
import { CornerDownLeft, FileText, Plus } from "lucide-react";
import { ChatInput } from "./ui/chat-input";
import { Button } from "./ui/button";
import { Mic, Paperclip } from "lucide-react";
import { TextShimmer } from "./ui/text-shimmer";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { TextGenerateEffect } from "./ui/text-generate-effect";

interface FileInfo {
  name: string;
  path: string;
}

interface Message {
  content: string;
  type: "user" | "assistant";
  timestamp: number;
}

interface ChatHistory {
  [fileName: string]: Message[];
}

interface FileSelectorProps {
  uploadedFiles: Array<{ name: string; path: string }>;
  onFileSelect: (fileName: string) => void;
  onUploadClick: () => void;
  selectedFile: string;
  uploadfiles: () => void;
}

export function FileSelector({
  uploadedFiles,
  onFileSelect,
  onUploadClick,
  selectedFile,
  uploadfiles,
}: FileSelectorProps) {
  return (
    <RadioGroup
      className="grid grid-cols-4 gap-2"
      defaultValue={selectedFile}
      onValueChange={onFileSelect}
    >
      {uploadedFiles.map((file, index) => (
        <label
          key={index}
          className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-[#373735] px-4 py-3 text-center shadow-sm outline-offset-2 transition-colors has-[[data-state=checked]]:border-[#D97757] has-[[data-state=checked]]:bg-[#2A2A28] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[#D97757]/70"
        >
          <RadioGroupItem
            id={`file-${index}`}
            value={file.name}
            className="sr-only after:absolute after:inset-0"
          />
          <FileText className="text-[#D97757]" size={24} aria-hidden="true" />
          <p className="text-sm font-medium leading-none text-white truncate max-w-[120px]">
            {file.name}
          </p>
        </label>
      ))}

      {/* Upload new file option */}
      <button
        onClick={onUploadClick}
        className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-dashed border-[#373735] px-4 py-3 text-center shadow-sm outline-offset-2 transition-colors hover:border-[#D97757] hover:bg-[#2A2A28]"
      >
        <Plus className="text-[#D97757]" size={24} aria-hidden="true" />
        <p className="text-sm font-medium leading-none text-white">
          Upload New
        </p>
      </button>
      <button
        onClick={uploadfiles}
        className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-dashed border-[#373735] px-4 py-3 text-center shadow-sm outline-offset-2 transition-colors hover:border-[#D97757] hover:bg-[#2A2A28]"
      >
        <Plus className="text-[#D97757]" size={24} aria-hidden="true" />
        <p className="text-sm font-medium leading-none text-white">
          Upload FILES
        </p>
      </button>
    </RadioGroup>
  );
}

export default function CVChatInterface() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistory>({});

  // Load uploaded files and chat history from localStorage
  useEffect(() => {
    const storedFiles = localStorage.getItem("uploadedFiles");
    const storedChats = localStorage.getItem("chatHistory");

    if (storedFiles) {
      setUploadedFiles(JSON.parse(storedFiles));
    }
    if (storedChats) {
      setChatHistory(JSON.parse(storedChats));
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(e.target.files);
    }
  };
  const handleUploadClick = () => {
    // Trigger file input click
    document.getElementById("file-upload")?.click();
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/chat/", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const newFiles = data.files as FileInfo[];
        const updatedFiles = [...uploadedFiles, ...newFiles];
        setUploadedFiles(updatedFiles);
        localStorage.setItem("uploadedFiles", JSON.stringify(updatedFiles));

        // Initialize chat history for new files
        const updatedChatHistory = { ...chatHistory };
        newFiles.forEach((file) => {
          if (!updatedChatHistory[file.name]) {
            updatedChatHistory[file.name] = [];
          }
        });
        setChatHistory(updatedChatHistory);
        localStorage.setItem("chatHistory", JSON.stringify(updatedChatHistory));
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Failed to upload CVs. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (fileName: string) => {
    setSelectedFile(fileName);
  };

  const handleChat = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFile || !query.trim()) return;

    // Add user message to history
    const userMessage: Message = {
      content: query,
      type: "user",
      timestamp: Date.now(),
    };

    const updatedHistory = {
      ...chatHistory,
      [selectedFile]: [...(chatHistory[selectedFile] || []), userMessage],
    };
    setChatHistory(updatedHistory);
    localStorage.setItem("chatHistory", JSON.stringify(updatedHistory));

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("query", query);
      formData.append("selected_file", selectedFile);

      const res = await fetch("http://127.0.0.1:8000/chat/", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();

        // Add assistant message to history
        const assistantMessage: Message = {
          content: data.response,
          type: "assistant",
          timestamp: Date.now(),
        };

        const finalHistory = {
          ...updatedHistory,
          [selectedFile]: [
            ...(updatedHistory[selectedFile] || []),
            assistantMessage,
          ],
        };
        setChatHistory(finalHistory);
        localStorage.setItem("chatHistory", JSON.stringify(finalHistory));
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to get response");
      }
    } catch (error) {
      console.error("Error querying:", error);
      alert(
        error instanceof Error ? error.message : "Failed to get a response"
      );
    } finally {
      setLoading(false);
      setQuery("");
    }
  };

  if (uploadedFiles.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-4">Upload Your CVs</h2>
        {/* <button
          onClick={}
          className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-dashed border-[#373735] px-4 py-3 text-center shadow-sm outline-offset-2 transition-colors hover:border-[#D97757] hover:bg-[#2A2A28]"
        >
          <Plus className="text-[#D97757]" size={24} aria-hidden="true" />
          <p className="text-sm font-medium leading-none text-white">
            Upload New
          </p>
        </button> */}
        
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
              file:bg-violet-50 file:text-violet-700
              hover:file:bg-violet-100"
          />
          <button
            type="submit"
            disabled={!files || uploading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {uploading ? "Uploading..." : "Upload CVs"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl h-full flex flex-col">
      {/* <h2 className="text-2xl font-bold mb-auto">Chat with Your CV</h2> */}
      <div className="my-2">
        {/* <label
          htmlFor="file-select"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Select CV File:
        </label> */}
        {/* <select
          id="file-select"
          value={selectedFile}
          onChange={(e) => handleFileSelect(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="">Select a file</option>
          {uploadedFiles.map((file, index) => (
            <option key={index} value={file.name}>
              {file.name}
            </option>
          ))}
        </select> */}
        {/* <Select onValueChange={(value) => handleFileSelect(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select CV" />
          </SelectTrigger>
          <SelectContent>
            {uploadedFiles.map((file, index) => (
              <SelectItem key={index} value={file.name}>
                {file.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select> */}
        {/* <h2 className="text-xl font-semibold text-white mb-4">
          Chat with Your CV
        </h2> */}
        <FileSelector
          uploadedFiles={uploadedFiles}
          onFileSelect={handleFileSelect}
          onUploadClick={handleUploadClick}
          selectedFile={selectedFile}
          //@ts-expect-error
          uploadfiles={handleUpload}
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

      {/* Chat History */}
      <div className="flex-grow overflow-y-auto space-y-4 h-[calc(100vh-290px)] py-4">
        {/* {selectedFile && chatHistory[selectedFile]?.map((message, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg ${
              message.type === 'user' 
                ? 'bg-blue-100 ml-8' 
                : 'bg-gray-100 mr-8'
            }`}
          >
            <p className="text-sm text-gray-600 mb-1">
              {message.type === 'user' ? 'You' : 'Assistant'}:
            </p>
            <p>{message.content}</p>
          </div>
        ))} */}
        <div className=" gap-2 flex flex-col">
          {selectedFile &&
            chatHistory[selectedFile]?.map((message, index) => {
              const variant = message.type === "user" ? "sent" : "received";
              return (
                <div
                  key={index}
                  className={`py-6 px-2 rounded-lg  border-0 ${
                    variant === "sent" ? "bg-[#1D1C1B] " : "bg-[#373735] "
                  }`}
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
                    <div className="flex-1">
                      {/* <TextGenerateEffect duration={2} filter={false} words={message.content}  /> */}

                      {message.content}
                      {/* {} */}
                      {/* {message.type === "assistant" && (
                  <div className="flex gap-2 mt-2">
                    {actionIcons.map(({ icon: Icon, type }) => (
                      <button
                        key={type}
                        onClick={() => console.log(`Action ${type} clicked for message ${index}`)}
                        className="p-1 hover:bg-muted rounded-md transition-colors"
                      >
                        <Icon className="size-3" />
                      </button>
                    ))}
                  </div>
                )} */}
                    </div>
                  </div>
                </div>
              );
            })}
          {loading && (
            <div className={`py-6 px-2 rounded-lg  bg-[#373735] border-0`}>
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

      {/* <form onSubmit={handleChat} className="space-y-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question about your CV"
          className="w-full p-2 border border-gray-300 rounded"
        />
        <Input 
            placeholder="Ask a question about your CV"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full p-2 border   rounded bg-[#3D3D3A] text-white focus-visible:outline-none focus-visible:ring-0 "
            type="text"
        />

        <button
          type="submit"
          disabled={loading || !query || !selectedFile}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </form> */}
      <form
        className="relative rounded-lg border bg-[#3D3D3A] border-[#3F3F3B] focus-visible:ring-0 focus-visible:outline-none p-1 mt-auto"
        onSubmit={handleChat}
      >
        <ChatInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type your message here..."
          className="min-h-12 resize-none rounded-lg bg-[#3D3D3A] border-0 p-3 shadow-none focus-visible:outline-none"
        />
        <div className="flex items-center p-3 pt-0">
          {/* <Button variant="ghost" size="icon" type="button">
            <Paperclip className="size-4" />
            <span className="sr-only">Attach file</span>
          </Button>

          <Button variant="ghost" size="icon" type="button">
            <Mic className="size-4" />
            <span className="sr-only">Use Microphone</span>
          </Button> */}

          <Button
            disabled={loading}
            type="submit"
            size="sm"
            className="ml-auto gap-1.5 bg-[#D97757] text-white hover:bg-[#D97757] hover:text-white"
          >
            Send Message
            <CornerDownLeft className="size-3.5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
