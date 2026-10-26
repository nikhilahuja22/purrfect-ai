<script lang="ts">
  import { enhance, type SubmitFunction } from '$app/forms';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import type { LoginErrors } from '$lib/auth/login-validation.js';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();

  let submitting = $state(false);
  const errors: LoginErrors = $derived(form?.errors ?? {});
  const formError = $derived(form?.formError ?? '');

  // A successful sign-in returns a redirect to / from the server, which update() follows.
  const handleEnhance: SubmitFunction = () => {
    submitting = true;
    return async ({ update }) => {
      submitting = false;
      await update();
    };
  };
</script>

<div class="flex min-h-svh items-center justify-center p-6">
  <Card.Root class="w-full max-w-sm">
    <Card.Header>
      <Card.Title>Sign in to Purrfect AI</Card.Title>
      <Card.Description>Enter your email to continue.</Card.Description>
    </Card.Header>
    <Card.Content>
      <form class="space-y-4" method="POST" use:enhance={handleEnhance} novalidate>
        <div class="space-y-2">
          <Label for="login-email">Email</Label>
          <Input
            id="login-email"
            name="email"
            type="email"
            autocomplete="email"
            placeholder="you@example.com"
          />
          {#if errors.email}
            <p class="text-sm text-destructive">{errors.email}</p>
          {/if}
        </div>

        <div class="space-y-2">
          <Label for="login-password">Password</Label>
          <Input
            id="login-password"
            name="password"
            type="password"
            autocomplete="current-password"
          />
          {#if errors.password}
            <p class="text-sm text-destructive">{errors.password}</p>
          {/if}
        </div>

        {#if formError}
          <p class="text-sm text-destructive">{formError}</p>
        {/if}

        <Button type="submit" class="w-full" disabled={submitting}>Sign in</Button>
      </form>
      <p class="mt-4 text-center text-sm text-muted-foreground">
        No account? <a href="/sign-up" class="underline">Create one</a>
      </p>
    </Card.Content>
  </Card.Root>
</div>
