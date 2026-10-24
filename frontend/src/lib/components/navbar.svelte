<script lang="ts">
  import { page } from '$app/state';
  import { Button } from '#lib/components/ui/button/index.js';

  type NavItem = { label: string; href: string };

  const items: NavItem[] = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/#about' }
  ];
</script>

<header class="sticky top-0 z-50 w-full border-b bg-header text-header-foreground">
  <nav class="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
    <a href="/" class="font-display text-lg font-semibold tracking-tight">Purrfect AI</a>

    <ul class="flex items-center gap-1">
      {#each items as item (item.href)}
        <li>
          <Button
            variant="ghost"
            href={item.href}
            aria-current={page.url.pathname === item.href ? 'page' : undefined}
          >
            {item.label}
          </Button>
        </li>
      {/each}
    </ul>
  </nav>
</header>
