'use client'

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MessageSquare, BarChart, FileText } from 'lucide-react'
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen  text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12">CV Analysis Tools</h1>
        
        <div className="grid md:grid-cols-3 gap-6">
          <Link href="/chat">
            <Card className="bg-[#2a2a2a] border-[#333] hover:bg-[#333] transition-colors cursor-pointer h-full">
              <CardHeader className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-[#e97451]" />
                <CardTitle className="text-xl mb-2 text-white">Chat with CVs</CardTitle>
                <CardDescription className="text-gray-400">
                  Have an interactive conversation about any CV
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/ranking">
            <Card className="bg-[#2a2a2a] border-[#333] hover:bg-[#333] transition-colors cursor-pointer h-full">
              <CardHeader className="text-center">
                <BarChart className="w-12 h-12 mx-auto mb-4 text-[#e97451]" />
                <CardTitle className="text-xl mb-2 text-white">Rank CVs</CardTitle>
                <CardDescription className="text-gray-400">
                  Compare and rank multiple CVs
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/summarize">
            <Card className="bg-[#2a2a2a] border-[#333] hover:bg-[#333] transition-colors cursor-pointer h-full">
              <CardHeader className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-[#e97451]" />
                <CardTitle className="text-xl mb-2 text-white">Summarize CV</CardTitle>
                <CardDescription className="text-gray-400">
                  Get quick summaries of CV content
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}

