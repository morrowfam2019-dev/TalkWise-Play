import { notFound } from "next/navigation";
import { getExpertQuest, listExpertQuests } from "@/content/speech/expert";
import { QuestRunner } from "./QuestRunner";

export function generateStaticParams() {
  return listExpertQuests().map((quest) => ({ questId: quest.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ questId: string }>;
}) {
  const { questId } = await params;
  const quest = getExpertQuest(questId);
  if (!quest) return { title: "TalkWise Play" };
  return { title: `${quest.title} · TalkWise Play`, description: quest.tagline };
}

export default async function ExpertQuestPage({
  params,
}: {
  params: Promise<{ questId: string }>;
}) {
  const { questId } = await params;
  const quest = getExpertQuest(questId);
  if (!quest) notFound();

  return <QuestRunner questId={quest.id} />;
}
