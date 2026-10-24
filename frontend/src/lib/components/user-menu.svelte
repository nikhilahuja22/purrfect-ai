<script lang="ts">
  import { goto } from '$app/navigation';
  import { ChevronsUpDown, LogOut } from '@lucide/svelte';
  import * as Avatar from '$lib/components/ui/avatar/index.js';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import { session, signOut } from '$lib/auth/session.svelte.js';

  const email = $derived(session.current?.email ?? '');
  const initial = $derived(email.charAt(0).toUpperCase());

  function logOut() {
    signOut();
    goto('/login');
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
