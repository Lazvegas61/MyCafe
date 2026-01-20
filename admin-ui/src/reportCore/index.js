// reportCore/index.js
import { collectRawData } from "./collect";
import { computeLiveDay } from "./computeLiveDay";

export function computeDashboardLive(gun) {
  const raw = collectRawData();
  return computeLiveDay(raw, gun);
}
