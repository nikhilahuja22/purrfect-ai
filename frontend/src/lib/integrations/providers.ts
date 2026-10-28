// Providers a company can connect with its own API key (BYOK).
export type SupportedProvider = 'deepseek'; //| 'openai' | 'anthropic' | 'google';

export const SUPPORTED_PROVIDERS: Record<SupportedProvider, { label: string; models: string[] }> = {
  deepseek: {
    label: 'DeepSeek',
    models: ['deepseek-chat', 'deepseek-reasoner']
  },
  // openai: {
  //   label: 'OpenAI',
  //   models: ['gpt-4o', 'gpt-4o-mini']
  // },
  // anthropic: {
  //   label: 'Anthropic',
  //   models: ['claude-sonnet-4-5', 'claude-haiku-4-5']
  // },
  // google: {
  //   label: 'Google',
  //   models: ['gemini-2.5-pro', 'gemini-2.5-flash']
  // }
};

export function isSupportedProvider(value: string): value is SupportedProvider {
  return Object.hasOwn(SUPPORTED_PROVIDERS, value);
}
