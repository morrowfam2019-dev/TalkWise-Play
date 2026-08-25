"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { getExpertQuest } from "@/content/speech/expert";
import { QuestShell } from "@/games/adventures/expert/QuestShell";

/**
 * Expert is DOM, not WebGL, so unlike the two 3D tiers it renders on the
 * client without a dynamic import — there is no canvas or AudioContext to
 * keep away from the server.
 */
export function QuestRunner({ questId }: { questId: string }) {
  const router = useRouter();
  const quest = getExpertQuest(questId);

  const handleExit = useCallback(() => {
    router.push("/games/adventures/expert");
  }, [router]);

  if (!quest) return null;

  return <QuestShell quest={quest} onExit={handleExit} />;
}
