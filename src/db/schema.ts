/**
 * Database schema.
 *
 * Better Auth owns `user`, `session`, `account` and `verification`. The shapes
 * match what its Drizzle adapter expects.
 */

import {
    boolean,
    index,
    integer,
    jsonb,
    pgTable,
    text,
    timestamp,
    unique,
} from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    image: text('image'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

export const session = pgTable(
    'session',
    {
        id: text('id').primaryKey(),
        expiresAt: timestamp('expires_at').notNull(),
        token: text('token').notNull().unique(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at')
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
        ipAddress: text('ip_address'),
        userAgent: text('user_agent'),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
    },
    (table) => [index('session_user_id_idx').on(table.userId)]
);

export const account = pgTable(
    'account',
    {
        id: text('id').primaryKey(),
        accountId: text('account_id').notNull(),
        providerId: text('provider_id').notNull(),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        accessToken: text('access_token'),
        refreshToken: text('refresh_token'),
        idToken: text('id_token'),
        accessTokenExpiresAt: timestamp('access_token_expires_at'),
        refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
        scope: text('scope'),
        password: text('password'),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at')
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [index('account_user_id_idx').on(table.userId)]
);

export const verification = pgTable(
    'verification',
    {
        id: text('id').primaryKey(),
        identifier: text('identifier').notNull(),
        value: text('value').notNull(),
        expiresAt: timestamp('expires_at').notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at')
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [index('verification_identifier_idx').on(table.identifier)]
);

/**
 * One image per user, shown on Home. `id` is what the image URL carries and
 * is the only thing guarding the bytes, so it is random and replaced on every
 * upload.
 */
export const visionBoard = pgTable('vision_board', {
    userId: text('user_id')
        .primaryKey()
        .references(() => user.id, { onDelete: 'cascade' }),
    id: text('id').notNull().unique(),
    /** Base64, so no part of this needs a binary column type. */
    data: text('data').notNull(),
    contentType: text('content_type').notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

/**
 * One month of the monthly closeout. `answers` maps a question key to its
 * text; the questions themselves live in code, so rewording one never touches
 * what was written.
 */
export const closeoutMonth = pgTable(
    'closeout_month',
    {
        id: text('id').primaryKey(),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        year: integer('year').notNull(),
        /** 1 to 12. */
        month: integer('month').notNull(),
        answers: jsonb('answers')
            .$type<Record<string, string>>()
            .default({})
            .notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at')
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [unique().on(table.userId, table.year, table.month)]
);

/**
 * One line of a month's closeout checklist. Every month has its own copy, so
 * editing this month's list leaves earlier months as they were.
 */
export const closeoutItem = pgTable(
    'closeout_item',
    {
        id: text('id').primaryKey(),
        monthId: text('month_id')
            .notNull()
            .references(() => closeoutMonth.id, { onDelete: 'cascade' }),
        area: text('area').notNull(),
        text: text('text').notNull(),
        done: boolean('done').default(false).notNull(),
        /** Insertion order. An area sits where its first item does. */
        position: integer('position').notNull(),
    },
    (table) => [index('closeout_item_month_id_idx').on(table.monthId)]
);
