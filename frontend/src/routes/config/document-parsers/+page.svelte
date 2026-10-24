<script lang="ts">
  import { onMount } from 'svelte';
  import { Pencil, Plus, Trash } from '@lucide/svelte';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { deleteParser, loadParsers } from '$lib/document-parsers/store.js';
  import {
    countFields,
    type DocumentParser
  } from '$lib/document-parsers/types.js';

  let parsers = $state<DocumentParser[]>([]);
  let loaded = $state(false);

  onMount(() => {
    parsers = loadParsers();
    loaded = true;
  });

  function remove(id: string) {
    if (!confirm('Delete this parser?')) return;
    deleteParser(id);
    parsers = loadParsers();
  }
</script>

<div class="space-y-6">
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h1 class="text-2xl font-semibold">Document Parsers</h1>
      <p class="text-sm text-muted-foreground">
        Define the document types you want to parse and the fields to extract from them.
      </p>
    </div>
    <Button href="/config/document-parsers/new">
      <Plus />
      New parser
    </Button>
  </div>

  {#if loaded && parsers.length === 0}
    <Card.Root>
      <Card.Content class="py-10 text-center text-sm text-muted-foreground">
        No parsers yet. Create one to get started.
      </Card.Content>
    </Card.Root>
  {/if}

  <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {#each parsers as parser (parser.id)}
      <Card.Root>
        <Card.Header>
          <Card.Title>{parser.name}</Card.Title>
          <Card.Description>{parser.description || 'No description'}</Card.Description>
        </Card.Header>
        <Card.Content class="flex items-center gap-2">
          <Badge variant="secondary">{countFields(parser.fields)} fields</Badge>
          <span class="text-xs text-muted-foreground">
            Updated {new Date(parser.updatedAt).toLocaleDateString()}
          </span>
        </Card.Content>
        <Card.Footer class="justify-between gap-2">
          <Button variant="outline" size="sm" href={`/config/document-parsers/${parser.id}`}>
            <Pencil />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Delete parser"
            onclick={() => remove(parser.id)}
          >
            <Trash />
          </Button>
        </Card.Footer>
      </Card.Root>
    {/each}
  </div>
</div>
