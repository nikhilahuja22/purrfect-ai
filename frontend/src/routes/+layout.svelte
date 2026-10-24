<script lang="ts">
  import './layout.css';
  import favicon from '#lib/assets/favicon.svg';
  import { page } from '$app/state';
  import AppSidebar from '$lib/components/app-sidebar.svelte';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import type { LayoutProps } from './$types';

  let { children }: LayoutProps = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

{#if page.url.pathname === '/login'}
  {@render children()}
{:else}
  <Sidebar.Provider>
    <AppSidebar />
    <Sidebar.Inset>
      <header class="flex h-14 items-center gap-2 border-b px-4">
        <Sidebar.Trigger />
      </header>
      <main class="flex-1 p-6">
        {@render children()}
      </main>
    </Sidebar.Inset>
  </Sidebar.Provider>
{/if}
