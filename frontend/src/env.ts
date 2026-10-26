import { defineEnvVars } from '@sveltejs/kit/env';

// Private variables are exposed through `$app/env/private`.
export const variables = defineEnvVars({
  DATABASE_URL: {
    schema: (value) => {
      if (!value) {
        throw new Error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
      }
      return value;
    }
  }
});
