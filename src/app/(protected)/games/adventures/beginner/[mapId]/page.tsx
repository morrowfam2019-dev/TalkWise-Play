import { notFound } from "next/navigation";
import { getExplorerMap, listExplorerMaps } from "@/games/adventures/explorer/maps";
import { ExplorerRunner } from "./ExplorerRunner";

export function generateStaticParams() {
  return listExplorerMaps().map((map) => ({ mapId: map.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ mapId: string }>;
}) {
  const { mapId } = await params;
  const map = getExplorerMap(mapId);
  if (!map) return { title: "TalkWise Play" };
  return { title: `${map.title} · TalkWise Play`, description: map.blurb };
}

export default async function BeginnerMapPage({
  params,
}: {
  params: Promise<{ mapId: string }>;
}) {
  const { mapId } = await params;
  const map = getExplorerMap(mapId);
  if (!map) notFound();

  return <ExplorerRunner mapId={map.id} />;
}
