import type { AppEntry } from './types.js';
import type { AppScanResult } from './scan.js';

export interface ChecklistItem {
  appId: string;
  appName: string;
  found: boolean;
  storePaths: string[];
  typicallyHolds: string[];
  revokeUrl: string;
  revokeNote: string;
  rotateAlso: string[];
}

/** One checklist item per app in the table -- found apps get full detail,
 *  missing apps get a pointer to their revocation page only. */
export function buildChecklist(apps: AppEntry[], results: AppScanResult[]): ChecklistItem[] {
  const byId = new Map(results.map((r) => [r.appId, r]));
  return apps.map((app) => {
    const result = byId.get(app.id);
    return {
      appId: app.id,
      appName: app.name,
      found: result !== undefined && result.found,
      storePaths: result !== undefined ? result.storePaths : [],
      typicallyHolds: app.holds,
      revokeUrl: app.revokeUrl,
      revokeNote: app.revokeNote,
      rotateAlso: app.rotate,
    };
  });
}
