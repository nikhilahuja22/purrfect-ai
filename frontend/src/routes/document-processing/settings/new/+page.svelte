<script lang="ts">
  import { ArrowLeft } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import ParserBuilder from '$lib/components/document-parsers/parser-builder.svelte';
  import { createParser } from '$lib/document-parsers/types.js';

  const parser = createParser();
</script>

<div class="space-y-6">
  <div class="flex items-center gap-3">
    <Button variant="ghost" size="icon" aria-label="Back" href="/document-processing/settings">
      <ArrowLeft />
    </Button>
    <h1 class="text-2xl font-semibold">New parser</h1>
  </div>

  <ParserBuilder {parser} />
</div>
