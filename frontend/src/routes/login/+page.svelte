<script lang="ts">
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { signIn } from '$lib/auth/session.svelte.js';

  let email = $state('');
  let error = $state('');

  function submit(event: SubmitEvent) {
    event.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      error = 'Enter a valid email address.';
      return;
    }
    signIn(value);
    goto('/');
  }
</script>

<div class="flex min-h-svh items-center justify-center p-6">
  <Card.Root class="w-full max-w-sm">
    <Card.Header>
      <Card.Title>Sign in to Purrfect AI</Card.Title>
      <Card.Description>Enter your email to continue.</Card.Description>
    </Card.Header>
    <Card.Content>
      <form class="space-y-4" onsubmit={submit}>
        <div class="space-y-2">
          <Label for="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            autocomplete="email"
            placeholder="you@example.com"
            bind:value={email}
            required
          />
        </div>

        {#if error}
          <p class="text-sm text-destructive">{error}</p>
        {/if}

        <Button type="submit" class="w-full">Sign in</Button>
      </form>
    </Card.Content>
  </Card.Root>
</div>
