import { fail } from '@sveltejs/kit';
import { isSupportedProvider, SUPPORTED_PROVIDERS } from '$lib/integrations/providers.js';
import { requireUser } from '$lib/server/auth/require-user.js';
import {
  deleteIntegration,
  listIntegrations,
  saveIntegration
} from '$lib/server/integrations/repository.js';
import type { Actions, PageServerLoad } from './$types';

const MIN_KEY_LENGTH = 8;

export const load: PageServerLoad = async ({ locals }) => {
  const user = requireUser(locals);
  return { integrations: await listIntegrations(user.companyId) };
};

export const actions: Actions = {
  save: async ({ request, locals }) => {
    const user = requireUser(locals);
    const formData = await request.formData();
    const provider = String(formData.get('provider') ?? '');
    const apiKey = String(formData.get('apiKey') ?? '').trim();
    const defaultModel = String(formData.get('defaultModel') ?? '');

    if (!isSupportedProvider(provider)) {
      return fail(400, { message: 'Unknown provider.', provider });
    }
    if (!SUPPORTED_PROVIDERS[provider].models.includes(defaultModel)) {
      return fail(400, { message: 'Choose a model from the list.', provider });
    }
    if (apiKey.length < MIN_KEY_LENGTH) {
      return fail(400, { message: 'Enter a valid API key.', provider });
    }

    await saveIntegration(user.companyId, provider, apiKey, defaultModel);
    return { provider, saved: true };
  },

  delete: async ({ request, locals }) => {
    const user = requireUser(locals);
    const formData = await request.formData();
    const provider = String(formData.get('provider') ?? '');

    if (!isSupportedProvider(provider)) {
      return fail(400, { message: 'Unknown provider.', provider });
    }

    await deleteIntegration(user.companyId, provider);
  }
};
