import { ChatContent } from "@/components/app/chat-content";

// Next.js 15+ expects dynamic params to be a Promise.
export default async function ChatSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return <ChatContent chatId={resolvedParams.id} />;
}
