<script lang="ts">
  import { enhance } from '$app/forms';
  import { refreshAll } from '$app/navigation';
  import { ArrowLeft, Download, RefreshCw } from '@lucide/svelte';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import ExtractedData from '$lib/components/document-parsers/extracted-data.svelte';
  import {
    EXTRACTION_STATUS_LABELS,
    extractionBadgeVariant
  } from '$lib/documents/extraction-status.js';

  let { data, form } = $props();
  let detail = $derived(data.document);
  let refreshing = $state(false);

  async function refresh() {
    refreshing = true;
    try {
      await refreshAll();
    } finally {
      refreshing = false;
    }
  }

  // Presigned S3 link, created by the page load.
  let fileUrl = $derived(data.fileUrl);
  let isPdf = $derived(detail?.contentType === 'application/pdf');
  let isImage = $derived(detail?.contentType.startsWith('image/') ?? false);
</script>

<div class="space-y-6">
  <div class="flex items-center gap-3">
    <Button variant="ghost" size="icon" aria-label="Back" href="/document-processing">
      <ArrowLeft />
    </Button>
    {#if detail}
      <h2 class="min-w-0 flex-1 truncate text-xl font-semibold">{detail.fileName}</h2>
      <Button variant="outline" size="sm" onclick={refresh} disabled={refreshing}>
        <RefreshCw class={refreshing ? 'animate-spin' : ''} />
        Refresh
      </Button>
    {/if}
  </div>

  {#if !detail}
    <p class="text-sm text-destructive">Document not found.</p>
  {:else}
    <div class="grid gap-6 lg:grid-cols-2">
      <Card.Root>
        <Card.Header>
          <Card.Title>Document</Card.Title>
          <Card.Description>{(detail.sizeBytes / 1024).toFixed(1)} KB</Card.Description>
        </Card.Header>
        <Card.Content>
          {#if !fileUrl}
            <p class="text-sm text-muted-foreground">Loading file...</p>
          {:else if isPdf}
            <iframe title={detail.fileName} src={fileUrl} class="h-[70vh] w-full rounded-md border"></iframe>
          {:else if isImage}
            <img src={fileUrl} alt={detail.fileName} class="max-h-[70vh] w-full rounded-md object-contain" />
          {:else}
            <p class="text-sm text-muted-foreground">Preview is not available for this file type.</p>
          {/if}
        </Card.Content>
        <Card.Footer>
          {#if fileUrl}
            <Button variant="outline" size="sm" href={fileUrl} download={detail.fileName}>
              <Download />
              Download
            </Button>
          {/if}
        </Card.Footer>
      </Card.Root>

      <div class="space-y-6">
        {#if form?.message}
          <p class="text-sm text-destructive">{form.message}</p>
        {/if}

        {#if detail.extractions.length === 0}
          <Card.Root>
            <Card.Content class="py-10 text-center text-sm text-muted-foreground">
              No extractions yet.
            </Card.Content>
          </Card.Root>
        {/if}

        {#each detail.extractions as run, index (run.id)}
          <Card.Root>
            <Card.Header>
              <Card.Title>{run.parserName}</Card.Title>
              <Card.Description>{new Date(run.createdAt).toLocaleString()}</Card.Description>
              <Card.Action class="flex gap-2">
                {#if index === 0}
                  <Badge variant="outline">Latest</Badge>
                {/if}
                <Badge variant={extractionBadgeVariant(run.status)}>
                  {EXTRACTION_STATUS_LABELS[run.status]}
                </Badge>
              </Card.Action>
            </Card.Header>
            <Card.Content>
              {#if run.status === 'failed'}
                <p class="text-sm text-destructive">{run.error ?? 'Extraction failed.'}</p>
              {:else if run.data}
                <div class="max-h-[60vh] overflow-auto">
                  <ExtractedData data={run.data} fields={run.fields} />
                </div>
              {:else}
                <p class="text-sm text-muted-foreground">
                  Extracting. Click Refresh to check for results.
                </p>
              {/if}
            </Card.Content>
            <Card.Footer>
              <form method="POST" action="?/reprocess" use:enhance>
                <input type="hidden" name="extractionId" value={run.id} />
                <Button type="submit" variant="outline" size="sm">Reprocess</Button>
              </form>
            </Card.Footer>
          </Card.Root>
        {/each}
      </div>
    </div>
  {/if}
</div>
