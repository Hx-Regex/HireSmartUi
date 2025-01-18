import CVChatInterface from "@/components/CVChatInterface";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col p-2 items-center">
      <h1 className="text-4xl font-bold">Chat with Cvs</h1>
      <CVChatInterface/>
    </main>
  );
}
