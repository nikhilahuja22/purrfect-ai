import {
  bigint,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from 'drizzle-orm/pg-core';
import type { FieldDef } from '../../document-parsers/types';

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [index('users_company_id_idx').on(table.companyId)]
);

// One row per active login. Only the SHA-256 hash of the cookie token is stored.
export const sessions = pgTable(
  'sessions',
  {
    tokenHash: text('token_hash').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull()
  },
  (table) => [index('sessions_user_id_idx').on(table.userId)]
);

// A document type a company defines. `config` holds the nested field tree (FieldDef[]).
export const documentParsers = pgTable(
  'document_parsers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    submitterId: uuid('submitter_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    config: jsonb('config').$type<FieldDef[]>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [uniqueIndex('document_parsers_company_name_idx').on(table.companyId, table.name)]
);

// An uploaded file stored in S3. Holds only file facts, so any module can reference it.
export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    submitterId: uuid('submitter_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    fileName: text('file_name').notNull(),
    contentType: text('content_type').notNull(),
    sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
    storageKey: text('storage_key').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [index('documents_company_id_idx').on(table.companyId)]
);

export type ExtractionStatus = 'processing' | 'extracted' | 'failed';

// One extraction run of a document against a parser. Owns status and results,
// so the documents table stays a plain record of the file.
export const documentExtractions = pgTable(
  'document_extractions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    parserId: uuid('parser_id')
      .notNull()
      .references(() => documentParsers.id, { onDelete: 'restrict' }),
    status: text('status').$type<ExtractionStatus>().notNull().default('processing'),
    // Extracted values, shaped by the parser's fields. Null until extraction finishes.
    data: jsonb('data').$type<Record<string, unknown>>(),
    error: text('error'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('document_extractions_document_id_idx').on(table.documentId),
    index('document_extractions_parser_id_idx').on(table.parserId)
  ]
);

export type IntegrationProvider = 'deepseek' | 'openai' | 'anthropic' | 'google';

// A company's own (BYOK) AI provider key. The key is AES-256-GCM encrypted with the
// ENCRYPTION_KEY master key. Only the last 4 characters are kept in clear text for display.
export const companyIntegrations = pgTable(
  'company_integrations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    provider: text('provider').$type<IntegrationProvider>().notNull(),
    encryptedApiKey: text('encrypted_api_key').notNull(),
    iv: text('iv').notNull(),
    authTag: text('auth_tag').notNull(),
    // Which master key encrypted this row. Lets the master key be rotated later.
    keyVersion: integer('key_version').notNull().default(1),
    keyLast4: text('key_last4').notNull(),
    defaultModel: text('default_model'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [uniqueIndex('company_integrations_company_provider_idx').on(table.companyId, table.provider)]
);

export type Company = typeof companies.$inferSelect;
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type DocumentParserRow = typeof documentParsers.$inferSelect;
export type DocumentRow = typeof documents.$inferSelect;
export type DocumentExtractionRow = typeof documentExtractions.$inferSelect;
export type CompanyIntegrationRow = typeof companyIntegrations.$inferSelect;
