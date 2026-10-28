<script lang="ts">
  import { enhance } from '$app/forms';
  import { refreshAll } from '$app/navigation';
  import { Trash } from '@lucide/svelte';
  import UploadDocumentsDialog from '$lib/components/document-processing/upload-documents-dialog.svelte';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import {
    EXTRACTION_STATUS_LABELS,
    extractionBadgeVariant
  } from '$lib/documents/extraction-status.js';

  let { data } = $props();
</script>

<div class="space-y-6">
  <div class="flex flex-wrap items-center justify-between gap-4">
    <p class="text-sm text-muted-foreground">Uploaded documents and their extracted data.</p>
    <UploadDocumentsDialog parsers={data.parsers} onComplete={() => refreshAll()} />
  </div>

  {#if data.documents.length === 0}
    <Card.Root>
      <Card.Content class="py-10 text-center text-sm text-muted-foreground">
        No documents yet. Upload one to get started.
      </Card.Content>
    </Card.Root>
  {:else}
    <Card.Root>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>File name</Table.Head>
            <Table.Head>Parser</Table.Head>
            <Table.Head>Status</Table.Head>
            <Table.Head>Uploaded</Table.Head>
            <Table.Head class="text-right">Actions</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each data.documents as item (item.id)}
            <Table.Row>
              <Table.Cell class="max-w-xs truncate font-medium" title={item.fileName}>
                {item.fileName}
              </Table.Cell>
              <Table.Cell>{item.latestExtraction?.parserName ?? '—'}</Table.Cell>
              <Table.Cell>
                {#if item.latestExtraction}
                  <Badge variant={extractionBadgeVariant(item.latestExtraction.status)}>
                    {EXTRACTION_STATUS_LABELS[item.latestExtraction.status]}
                  </Badge>
                {:else}
                  <span class="text-sm text-muted-foreground">No extraction</span>
                {/if}
              </Table.Cell>
              <Table.Cell class="text-muted-foreground">
                {new Date(item.createdAt).toLocaleDateString()}
              </Table.Cell>
              <Table.Cell>
                <div class="flex justify-end gap-2">
                  <Button variant="outline" size="sm" href={`/document-processing/${item.id}`}>
                    View
                  </Button>
                  <form
                    method="POST"
                    action="?/delete"
                    use:enhance={({ cancel }) => {
                      if (!confirm(`Delete ${item.fileName}?`)) cancel();
                    }}
                  >
                    <input type="hidden" name="id" value={item.id} />
                    <Button type="submit" variant="ghost" size="icon-sm" aria-label="Delete document">
                      <Trash />
                    </Button>
                  </form>
                </div>
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </Card.Root>
  {/if}
</div>
