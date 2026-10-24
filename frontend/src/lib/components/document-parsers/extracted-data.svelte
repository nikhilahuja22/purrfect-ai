<script lang="ts">
  import ExtractedData from './extracted-data.svelte';
  import type { FieldDef } from '$lib/document-parsers/types.js';

  // Renders extracted values using the labels from the parser definition.
  // Keys without a matching field fall back to a readable version of the key.
  let { data, fields = [] }: { data: unknown; fields?: FieldDef[] } = $props();

  function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  function findField(key: string, list: FieldDef[]): FieldDef | undefined {
    return list.find((field) => field.name === key);
  }

  function labelFor(key: string, list: FieldDef[]): string {
    const label = findField(key, list)?.label.trim();
    if (label) return label;
    const words = key.replace(/_/g, ' ').trim();
    return words.charAt(0).toUpperCase() + words.slice(1);
  }

  function childFields(key: string, list: FieldDef[]): FieldDef[] {
    return findField(key, list)?.children ?? [];
  }

  function formatScalar(value: unknown): string {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
    return String(value);
  }
</script>

{#if isPlainObject(data)}
  <dl class="space-y-4">
    {#each Object.entries(data) as [key, value] (key)}
      <div class="space-y-1">
        <dt class="text-sm font-medium text-muted-foreground">{labelFor(key, fields)}</dt>
        <dd>
          {#if Array.isArray(value)}
            <div class="space-y-3">
              {#each value as item, index (index)}
                <div class="rounded-md border p-3">
                  <ExtractedData data={item} fields={childFields(key, fields)} />
                </div>
              {:else}
                <p class="text-sm">—</p>
              {/each}
            </div>
          {:else if isPlainObject(value)}
            <div class="rounded-md border p-3">
              <ExtractedData data={value} fields={childFields(key, fields)} />
            </div>
          {:else}
            <p class="text-sm">{formatScalar(value)}</p>
          {/if}
        </dd>
      </div>
    {/each}
  </dl>
{:else}
  <p class="text-sm">{formatScalar(data)}</p>
{/if}
