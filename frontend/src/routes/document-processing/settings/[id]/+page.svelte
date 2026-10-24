<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { ArrowLeft } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import ParserBuilder from '$lib/components/document-parsers/parser-builder.svelte';
  import { getParser } from '$lib/document-parsers/store.js';
  import type { DocumentParser } from '$lib/document-parsers/types.js';

  // undefined = loading, null = not found
  let parser = $state<DocumentParser | null | undefined>(undefined);

  onMount(() => {
    parser = getParser(page.params.id ?? '') ?? null;
  });
</script>

<div class="space-y-6">
  <div class="flex items-center gap-3">
    <Button variant="ghost" size="icon" aria-label="Back" href="/document-processing/settings">
      <ArrowLeft />
    </Button>
    <h1 class="text-2xl font-semibold">Edit parser</h1>
  </div>

  {#if parser === undefined}
    <p class="text-sm text-muted-foreground">Loading...</p>
  {:else if parser === null}
    <p class="text-sm text-destructive">Parser not found.</p>
  {:else}
    <ParserBuilder {parser} />
  {/if}
</div>
