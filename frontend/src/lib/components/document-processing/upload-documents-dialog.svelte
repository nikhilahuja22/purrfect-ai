<script lang="ts">
  import { Check, Clock, FileText, LoaderCircle, Plus, Upload, X } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import type { DocumentParser } from '$lib/document-parsers/types.js';

  // selected: picked but not submitted. queued: waiting its turn. uploading: in progress.
  type ItemStatus = 'selected' | 'queued' | 'uploading' | 'done' | 'failed';
  type UploadItem = { key: string; file: File; status: ItemStatus; error: string };
  type Phase = 'select' | 'running' | 'finished';

  let { parsers, onComplete }: { parsers: DocumentParser[]; onComplete?: () => void } = $props();

  let open = $state(false);
  let phase = $state<Phase>('select');
  let parserId = $state('');
  let items = $state<UploadItem[]>([]);
  let error = $state('');

  const canCreate = $derived(phase === 'select' && items.length > 0 && parserId !== '');

  function handleOpenChange(next: boolean) {
    // Keep the dialog open while files are uploading.
    if (!next && phase === 'running') return;
    if (next) {
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

  // Three steps. 1) Get an id and presigned URL. 2) PUT the file to S3. 3) Create the document row.
  // If step 2 fails, no row is created.
  async function createAndUpload(file: File, selectedParserId: string): Promise<void> {
    const urlResponse = await fetch('/document-processing/upload-url', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contentType: file.type })
    });
    if (!urlResponse.ok) throw new Error(`Could not start upload (${urlResponse.status})`);
    const { id, uploadUrl, contentType } = (await urlResponse.json()) as {
      id: string;
      uploadUrl: string;
      contentType: string;
    };

    const upload = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'content-type': contentType },
      body: file
    });
    if (!upload.ok) throw new Error(`S3 upload failed with status ${upload.status}`);

    const response = await fetch('/document-processing/upload', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id,
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        parserId: selectedParserId
      })
    });
    if (!response.ok) throw new Error(`Could not save document (${response.status})`);
  }

  async function create() {
    if (!parserId || items.length === 0) {
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
        await createAndUpload(item.file, parserId);
        item.status = 'done';
      } catch {
        item.status = 'failed';
        item.error = 'Could not upload this file.';
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
