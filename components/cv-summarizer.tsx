"use client";

import { useState, useEffect } from "react";
import { FileText, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FileInfo {
  name: string;
  path: string;
}

interface FileSelectorProps {
  uploadedFiles: FileInfo[];
  onFileSelect: (fileName: string) => void;
  onUploadClick: () => void;
  selectedFile: string;
  uploadFiles: () => void;
}

function FileSelector({
  uploadedFiles,
  onFileSelect,
  onUploadClick,
  selectedFile,
  uploadFiles,
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
        onClick={uploadFiles}
        className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-dashed border-[#373735] px-4 py-3 text-center shadow-sm outline-offset-2 transition-colors hover:border-[#D97757] hover:bg-[#2A2A28]"
      >
        <Plus className="text-[#D97757]" size={24} aria-hidden="true" />
        <p className="text-sm font-medium leading-none text-white">
          Upload Files
        </p>
      </button>
    </RadioGroup>
  );
}

export default function CVSummarizer() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState("");
  const [summarizeSection, setSummarizeSection] = useState("full");
  const [summary, setSummary] = useState("");
  const [summarizing, setSummarizing] = useState(false);

  useEffect(() => {
    const storedFiles = localStorage.getItem("uploadedFiles");
    if (storedFiles) {
      setUploadedFiles(JSON.parse(storedFiles));
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(e.target.files);
    }
  };

  const handleUploadClick = () => {
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
      const response = await fetch("http://127.0.0.1:8000/summarize/", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const newFiles = data.files as FileInfo[];
        const updatedFiles = [...uploadedFiles, ...newFiles];
        setUploadedFiles(updatedFiles);
        localStorage.setItem("uploadedFiles", JSON.stringify(updatedFiles));
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

  const handleSummarize = async () => {
    if (!selectedFile) return;

    setSummarizing(true);
    try {
      const formData = new FormData();
      formData.append("file_name", selectedFile);
      formData.append("section", summarizeSection);
      formData.append("summarize_request", "true");

      const res = await fetch("http://127.0.0.1:8000/summarize/", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to get summary");
      }
    } catch (error) {
      console.error("Error summarizing:", error);
      alert(
        error instanceof Error ? error.message : "Failed to get a summary"
      );
    } finally {
      setSummarizing(false);
    }
  };

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
    );
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
          uploadFiles={handleUpload}        />
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
    </div>
  );
}

