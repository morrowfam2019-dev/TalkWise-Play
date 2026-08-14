import { notFound } from "next/navigation";
import { getLevel, listLevels } from "@/content/speech";
import { LevelRunner } from "./LevelRunner";

export function generateStaticParams() {
  return listLevels().map((level) => ({ levelId: level.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ levelId: string }>;
}) {
  const { levelId } = await params;
  const level = getLevel(levelId);
  if (!level) return { title: "TalkWise Play" };
  return {
    title: `${level.title} · TalkWise Play`,
    description: level.tagline,
  };
}

export default async function PlayPage({
  params,
}: {
  params: Promise<{ levelId: string }>;
}) {
  const { levelId } = await params;
  const level = getLevel(levelId);
  if (!level) notFound();

  return <LevelRunner levelId={level.id} />;
}
