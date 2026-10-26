<script lang="ts">
  import { goto, refreshAll } from '$app/navigation';
  import { page } from '$app/state';
  import { ChevronsUpDown, LogOut } from '@lucide/svelte';
  import * as Avatar from '$lib/components/ui/avatar/index.js';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';

  const email = $derived<string>(page.data.user?.email ?? '');
  const initial = $derived(email.charAt(0).toUpperCase());

  async function logOut() {
    await fetch('/logout', { method: 'POST' });
    await refreshAll();
    await goto('/login');
  }
</script>

<Sidebar.Menu>
  <Sidebar.MenuItem>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}
          <Sidebar.MenuButton size="lg" {...props}>
            <Avatar.Root class="size-8 rounded-lg">
              <Avatar.Fallback class="rounded-lg">{initial}</Avatar.Fallback>
            </Avatar.Root>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate text-xs text-muted-foreground">Signed in as</span>
              <span class="truncate font-medium">{email}</span>
            </div>
            <ChevronsUpDown class="ml-auto size-4" />
          </Sidebar.MenuButton>
        {/snippet}
      </DropdownMenu.Trigger>

      <DropdownMenu.Content side="top" align="start" class="w-56">
        <DropdownMenu.Label class="font-normal">
          <span class="block truncate text-sm">{email}</span>
        </DropdownMenu.Label>
        <DropdownMenu.Separator />
        <DropdownMenu.Item onSelect={logOut}>
          <LogOut />
          Log out
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </Sidebar.MenuItem>
</Sidebar.Menu>
