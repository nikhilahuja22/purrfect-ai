import { getDb } from '$lib/server/db/index.js';
import { companies, users, type Company, type User } from '$lib/server/db/schema.js';
import { hashPassword } from './password.js';

export type SignUpInput = {
  name: string;
  email: string;
  password: string;
  companyName: string;
};

export class EmailTakenError extends Error {
  constructor() {
    super('An account with this email already exists.');
    this.name = 'EmailTakenError';
  }
}

const UNIQUE_VIOLATION = '23505';

function isUniqueViolation(err: unknown): boolean {
  const direct = (err as { code?: string } | null)?.code;
  const wrapped = (err as { cause?: { code?: string } } | null)?.cause?.code;
  return direct === UNIQUE_VIOLATION || wrapped === UNIQUE_VIOLATION;
}

// Creates the company and its first user in one transaction.
export async function signUp(input: SignUpInput): Promise<{ company: Company; user: User }> {
  const passwordHash = await hashPassword(input.password);

  try {
    return await getDb().transaction(async (tx) => {
      const [company] = await tx
        .insert(companies)
        .values({ name: input.companyName })
        .returning();

      const [user] = await tx
        .insert(users)
        .values({
          companyId: company.id,
          name: input.name,
          email: input.email,
          passwordHash
        })
        .returning();

      return { company, user };
    });
  } catch (err) {
    if (isUniqueViolation(err)) throw new EmailTakenError();
    throw err;
  }
}
