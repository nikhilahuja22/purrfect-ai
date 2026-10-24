<script lang="ts">
  import { untrack } from 'svelte';
  import { goto } from '$app/navigation';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { Plus, Save } from '@lucide/svelte';
  import { saveParser } from '$lib/document-parsers/store.js';
  import {
    createField,
    toExtractionSchema,
    validateParser,
    type DocumentParser
  } from '$lib/document-parsers/types.js';
  import FieldEditor from './field-editor.svelte';

  let { parser }: { parser: DocumentParser } = $props();

  // Copy once: the builder edits a draft and only writes it on save.
  // $state.snapshot gives a plain object, since structuredClone fails on reactive proxies.
  let draft = $state<DocumentParser>(untrack(() => $state.snapshot(parser)));
  let errors = $derived(validateParser(draft));
  let schemaPreview = $derived(JSON.stringify(toExtractionSchema(draft), null, 2));

  function save() {
    if (errors.length > 0) return;
    saveParser($state.snapshot(draft));
    goto('/document-processing/settings');
  }
</script>

<div class="grid gap-6 lg:grid-cols-[1fr_360px]">
  <div class="space-y-6">
    <Card.Root>
      <Card.Header>
        <Card.Title>Document type</Card.Title>
        <Card.Description>The kind of document this parser handles.</Card.Description>
      </Card.Header>
      <Card.Content class="space-y-4">
        <div class="space-y-2">
          <Label for="parser-name">Name</Label>
          <Input id="parser-name" placeholder="e.g. Bank statement" bind:value={draft.name} />
        </div>
        <div class="space-y-2">
          <Label for="parser-description">Description</Label>
          <Textarea
            id="parser-description"
            placeholder="Helps the AI recognise this document"
            bind:value={draft.description}
          />
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header>
        <Card.Title>Fields</Card.Title>
        <Card.Description>
          Values to extract. Use a List for repeating rows such as line items.
        </Card.Description>
      </Card.Header>
      <Card.Content class="space-y-3">
        {#each draft.fields as field, index (field.id)}
          <FieldEditor
            bind:field={draft.fields[index]}
            onremove={() => draft.fields.splice(index, 1)}
          />
        {:else}
          <p class="text-sm text-muted-foreground">No fields yet.</p>
        {/each}
        <Button variant="outline" onclick={() => draft.fields.push(createField())}>
          <Plus />
          Add field
        </Button>
      </Card.Content>
    </Card.Root>
  </div>

  <div class="space-y-6">
    <Card.Root>
      <Card.Header>
        <Card.Title>Checks</Card.Title>
      </Card.Header>
      <Card.Content>
        {#if errors.length > 0}
          <ul class="list-disc space-y-1 pl-5 text-sm text-destructive">
            {#each errors as error (error)}
              <li>{error}</li>
            {/each}
          </ul>
        {:else}
          <p class="text-sm text-muted-foreground">Ready to save.</p>
        {/if}
      </Card.Content>
      <Card.Footer>
        <Button class="w-full" disabled={errors.length > 0} onclick={save}>
          <Save />
          Save parser
        </Button>
      </Card.Footer>
    </Card.Root>

    <Card.Root>
      <Card.Header>
        <Card.Title>Extraction schema</Card.Title>
        <Card.Description>The structure the AI will be asked to return.</Card.Description>
      </Card.Header>
      <Card.Content>
        <pre class="max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs">{schemaPreview}</pre>
      </Card.Content>
    </Card.Root>
  </div>
</div>
