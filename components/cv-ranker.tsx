"use client";

import { useState, useEffect } from "react";
import { FileText, Loader, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FileInfo {
  name: string;
  path: string;
}

interface RankedCV {
  score: number;
  name: string;
}

export default function CVRanker() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([]);
  const [jobDescription, setJobDescription] = useState("");
  const [ranking, setRanking] = useState<RankedCV[]>([]);
  const [isRanking, setIsRanking] = useState(false);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(e.target.files);
    }
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
      const response = await fetch("http://127.0.0.1:8000/rank/", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const newFiles = data.files as FileInfo[];
        const updatedFiles = [...uploadedFiles, ...newFiles];
        setUploadedFiles(updatedFiles);
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

  const handleRank = async () => {
    if (uploadedFiles.length === 0 || !jobDescription.trim()) return;

    setIsRanking(true);
    try {
      const formData = new FormData();
      formData.append("job_description", jobDescription);
      uploadedFiles.forEach(file => formData.append("selected_files", file.name));
      formData.append("rank_request", "true");

      const res = await fetch("http://127.0.0.1:8000/rank/", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setRanking(data.ranked_cvs.map(([score, name]: [number, string]) => ({ score, name })));
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to rank CVs");
      }
    } catch (error) {
      console.error("Error ranking CVs:", error);
      alert(
        error instanceof Error ? error.message : "Failed to rank CVs"
      );
    } finally {
      setIsRanking(false);
    }
  };

  const clearUploadedFiles = () => {
    setUploadedFiles([]);
    setFiles(null);
    setRanking([]);
  };

  return (
    <div className="w-full max-w-3xl h-full flex flex-col space-y-4">
      <h2 className="text-2xl font-bold text-white">CV Ranker</h2>

      <Card className="bg-[#2A2A28] border-[#373735]">
        <CardHeader>
          <CardTitle className="text-white">Upload CVs</CardTitle>
        </CardHeader>
        <CardContent>
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
            <Button
              onClick={clearUploadedFiles}
              className="w-full bg-[#373735] text-white hover:bg-[#4A4A48] mt-2"
            >
              Clear Files
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-[#2A2A28] border-[#373735]">
        <CardHeader>
          <CardTitle className="text-white">Rank CVs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {uploadedFiles.length > 0 && (
            <div className="bg-[#373735] p-4 rounded-lg max-h-[150px] overflow-y-auto">
              <h3 className="text-white font-semibold mb-2">Uploaded CVs:</h3>
              {uploadedFiles.map((file, index) => (
                <div key={index} className="text-white py-1">
                  <FileText className="inline-block mr-2 text-[#D97757]" size={16} />
                  <span>{file.name}</span>
                </div>
              ))}
            </div>
          )}

          <Textarea
            placeholder="Enter job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="bg-[#3D3D3A] text-white border-[#373735] min-h-[100px]"
          />

          <Button
            onClick={handleRank}
            disabled={uploadedFiles.length === 0 || !jobDescription.trim() || isRanking}
            className="w-full bg-[#D97757] text-white hover:bg-[#C86746]"
          >
            {isRanking ?<span className="flex gap-2 items-center"><Loader className="w-4 h-4 animate-spin" /> Ranking... </span> : "Rank CVs"}
          </Button>

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
  );
}

