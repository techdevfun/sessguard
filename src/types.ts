/** Shared types for the sessguard app knowledge table. */

export type Platform = 'darwin' | 'linux' | 'win32';

/** One well-known store location, expressed as path segments under the home directory. */
export interface StorePath {
  segments: string[];
  /** If set, this path only applies on that OS. Unset = all platforms. */
  platform?: Platform;
  note: string;
}

export interface AppEntry {
  id: string;
  name: string;
  paths: StorePath[];
  /** Provider page where sessions / tokens for this app are revoked. */
  revokeUrl: string;
  revokeNote: string;
  /** What authentication material this app typically holds on disk. */
  holds: string[];
  /** What else to rotate alongside the app's own sessions. */
  rotate: string[];
  /** YYYY-MM-DD -- when this entry's paths were last curated/verified. */
  lastVerified: string;
}
