<script lang="ts">
  import { enhance, type SubmitFunction } from '$app/forms';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import type { SignUpErrors } from '$lib/auth/sign-up-validation.js';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();

  let submitting = $state(false);
  const errors: SignUpErrors = $derived(form?.errors ?? {});
  const formError = $derived(form?.formError ?? '');

  const handleEnhance: SubmitFunction = () => {
    submitting = true;
    // A successful sign-up returns a redirect to / from the server, which update() follows.
    return async ({ update }) => {
      submitting = false;
      await update();
    };
  };
</script>

<div class="flex min-h-svh items-center justify-center p-6">
  <Card.Root class="w-full max-w-sm">
    <Card.Header>
      <Card.Title>Create your account</Card.Title>
      <Card.Description>Set up your company and your user account.</Card.Description>
    </Card.Header>
    <Card.Content>
      <form class="space-y-4" method="POST" use:enhance={handleEnhance} novalidate>
        <div class="space-y-2">
          <Label for="sign-up-name">Full name</Label>
          <Input
            id="sign-up-name"
            name="name"
            autocomplete="name"
            placeholder="Ada Lovelace"
          />
          {#if errors.name}
            <p class="text-sm text-destructive">{errors.name}</p>
          {/if}
        </div>

        <div class="space-y-2">
          <Label for="sign-up-company">Company name</Label>
          <Input
            id="sign-up-company"
            name="companyName"
            autocomplete="organization"
            placeholder="Acme Inc."
          />
          {#if errors.companyName}
            <p class="text-sm text-destructive">{errors.companyName}</p>
          {/if}
        </div>

        <div class="space-y-2">
          <Label for="sign-up-email">Email</Label>
          <Input
            id="sign-up-email"
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
          <Label for="sign-up-password">Password</Label>
          <Input
            id="sign-up-password"
            name="password"
            type="password"
            autocomplete="new-password"
            placeholder="At least 8 characters"
          />
          {#if errors.password}
            <p class="text-sm text-destructive">{errors.password}</p>
          {/if}
        </div>

        {#if formError}
          <p class="text-sm text-destructive">{formError}</p>
        {/if}

        <Button type="submit" class="w-full" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
      <p class="mt-4 text-center text-sm text-muted-foreground">
        Already have an account? <a href="/login" class="underline">Sign in</a>
      </p>
    </Card.Content>
  </Card.Root>
</div>
