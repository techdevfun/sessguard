import type { AppEntry } from './types.js';

/**
 * Curated table of well-known AI-assistant session / credential store
 * locations, one entry per app. Paths are segments under the user's home
 * directory; a `platform` narrows an entry to one OS.
 *
 * This table is public knowledge (documented by the vendors and by threat
 * research). sessguard ships no values, only these locations -- and it
 * never prints, logs, or exports token VALUES found there.
 */
export const APPS: AppEntry[] = [
  {
    id: 'claude',
    name: 'Claude Code / Claude CLI',
    paths: [
      { segments: ['.claude.json'], note: 'Claude Code session and auth state' },
      { segments: ['.claude'], note: 'Claude Code projects and sessions' },
      { segments: ['.config', 'claude'], note: 'Claude CLI config directory' },
    ],
    revokeUrl: 'https://console.anthropic.com/settings/keys',
    revokeNote:
      'Revoke API keys at the console. For OAuth sessions, sign out inside the app as well.',
    holds: ['API keys', 'OAuth session tokens', 'project session transcripts'],
    rotate: ['Any API keys you used with Claude Code'],
    lastVerified: '2026-10-30',
  },
  {
    id: 'chatgpt-desktop',
    name: 'ChatGPT Desktop',
    paths: [
      {
        segments: ['Library', 'Application Support', 'com.openai.chat'],
        platform: 'darwin',
        note: 'ChatGPT macOS app data',
      },
      {
        segments: ['.config', 'ChatGPT'],
        platform: 'linux',
        note: 'ChatGPT Linux app data',
      },
      {
        segments: ['AppData', 'Roaming', 'ChatGPT'],
        platform: 'win32',
        note: 'ChatGPT Windows app data',
      },
    ],
    revokeUrl: 'https://chatgpt.com',
    revokeNote:
      'Open ChatGPT, go to Settings, Security, and log out of all sessions. Change your password afterwards.',
    holds: ['OAuth session tokens', 'cached conversation data'],
    rotate: ['OpenAI API keys if you also use the API'],
    lastVerified: '2026-10-30',
  },
  {
    id: 'codex',
    name: 'Codex CLI',
    paths: [
      { segments: ['.codex', 'auth.json'], note: 'Codex CLI auth state' },
      { segments: ['.codex'], note: 'Codex CLI sessions and config' },
    ],
    revokeUrl: 'https://platform.openai.com/account/api-keys',
    revokeNote:
      'Revoke API keys here. If you signed in with ChatGPT, also log out all sessions at chatgpt.com.',
    holds: ['API keys', 'OAuth tokens', 'session state'],
    rotate: ['OpenAI API keys used with Codex'],
    lastVerified: '2026-10-30',
  },
  {
    id: 'cursor',
    name: 'Cursor',
    paths: [
      { segments: ['.cursor'], note: 'Cursor config and MCP state' },
      {
        segments: ['Library', 'Application Support', 'Cursor'],
        platform: 'darwin',
        note: 'Cursor macOS app data',
      },
      {
        segments: ['.config', 'Cursor'],
        platform: 'linux',
        note: 'Cursor Linux app data',
      },
      {
        segments: ['AppData', 'Roaming', 'Cursor'],
        platform: 'win32',
        note: 'Cursor Windows app data',
      },
    ],
    revokeUrl: 'https://cursor.com/settings',
    revokeNote: 'Cursor dashboard, Settings: revoke API keys and end sessions.',
    holds: ['API keys', 'account session tokens'],
    rotate: ['Cursor API keys'],
    lastVerified: '2026-10-30',
  },
  {
    id: 'windsurf',
    name: 'Windsurf',
    paths: [
      { segments: ['.windsurf'], note: 'Windsurf config' },
      { segments: ['.codeium', 'windsurf'], note: 'Windsurf (Codeium) state' },
      {
        segments: ['Library', 'Application Support', 'Windsurf'],
        platform: 'darwin',
        note: 'Windsurf macOS app data',
      },
      {
        segments: ['.config', 'Windsurf'],
        platform: 'linux',
        note: 'Windsurf Linux app data',
      },
    ],
    revokeUrl: 'https://windsurf.com',
    revokeNote: 'Windsurf account settings: API keys and active sessions.',
    holds: ['API keys', 'account session tokens'],
    rotate: ['Windsurf / Codeium API keys'],
    lastVerified: '2026-10-30',
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot (IDE + CLI)',
    paths: [
      { segments: ['.config', 'github-copilot'], note: 'Copilot CLI and IDE auth state' },
      { segments: ['.copilot'], note: 'Copilot CLI state' },
    ],
    revokeUrl: 'https://github.com/settings/copilot',
    revokeNote:
      'GitHub, Settings, Copilot: revoke the authorization. Also review github.com/settings/tokens.',
    holds: ['OAuth device-flow tokens', 'IDE session state'],
    rotate: ['GitHub personal access tokens used with Copilot'],
    lastVerified: '2026-10-30',
  },
  {
    id: 'gemini-cli',
    name: 'Gemini CLI',
    paths: [
      { segments: ['.gemini'], note: 'Gemini CLI auth and sessions' },
      { segments: ['.config', 'gemini'], note: 'Gemini CLI config' },
    ],
    revokeUrl: 'https://aistudio.google.com/apikey',
    revokeNote:
      'Revoke API keys at AI Studio. For Google sign-in, also revoke at myaccount.google.com, Security.',
    holds: ['API keys', 'Google OAuth tokens'],
    rotate: ['Gemini API keys'],
    lastVerified: '2026-10-30',
  },
  {
    id: 'amazon-q',
    name: 'Amazon Q',
    paths: [
      { segments: ['.aws', 'amazonq'], note: 'Amazon Q cache and state' },
      {
        segments: ['Library', 'Application Support', 'Amazon Q'],
        platform: 'darwin',
        note: 'Amazon Q macOS app data',
      },
      {
        segments: ['.config', 'Amazon Q'],
        platform: 'linux',
        note: 'Amazon Q Linux app data',
      },
    ],
    revokeUrl: 'https://console.aws.amazon.com/iam/home#/security_credentials',
    revokeNote:
      'IAM console, Security credentials: deactivate access keys. Revoke SSO sessions in IAM Identity Center.',
    holds: ['AWS access keys', 'SSO session tokens', 'Builder ID tokens'],
    rotate: ['AWS access keys used on this machine'],
    lastVerified: '2026-10-30',
  },
  {
    id: 'kiro',
    name: 'Kiro',
    paths: [
      { segments: ['.kiro'], note: 'Kiro config and sessions' },
      {
        segments: ['Library', 'Application Support', 'Kiro'],
        platform: 'darwin',
        note: 'Kiro macOS app data',
      },
      {
        segments: ['.config', 'Kiro'],
        platform: 'linux',
        note: 'Kiro Linux app data',
      },
      {
        segments: ['AppData', 'Roaming', 'Kiro'],
        platform: 'win32',
        note: 'Kiro Windows app data',
      },
    ],
    revokeUrl: 'https://console.aws.amazon.com/iam/home',
    revokeNote:
      'Kiro signs in through AWS (IAM Identity Center / Builder ID) -- revoke the sessions there.',
    holds: ['AWS SSO tokens', 'Builder ID tokens'],
    rotate: ['AWS credentials used with Kiro'],
    lastVerified: '2026-10-30',
  },
  {
    id: 'jetbrains-ai',
    name: 'JetBrains AI Assistant',
    paths: [
      {
        segments: ['.config', 'JetBrains'],
        note: 'JetBrains IDE configs, including AI Assistant',
      },
      {
        segments: ['Library', 'Application Support', 'JetBrains'],
        platform: 'darwin',
        note: 'JetBrains macOS IDE data',
      },
      {
        segments: ['AppData', 'Roaming', 'JetBrains'],
        platform: 'win32',
        note: 'JetBrains Windows IDE data',
      },
    ],
    revokeUrl: 'https://account.jetbrains.com',
    revokeNote: 'JetBrains Account: revoke IDE activations and AI service sessions.',
    holds: ['IDE activation tokens', 'AI Assistant session tokens'],
    rotate: ['JetBrains IDE activation codes if they were shared'],
    lastVerified: '2026-10-30',
  },
];
