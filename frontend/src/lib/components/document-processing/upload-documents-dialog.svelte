<script lang="ts">
  import { Check, Clock, FileText, LoaderCircle, Plus, Upload, X } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { saveFile } from '$lib/documents/file-store.js';
  import { saveDocument } from '$lib/documents/store.js';
  import { loadParsers } from '$lib/document-parsers/store.js';
  import type { DocumentParser } from '$lib/document-parsers/types.js';

  // selected: picked but not submitted. queued: waiting its turn. uploading: in progress.
  type ItemStatus = 'selected' | 'queued' | 'uploading' | 'done' | 'failed';
  type UploadItem = { key: string; file: File; status: ItemStatus; error: string };
  type Phase = 'select' | 'running' | 'finished';

  let { onComplete }: { onComplete?: () => void } = $props();

  let open = $state(false);
  let phase = $state<Phase>('select');
  let parsers = $state<DocumentParser[]>([]);
  let parserId = $state('');
  let items = $state<UploadItem[]>([]);
  let error = $state('');

  const canCreate = $derived(phase === 'select' && items.length > 0 && parserId !== '');

  function handleOpenChange(next: boolean) {
    // Keep the dialog open while files are uploading.
    if (!next && phase === 'running') return;
    if (next) {
      parsers = loadParsers();
      parserId = parsers[0]?.id ?? '';
      items = [];
      phase = 'select';
      error = '';
    }
    open = next;
  }

  function addFiles(event: Event & { currentTarget: HTMLInputElement }) {
    const picked = Array.from(event.currentTarget.files ?? []);
    // Reset so picking the same file again still fires onchange.
    event.currentTarget.value = '';
    items = [
      ...items,
      ...picked.map((file) => ({
        key: crypto.randomUUID(),
        file,
        status: 'selected' as const,
        error: ''
      }))
    ];
    error = '';
  }

  function removeItem(key: string) {
    items = items.filter((item) => item.key !== key);
  }

  async function create() {
    const parser = parsers.find((item) => item.id === parserId);
    if (!parser || items.length === 0) {
      error = 'Choose a document type and at least one file.';
      return;
    }

    phase = 'running';
    error = '';
    for (const item of items) item.status = 'queued';

    // Upload one at a time so each file's status is easy to follow.
    for (const item of items) {
      item.status = 'uploading';
      try {
        const id = crypto.randomUUID();
        await saveFile(id, item.file);
        saveDocument({
          id,
          fileName: item.file.name,
          mimeType: item.file.type,
          size: item.file.size,
          parserId: parser.id,
          parserName: parser.name,
          status: 'awaiting_extraction',
          createdAt: new Date().toISOString(),
          data: null
        });
        item.status = 'done';
      } catch {
        item.status = 'failed';
        item.error = 'Could not save. The file may be too large.';
      }
    }

    phase = 'finished';
    onComplete?.();
  }
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
  <Dialog.Trigger>
    {#snippet child({ props })}
      <Button {...props}>
        <Upload />
        Upload documents
      </Button>
    {/snippet}
  </Dialog.Trigger>

  <Dialog.Content showCloseButton={phase !== 'running'} class="sm:max-w-lg">
    <Dialog.Header>
      <Dialog.Title>Upload documents</Dialog.Title>
      <Dialog.Description>
        Add one or more files, choose their document type, then create.
      </Dialog.Description>
    </Dialog.Header>

    {#if parsers.length === 0}
      <p class="text-sm text-muted-foreground">
        Create a parser in
        <a class="underline" href="/document-processing/settings/new">Settings</a>
        before uploading documents.
      </p>
    {:else}
      <div class="space-y-4">
        <div class="space-y-2">
          <Label for="upload-parser">Document type</Label>
          <select
            id="upload-parser"
            class="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm disabled:opacity-50"
            bind:value={parserId}
            disabled={phase !== 'select'}
          >
            {#each parsers as parser (parser.id)}
              <option value={parser.id}>{parser.name}</option>
            {/each}
          </select>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <Label for="upload-files">Files</Label>
            {#if phase === 'select'}
              <Label
                for="upload-files"
                class="inline-flex cursor-pointer items-center gap-1 text-sm font-normal text-primary underline-offset-4 hover:underline"
              >
                <Plus class="size-4" />
                Add files
              </Label>
              <input
                id="upload-files"
                type="file"
                multiple
                accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg"
                class="sr-only"
                onchange={addFiles}
              />
            {/if}
          </div>

          {#if items.length === 0}
            <div class="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              No files added yet.
            </div>
          {:else}
            <ul class="divide-y rounded-md border">
              {#each items as item (item.key)}
                <li class="flex items-center gap-3 px-3 py-2 text-sm">
                  <FileText class="size-4 shrink-0 text-muted-foreground" />
                  <span class="min-w-0 flex-1 truncate" title={item.file.name}>{item.file.name}</span>

                  {#if item.status === 'selected'}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${item.file.name}`}
                      onclick={() => removeItem(item.key)}
                    >
                      <X />
                    </Button>
                  {:else if item.status === 'queued'}
                    <span class="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock class="size-4" />
                      Awaiting
                    </span>
                  {:else if item.status === 'uploading'}
                    <LoaderCircle class="size-4 animate-spin text-muted-foreground" aria-label="Uploading" />
                  {:else if item.status === 'done'}
                    <Check class="size-4 text-green-600" aria-label="Uploaded" />
                  {:else}
                    <span class="flex items-center gap-1 text-xs text-destructive" title={item.error}>
                      <X class="size-4" />
                      Failed
                    </span>
                  {/if}
                </li>
              {/each}
            </ul>
          {/if}
        </div>

        {#if error}
          <p class="text-sm text-destructive">{error}</p>
        {/if}
      </div>
    {/if}

    <Dialog.Footer>
      {#if phase === 'finished'}
        <Button onclick={() => handleOpenChange(false)}>Done</Button>
      {:else}
        <Button variant="outline" disabled={phase === 'running'} onclick={() => handleOpenChange(false)}>
          Cancel
        </Button>
        <Button onclick={create} disabled={!canCreate}>
          {#if phase === 'running'}
            <LoaderCircle class="animate-spin" />
            Creating...
          {:else}
            Create
          {/if}
        </Button>
      {/if}
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
