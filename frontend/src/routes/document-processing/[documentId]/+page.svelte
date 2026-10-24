<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { ArrowLeft, Download } from '@lucide/svelte';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import ExtractedData from '$lib/components/document-parsers/extracted-data.svelte';
  import { getParser } from '$lib/document-parsers/store.js';
  import type { DocumentParser } from '$lib/document-parsers/types.js';
  import { loadFile } from '$lib/documents/file-store.js';
  import { SAMPLE_INVOICE_DATA } from '$lib/documents/sample-extraction.js';
  import { getDocument, saveDocument, type ProcessedDocument } from '$lib/documents/store.js';

  // undefined = loading, null = not found
  let document = $state<ProcessedDocument | null | undefined>(undefined);
  let fileUrl = $state<string | null>(null);
  let parser = $state<DocumentParser | null>(null);

  onMount(() => {
    const found = getDocument(page.params.documentId ?? '') ?? null;
    document = found;
    parser = found ? (getParser(found.parserId) ?? null) : null;

    let url: string | null = null;
    let cancelled = false;
    if (found) {
      loadFile(found.id).then((blob) => {
        if (!blob || cancelled) return;
        url = URL.createObjectURL(blob);
        fileUrl = url;
      });
    }

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  });

  let isPdf = $derived(document?.mimeType === 'application/pdf');
  let isImage = $derived(document?.mimeType.startsWith('image/') ?? false);

  function loadSampleData() {
    if (!document) return;
    const updated: ProcessedDocument = { ...document, status: 'parsed', data: SAMPLE_INVOICE_DATA };
    saveDocument(updated);
    document = updated;
  }
</script>

<div class="space-y-6">
  <div class="flex items-center gap-3">
    <Button variant="ghost" size="icon" aria-label="Back" href="/document-processing">
      <ArrowLeft />
    </Button>
    {#if document}
      <h2 class="truncate text-xl font-semibold">{document.fileName}</h2>
      <Badge variant={document.status === 'parsed' ? 'default' : 'secondary'}>
        {document.status === 'parsed' ? 'Parsed' : 'Awaiting extraction'}
      </Badge>
    {/if}
  </div>

  {#if document === undefined}
    <p class="text-sm text-muted-foreground">Loading...</p>
  {:else if document === null}
    <p class="text-sm text-destructive">Document not found.</p>
  {:else}
    <div class="grid gap-6 lg:grid-cols-2">
      <Card.Root>
        <Card.Header>
          <Card.Title>Document</Card.Title>
        </Card.Header>
        <Card.Content>
          {#if !fileUrl}
            <p class="text-sm text-muted-foreground">Loading file...</p>
          {:else if isPdf}
            <iframe title={document.fileName} src={fileUrl} class="h-[70vh] w-full rounded-md border"></iframe>
          {:else if isImage}
            <img src={fileUrl} alt={document.fileName} class="max-h-[70vh] w-full rounded-md object-contain" />
          {:else}
            <p class="text-sm text-muted-foreground">Preview is not available for this file type.</p>
          {/if}
        </Card.Content>
        <Card.Footer>
          {#if fileUrl}
            <Button variant="outline" size="sm" href={fileUrl} download={document.fileName}>
              <Download />
              Download
            </Button>
          {/if}
        </Card.Footer>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <Card.Title>Parsed data</Card.Title>
          <Card.Description>
            {document.parserName} · {(document.size / 1024).toFixed(1)} KB
          </Card.Description>
        </Card.Header>
        <Card.Content>
          {#if document.data}
            <div class="max-h-[70vh] overflow-auto">
              <ExtractedData data={document.data} fields={parser?.fields ?? []} />
            </div>
          {:else}
            <div class="space-y-3">
              <p class="text-sm text-muted-foreground">
                Not extracted yet. Extraction runs with the AI backend, which is not connected yet.
              </p>
              <Button variant="outline" size="sm" onclick={loadSampleData}>Load sample data</Button>
            </div>
          {/if}
        </Card.Content>
      </Card.Root>
    </div>
  {/if}
</div>
