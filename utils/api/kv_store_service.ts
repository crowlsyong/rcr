// utils/api/kv_store_service.ts

import db from "../../database/db.ts";

export async function getLastScoreUpdateTime(
  userId: string,
): Promise<number | null> {
  const lastUpdateKey = ["last_score_update", userId];
  const lastUpdateEntry = await db.get<number>(lastUpdateKey);
  return lastUpdateEntry.value;
}

export async function saveHistoricalScore(
  userId: string,
  username: string,
  creditScore: number,
  timestamp: number,
): Promise<void> {
  const historicalDataKey = ["credit_scores", userId, timestamp];
  const historicalDataValue = {
    userId,
    username,
    creditScore,
    timestamp,
  };
  await db.set(historicalDataKey, historicalDataValue);
}

export async function updateLastScoreUpdateTime(
  userId: string,
  timestamp: number,
): Promise<void> {
  const lastUpdateKey = ["last_score_update", userId];
  const atomic = db.atomic();
  atomic.set(lastUpdateKey, timestamp);
  await atomic.commit();
}
