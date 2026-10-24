<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Plus, Trash } from '@lucide/svelte';
  import {
    createField,
    FIELD_KINDS,
    isContainer,
    type FieldDef,
    type FieldKind
  } from '$lib/document-parsers/types.js';
  import FieldEditor from './field-editor.svelte';

  let {
    field = $bindable(),
    onremove
  }: { field: FieldDef; onremove: () => void } = $props();

  function setKind(kind: FieldKind) {
    field.kind = kind;
    if (!isContainer(kind)) {
      field.children = [];
    } else if (field.children.length === 0) {
      field.children = [createField()];
    }
  }
</script>

<div class="space-y-3 rounded-md border bg-card p-3">
  <div class="grid gap-2 md:grid-cols-2">
    <Input placeholder="Label, e.g. Statement start date" aria-label="Field label" bind:value={field.label} />
    <Input
      class="font-mono"
      placeholder="key, e.g. start_date"
      aria-label="Field key"
      bind:value={field.name}
    />
  </div>

  <div class="flex flex-wrap items-center gap-3">
    <select
      class="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
      aria-label="Field type"
      value={field.kind}
      onchange={(event) => setKind(event.currentTarget.value as FieldKind)}
    >
      {#each FIELD_KINDS as option (option.value)}
        <option value={option.value}>{option.label}</option>
      {/each}
    </select>
    <label class="flex items-center gap-2 text-sm">
      <input type="checkbox" class="size-4" bind:checked={field.required} />
      Required
    </label>
    <div class="ml-auto">
      <Button variant="ghost" size="icon-sm" aria-label="Remove field" onclick={onremove}>
        <Trash />
      </Button>
    </div>
  </div>

  <Input
    placeholder="Description for the AI, e.g. The date the statement period starts"
    aria-label="Field description"
    bind:value={field.description}
  />

  {#if isContainer(field.kind)}
    <div class="space-y-3 border-l-2 pl-4">
      {#each field.children as child, index (child.id)}
        <FieldEditor
          bind:field={field.children[index]}
          onremove={() => field.children.splice(index, 1)}
        />
      {/each}
      <Button
        variant="outline"
        size="sm"
        onclick={() => field.children.push(createField())}
      >
        <Plus />
        {field.kind === 'array' ? 'Add item field' : 'Add nested field'}
      </Button>
    </div>
  {/if}
</div>
