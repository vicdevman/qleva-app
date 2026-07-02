import { ChatContent } from "@/components/app/chat-content";

// Next.js 15+ expects dynamic params to be a Promise.
export default async function ChatSessionPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  console.log("[DEBUG ChatSessionPage] started, params type:", typeof params, "params:", params);
  const resolvedParams = await params;
  console.log("[DEBUG ChatSessionPage] resolvedParams:", resolvedParams);
  return <ChatContent chatId={resolvedParams.id} />;
}
