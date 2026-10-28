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
  },
  // Validated in lib/server/crypto/secret-box.ts when a key is first used, not at startup.
  ENCRYPTION_KEY: {
    schema: (value) => value
  },
  // Validated in lib/server/storage/s3.ts when a file is first used, not at startup.
  AWS_REGION: {
    schema: (value) => value
  },
  S3_BUCKET: {
    schema: (value) => value
  },
  // Read here because the AWS SDK's default lookup only checks process.env, which does not include .env.
  AWS_ACCESS_KEY_ID: {
    schema: (value) => value
  },
  AWS_SECRET_ACCESS_KEY: {
    schema: (value) => value
  }
});
