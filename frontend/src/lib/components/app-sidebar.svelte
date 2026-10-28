<script lang="ts">
  import { page } from '$app/state';
  import { Gauge, FileText, Plug } from '@lucide/svelte';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import UserMenu from '$lib/components/user-menu.svelte';

  const groups = [
    {
      label: null,
      items: [{ title: 'Dashboard', href: '/', icon: Gauge }]
    },
    {
      label: 'Documents',
      items: [{ title: 'Document Processing', href: '/document-processing', icon: FileText }]
    },
    {
      label: 'Settings',
      items: [{ title: 'Integrations', href: '/integrations', icon: Plug }]
    }
  ];
</script>

<Sidebar.Root collapsible="icon">
  <Sidebar.Header>
    <div class="px-2 pt-2 font-display text-base font-semibold">Purrfect AI</div>
  </Sidebar.Header>

  <Sidebar.Content>
    {#each groups as group, groupIndex (groupIndex)}
      <Sidebar.Group>
        {#if group.label}
          <Sidebar.GroupLabel>{group.label}</Sidebar.GroupLabel>
        {/if}
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            {#each group.items as item (item.href)}
              <Sidebar.MenuItem>
                <Sidebar.MenuButton isActive={page.url.pathname === item.href}>
                  {#snippet child({ props })}
                    <a href={item.href} {...props}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  {/snippet}
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
            {/each}
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>
    {/each}
  </Sidebar.Content>

  <Sidebar.Footer>
    <UserMenu />
  </Sidebar.Footer>

  <Sidebar.Rail />
</Sidebar.Root>
