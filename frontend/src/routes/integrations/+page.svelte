<script lang="ts">
  import { enhance } from '$app/forms';
  import { Trash } from '@lucide/svelte';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { SUPPORTED_PROVIDERS, type SupportedProvider } from '$lib/integrations/providers.js';

  let { data, form } = $props();

  const providerEntries = Object.entries(SUPPORTED_PROVIDERS) as [
    SupportedProvider,
    (typeof SUPPORTED_PROVIDERS)[SupportedProvider]
  ][];

  let selectedProvider = $state<SupportedProvider>('deepseek');
  const selectedInfo = $derived(SUPPORTED_PROVIDERS[selectedProvider]);
  const selectedSaved = $derived(
    data.integrations.find((integration) => integration.provider === selectedProvider)
  );

  function confirmDelete({ cancel }: { cancel: () => void }) {
    if (!confirm('Remove this API key?')) cancel();
  }
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-semibold">Integrations</h1>
    <p class="text-sm text-muted-foreground">
      Add your own AI provider keys. Keys are encrypted before they are stored and cannot be viewed
      again after saving.
    </p>
  </div>

  <Card.Root class="max-w-xl">
    <Card.Header>
      <Card.Title>Add or replace a key</Card.Title>
      <Card.Description>
        Saving a provider that is already connected replaces its key and model.
      </Card.Description>
    </Card.Header>

    <Card.Content>
      <form method="POST" action="?/save" use:enhance class="space-y-4">
        <div class="space-y-2">
          <Label for="provider">Provider</Label>
          <select
            id="provider"
            name="provider"
            bind:value={selectedProvider}
            class="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {#each providerEntries as [id, info] (id)}
              <option value={id}>{info.label}</option>
            {/each}
          </select>
        </div>

        <div class="space-y-2">
          <Label for="api-key">API key</Label>
          <Input
            id="api-key"
            name="apiKey"
            type="password"
            autocomplete="off"
            placeholder={selectedSaved ? 'Enter a new key to replace it' : 'Paste your API key'}
            required
          />
        </div>

        {#key selectedProvider}
          <div class="space-y-2">
            <Label for="default-model">Model</Label>
            <select
              id="default-model"
              name="defaultModel"
              class="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              {#each selectedInfo.models as model (model)}
                <option value={model} selected={(selectedSaved?.defaultModel ?? selectedInfo.models[0]) === model}>
                  {model}
                </option>
              {/each}
            </select>
          </div>
        {/key}

        {#if form?.message}
          <p class="text-sm text-destructive">{form.message}</p>
        {:else if form?.saved}
          <p class="text-sm text-muted-foreground">Saved.</p>
        {/if}

        <Button type="submit">{selectedSaved ? 'Update key' : 'Save key'}</Button>
      </form>
    </Card.Content>
  </Card.Root>

  <div class="max-w-xl space-y-3">
    <h2 class="text-lg font-medium">Connected providers</h2>

    {#if data.integrations.length === 0}
      <p class="text-sm text-muted-foreground">No providers connected yet.</p>
    {/if}

    {#each data.integrations as integration (integration.provider)}
      <Card.Root>
        <Card.Content class="flex items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="font-medium">{SUPPORTED_PROVIDERS[integration.provider].label}</span>
              <Badge variant="secondary">{integration.defaultModel ?? 'No model'}</Badge>
            </div>
            <p class="text-xs text-muted-foreground">
              Key ending in {integration.keyLast4}, updated {new Date(integration.updatedAt).toLocaleDateString()}
            </p>
          </div>
          <form method="POST" action="?/delete" use:enhance={confirmDelete}>
            <input type="hidden" name="provider" value={integration.provider} />
            <Button type="submit" variant="ghost" size="icon-sm" aria-label="Remove key">
              <Trash />
            </Button>
          </form>
        </Card.Content>
      </Card.Root>
    {/each}
  </div>
</div>
