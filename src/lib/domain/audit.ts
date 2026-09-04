import type { LocalizedText } from "./contracts";

/** سجل تدقيق عام — تُظهر فيه أي تسوية يدوية بوضوح (isManualAdjustment). */
export type AuditLogEntry = {
  id: string;
  timestamp: string;
  actor: LocalizedText;
  action: LocalizedText;
  note?: LocalizedText;
  isManualAdjustment?: boolean;
};
