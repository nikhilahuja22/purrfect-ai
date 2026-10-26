import Joi from 'joi';

export type LoginValues = {
  email: string;
  password: string;
};

export type LoginErrors = Partial<Record<keyof LoginValues, string>>;

export type LoginResult = { ok: true; value: LoginValues } | { ok: false; errors: LoginErrors };

const loginSchema = Joi.object<LoginValues>({
  email: Joi.string()
    .trim()
    .lowercase()
    .max(254)
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'any.required': 'Enter your email.',
      'string.base': 'Enter your email.',
      'string.empty': 'Enter your email.',
      'string.email': 'Enter a valid email address.',
      'string.max': 'Enter a valid email address.'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Enter your password.',
      'string.base': 'Enter your password.',
      'string.empty': 'Enter your password.'
    })
});

// Runs on the server in the login form action.
export function validateLogin(input: unknown): LoginResult {
  // A non-object body is treated as empty so every required field reports its error.
  const body = typeof input === 'object' && input !== null ? input : {};
  const { error, value } = loginSchema.validate(body, { abortEarly: false, stripUnknown: true });
  if (!error) return { ok: true, value };

  // Keep the first message per field.
  const errors: LoginErrors = {};
  for (const detail of error.details) {
    const key = detail.path[0] as keyof LoginValues | undefined;
    if (key && !errors[key]) errors[key] = detail.message;
  }
  return { ok: false, errors };
}
