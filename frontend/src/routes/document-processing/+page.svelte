<script lang="ts">
  import { onMount } from 'svelte';
  import { Trash } from '@lucide/svelte';
  import UploadDocumentsDialog from '$lib/components/document-processing/upload-documents-dialog.svelte';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import { deleteFile } from '$lib/documents/file-store.js';
  import { deleteDocument, loadDocuments, type ProcessedDocument } from '$lib/documents/store.js';

  let documents = $state<ProcessedDocument[]>([]);
  let loaded = $state(false);

  function refresh() {
    documents = loadDocuments();
  }

  onMount(() => {
    refresh();
    loaded = true;
  });

  async function remove(document: ProcessedDocument) {
    if (!confirm(`Delete ${document.fileName}?`)) return;
    await deleteFile(document.id);
    deleteDocument(document.id);
    documents = loadDocuments();
  }

  function statusLabel(status: ProcessedDocument['status']): string {
    return status === 'parsed' ? 'Parsed' : 'Awaiting extraction';
  }
</script>

<div class="space-y-6">
  <div class="flex flex-wrap items-center justify-between gap-4">
    <p class="text-sm text-muted-foreground">Uploaded documents and their extracted data.</p>
    <UploadDocumentsDialog onComplete={refresh} />
  </div>

  {#if loaded && documents.length === 0}
    <Card.Root>
      <Card.Content class="py-10 text-center text-sm text-muted-foreground">
        No documents yet. Upload one to get started.
      </Card.Content>
    </Card.Root>
  {:else if documents.length > 0}
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
          {#each documents as document (document.id)}
            <Table.Row>
              <Table.Cell class="max-w-xs truncate font-medium" title={document.fileName}>
                {document.fileName}
              </Table.Cell>
              <Table.Cell>{document.parserName}</Table.Cell>
              <Table.Cell>
                <Badge variant={document.status === 'parsed' ? 'default' : 'secondary'}>
                  {statusLabel(document.status)}
                </Badge>
              </Table.Cell>
              <Table.Cell class="text-muted-foreground">
                {new Date(document.createdAt).toLocaleDateString()}
              </Table.Cell>
              <Table.Cell>
                <div class="flex justify-end gap-2">
                  <Button variant="outline" size="sm" href={`/document-processing/${document.id}`}>
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete document"
                    onclick={() => remove(document)}
                  >
                    <Trash />
                  </Button>
                </div>
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </Card.Root>
  {/if}
</div>
