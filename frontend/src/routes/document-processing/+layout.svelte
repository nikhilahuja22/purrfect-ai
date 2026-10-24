<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import * as Tabs from '$lib/components/ui/tabs/index.js';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  const tabs = [
    {
      value: '/document-processing',
      title: 'Documents',
      heading: 'Documents',
      description: 'Upload documents and review the data parsed from them.'
    },
    {
      value: '/document-processing/settings',
      title: 'Settings',
      heading: 'Document Parsers',
      description: 'Define the document types you want to parse and the fields to extract from them.'
    }
  ];

  const activeTab = $derived(
    page.url.pathname.startsWith('/document-processing/settings') ? tabs[1] : tabs[0]
  );
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-semibold">{activeTab.heading}</h1>
    <p class="text-sm text-muted-foreground">{activeTab.description}</p>
  </div>

  <Tabs.Root value={activeTab.value} onValueChange={(value) => goto(value)}>
    <Tabs.List>
      {#each tabs as tab (tab.value)}
        <Tabs.Trigger value={tab.value}>{tab.title}</Tabs.Trigger>
      {/each}
    </Tabs.List>
  </Tabs.Root>

  {@render children()}
</div>
