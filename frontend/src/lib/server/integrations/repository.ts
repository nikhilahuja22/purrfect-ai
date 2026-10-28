import { and, eq } from 'drizzle-orm';
import type { SupportedProvider } from '$lib/integrations/providers.js';
import { encryptSecret } from '$lib/server/crypto/secret-box.js';
import { getDb } from '$lib/server/db/index.js';
import { companyIntegrations } from '$lib/server/db/schema.js';

export type IntegrationSummary = {
  provider: SupportedProvider;
  keyLast4: string;
  defaultModel: string | null;
  updatedAt: string;
};

// Selects only display columns, so ciphertext is never loaded for the list.
export async function listIntegrations(companyId: string): Promise<IntegrationSummary[]> {
  const rows = await getDb()
    .select({
      provider: companyIntegrations.provider,
      keyLast4: companyIntegrations.keyLast4,
      defaultModel: companyIntegrations.defaultModel,
      updatedAt: companyIntegrations.updatedAt
    })
    .from(companyIntegrations)
    .where(eq(companyIntegrations.companyId, companyId));

  return rows.map((row) => ({
    provider: row.provider as SupportedProvider,
    keyLast4: row.keyLast4,
    defaultModel: row.defaultModel,
    updatedAt: row.updatedAt.toISOString()
  }));
}

// Inserts the key, or replaces the existing key for this company and provider.
export async function saveIntegration(
  companyId: string,
  provider: SupportedProvider,
  apiKey: string,
  defaultModel: string
): Promise<void> {
  const sealed = encryptSecret(apiKey);
  const values = {
    companyId,
    provider,
    encryptedApiKey: sealed.ciphertext,
    iv: sealed.iv,
    authTag: sealed.authTag,
    keyLast4: apiKey.slice(-4),
    defaultModel
  };

  await getDb()
    .insert(companyIntegrations)
    .values(values)
    .onConflictDoUpdate({
      target: [companyIntegrations.companyId, companyIntegrations.provider],
      set: {
        encryptedApiKey: values.encryptedApiKey,
        iv: values.iv,
        authTag: values.authTag,
        keyLast4: values.keyLast4,
        defaultModel: values.defaultModel,
        updatedAt: new Date()
      }
    });
}

export async function deleteIntegration(
  companyId: string,
  provider: SupportedProvider
): Promise<void> {
  await getDb()
    .delete(companyIntegrations)
    .where(
      and(eq(companyIntegrations.companyId, companyId), eq(companyIntegrations.provider, provider))
    );
}
