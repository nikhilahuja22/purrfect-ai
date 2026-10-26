import Joi from 'joi';

export type SignUpValues = {
  name: string;
  email: string;
  password: string;
  companyName: string;
};

export type SignUpErrors = Partial<Record<keyof SignUpValues, string>>;

export type SignUpResult = { ok: true; value: SignUpValues } | { ok: false; errors: SignUpErrors };

// bcrypt hashes at most 72 bytes of input.
const PASSWORD_MAX_LENGTH = 72;

// Error text for missing or empty fields (Joi reports null/undefined as "required" or "string.base").
const missing = (text: string) => ({
  'any.required': text,
  'string.base': text,
  'string.empty': text
});

const signUpSchema = Joi.object<SignUpValues>({
  name: Joi.string()
    .trim()
    .max(100)
    .required()
    .messages({
      ...missing('Enter your name.'),
      'string.max': 'Name must be 100 characters or fewer.'
    }),
  email: Joi.string()
    .trim()
    .lowercase()
    .max(254)
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      ...missing('Enter your email.'),
      'string.email': 'Enter a valid email address.',
      'string.max': 'Enter a valid email address.'
    }),
  password: Joi.string()
    .min(8)
    .max(PASSWORD_MAX_LENGTH)
    // bcrypt only uses the first 72 bytes, so multi-byte characters can exceed the limit sooner.
    .custom((value: string, helpers) =>
      new TextEncoder().encode(value).length > PASSWORD_MAX_LENGTH ? helpers.error('string.max') : value
    )
    .required()
    .messages({
      ...missing('Enter a password.'),
      'string.min': 'Password must be at least 8 characters.',
      'string.max': `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer.`
    }),
  companyName: Joi.string()
    .trim()
    .max(120)
    .required()
    .messages({
      ...missing('Enter a company name.'),
      'string.max': 'Company name must be 120 characters or fewer.'
    })
});

// Runs on the server in the sign-up form action.
export function validateSignUp(input: unknown): SignUpResult {
  // A non-object body is treated as empty so every required field reports its error.
  const body = typeof input === 'object' && input !== null ? input : {};
  const { error, value } = signUpSchema.validate(body, { abortEarly: false, stripUnknown: true });
  if (!error) return { ok: true, value };

  // Keep the first message per field, matching the previous behaviour.
  const errors: SignUpErrors = {};
  for (const detail of error.details) {
    const key = detail.path[0] as keyof SignUpValues | undefined;
    if (key && !errors[key]) errors[key] = detail.message;
  }
  return { ok: false, errors };
}
