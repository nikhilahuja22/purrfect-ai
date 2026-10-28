<script lang="ts">
  import { enhance } from '$app/forms';
  import { Pencil, Plus, Trash } from '@lucide/svelte';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { countFields } from '$lib/document-parsers/types.js';

  let { data } = $props();

  function confirmDelete({ cancel }: { cancel: () => void }) {
    if (!confirm('Delete this parser?')) cancel();
  }
</script>

<div class="space-y-6">
  <div class="flex justify-end">
    <Button href="/document-processing/settings/new">
      <Plus />
      New parser
    </Button>
  </div>

  {#if data.parsers.length === 0}
    <Card.Root>
      <Card.Content class="py-10 text-center text-sm text-muted-foreground">
        No parsers yet. Create one to get started.
      </Card.Content>
    </Card.Root>
  {/if}

  <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {#each data.parsers as parser (parser.id)}
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
          <Button variant="outline" size="sm" href={`/document-processing/settings/${parser.id}`}>
            <Pencil />
            Edit
          </Button>
          <form method="POST" action="?/delete" use:enhance={confirmDelete}>
            <input type="hidden" name="id" value={parser.id} />
            <Button type="submit" variant="ghost" size="icon-sm" aria-label="Delete parser">
              <Trash />
            </Button>
          </form>
        </Card.Footer>
      </Card.Root>
    {/each}
  </div>
</div>
