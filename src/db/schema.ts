/**
 * Database schema.
 *
 * Better Auth owns `user`, `session`, `account` and `verification`. The shapes
 * match what its Drizzle adapter expects.
 */

import { sql } from 'drizzle-orm';
import {
    boolean,
    check,
    date,
    index,
    integer,
    jsonb,
    pgTable,
    primaryKey,
    text,
    timestamp,
    unique,
    uniqueIndex,
} from 'drizzle-orm/pg-core';

import type { SavedTool } from '../tools';

export const user = pgTable('user', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    image: text('image'),
    createdAt: timestamp('created_at', { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

export const session = pgTable(
    'session',
    {
        id: text('id').primaryKey(),
        expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
        token: text('token').notNull().unique(),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
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
        accessTokenExpiresAt: timestamp('access_token_expires_at', {
            withTimezone: true,
        }),
        refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
            withTimezone: true,
        }),
        scope: text('scope'),
        password: text('password'),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
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
        expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
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
    updatedAt: timestamp('updated_at', { withTimezone: true })
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
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
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

/**
 * One kind of check-up, such as Dentista, with the date of its last visit. A
 * new visit overwrites the date; there is no history.
 */
export const checkup = pgTable(
    'checkup',
    {
        id: text('id').primaryKey(),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        name: text('name').notNull(),
        lastDate: date('last_date'),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        uniqueIndex('checkup_user_id_name_idx').on(
            table.userId,
            sql`lower(${table.name})`
        ),
    ]
);

/** A medicine taken repeatedly. Ongoing until its end date has passed. */
export const medicine = pgTable(
    'medicine',
    {
        id: text('id').primaryKey(),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        name: text('name').notNull(),
        /** Free text, such as "2 volte al giorno". */
        frequency: text('frequency'),
        startDate: date('start_date'),
        endDate: date('end_date'),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index('medicine_user_id_idx').on(table.userId),
        check(
            'medicine_end_after_start',
            sql`${table.endDate} >= ${table.startDate}`
        ),
    ]
);

/**
 * A book, a film, or one season of a series. Author and format apply only to
 * books, season, episodes and watched only to series; the API enforces that.
 */
export const title = pgTable(
    'title',
    {
        id: text('id').primaryKey(),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        kind: text('kind').$type<'book' | 'film' | 'series'>().notNull(),
        name: text('name').notNull(),
        author: text('author'),
        language: text('language'),
        format: text('format').$type<
            'rigida' | 'flessibile' | 'ebook' | 'audiolibro' | 'biblioteca'
        >(),
        season: integer('season'),
        episodes: integer('episodes'),
        /** Episodes watched, counted from the first. */
        watched: integer('watched').default(0).notNull(),
        status: text('status')
            .$type<'todo' | 'doing' | 'done'>()
            .default('todo')
            .notNull(),
        startDate: date('start_date'),
        endDate: date('end_date'),
        /** Half stars, 1 to 10. */
        rating: integer('rating'),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index('title_user_id_kind_idx').on(table.userId, table.kind),
        check('title_kind', sql`${table.kind} in ('book', 'film', 'series')`),
        check(
            'title_status',
            sql`${table.status} in ('todo', 'doing', 'done')`
        ),
        check(
            'title_format',
            sql`${table.format} in ('rigida', 'flessibile', 'ebook', 'audiolibro', 'biblioteca')`
        ),
        check('title_rating', sql`${table.rating} between 1 and 10`),
        check(
            'title_end_after_start',
            sql`${table.endDate} >= ${table.startDate}`
        ),
    ]
);

/**
 * One 12-week run of the creativity workbook. It ends 83 days after its
 * Monday start, or on the day it was interrupted.
 */
export const creativeCycle = pgTable(
    'creative_cycle',
    {
        id: text('id').primaryKey(),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        startDate: date('start_date').notNull(),
        interruptedOn: date('interrupted_on'),
        intentPractice: text('intent_practice'),
        intentFeeling: text('intent_feeling'),
        intentProject: text('intent_project'),
        openingNourishing: text('opening_nourishing'),
        openingDraining: text('opening_draining'),
        openingSuccess: text('opening_success'),
        /** The four setup checklist items, in order. */
        setup: boolean('setup')
            .array()
            .default([false, false, false, false])
            .notNull(),
        midpointShifted: text('midpoint_shifted'),
        midpointHelping: text('midpoint_helping'),
        midpointSimplify: text('midpoint_simplify'),
        closingShift1: text('closing_shift_1'),
        closingShift2: text('closing_shift_2'),
        closingShift3: text('closing_shift_3'),
        closingPractice: text('closing_practice'),
        closingDiscovery: text('closing_discovery'),
        closingMade: text('closing_made'),
        closingBelief: text('closing_belief'),
        closingPromise: text('closing_promise'),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        unique().on(table.userId, table.startDate),
        check(
            'creative_cycle_monday',
            sql`extract(isodow from ${table.startDate}) = 1`
        ),
        check(
            'creative_cycle_interrupted_within',
            sql`${table.interruptedOn} between ${table.startDate} and ${table.startDate} + 83`
        ),
        check('creative_cycle_setup', sql`cardinality(${table.setup}) = 4`),
    ]
);

/**
 * What the user recorded in one week of a cycle. The row appears the first
 * time something in that week is saved.
 */
export const creativeWeek = pgTable(
    'creative_week',
    {
        cycleId: text('cycle_id')
            .notNull()
            .references(() => creativeCycle.id, { onDelete: 'cascade' }),
        /** 1 to 12. */
        week: integer('week').notNull(),
        /** Monday to Sunday. */
        dailyPages: boolean('daily_pages')
            .array()
            .default([false, false, false, false, false, false, false])
            .notNull(),
        outing: boolean('outing').default(false).notNull(),
        tinyAction: boolean('tiny_action').default(false).notNull(),
        /** By position in the week's theme. */
        evidence: boolean('evidence').array().default([]).notNull(),
        /** Half dots, 1 to 10. */
        energy: integer('energy'),
        notes: text('notes'),
        carryForward: text('carry_forward'),
        reviewed: boolean('reviewed').default(false).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        primaryKey({ columns: [table.cycleId, table.week] }),
        check('creative_week_week', sql`${table.week} between 1 and 12`),
        check(
            'creative_week_daily_pages',
            sql`cardinality(${table.dailyPages}) = 7`
        ),
        check('creative_week_energy', sql`${table.energy} between 1 and 10`),
    ]
);

/** A kind of workout, such as Corsa. Names are unique per user, ignoring case. */
export const workoutType = pgTable(
    'workout_type',
    {
        id: text('id').primaryKey(),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        name: text('name').notNull(),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        uniqueIndex('workout_type_user_id_name_idx').on(
            table.userId,
            sql`lower(${table.name})`
        ),
    ]
);

/**
 * One recorded workout. A type in use cannot be deleted. The foreign key is
 * "no action" rather than "restrict" so deleting a user can still cascade
 * through both tables.
 */
export const workout = pgTable(
    'workout',
    {
        id: text('id').primaryKey(),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        typeId: text('type_id')
            .notNull()
            .references(() => workoutType.id, { onDelete: 'no action' }),
        date: date('date').notNull(),
        minutes: integer('minutes'),
        note: text('note'),
        /** Taken from a lesson pack of this type's lesson activity. */
        lesson: boolean('lesson').default(false).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index('workout_user_id_date_idx').on(table.userId, table.date),
        check('workout_minutes', sql`${table.minutes} between 1 and 600`),
    ]
);

/**
 * A workout type the user buys lesson packs for, at most one per type. Like
 * `workout`, the type key is "no action", so a type with an activity cannot be
 * deleted.
 */
export const lessonActivity = pgTable(
    'lesson_activity',
    {
        id: text('id').primaryKey(),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        typeId: text('type_id')
            .notNull()
            .references(() => workoutType.id, { onDelete: 'no action' }),
        archivedAt: timestamp('archived_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        uniqueIndex('lesson_activity_type_id_idx').on(table.typeId),
        index('lesson_activity_user_id_idx').on(table.userId),
    ]
);

/** Lessons paid for in advance, all at once. */
export const lessonPack = pgTable(
    'lesson_pack',
    {
        id: text('id').primaryKey(),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        activityId: text('activity_id')
            .notNull()
            .references(() => lessonActivity.id, { onDelete: 'cascade' }),
        lessons: integer('lessons').notNull(),
        paidOn: date('paid_on').notNull(),
        amountCents: integer('amount_cents').notNull(),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index('lesson_pack_activity_id_idx').on(table.activityId),
        check('lesson_pack_lessons', sql`${table.lessons} between 1 and 100`),
        check(
            'lesson_pack_amount',
            sql`${table.amountCents} between 0 and 10000000`
        ),
    ]
);

/**
 * A bucket list. It belongs to one account, or to two partners who share it,
 * so its seasons hang off the list rather than off an account.
 */
export const bucketList = pgTable('bucket_list', {
    id: text('id').primaryKey(),
});

/** The one list each account sees. */
export const bucketListMember = pgTable(
    'bucket_list_member',
    {
        userId: text('user_id')
            .primaryKey()
            .references(() => user.id, { onDelete: 'cascade' }),
        listId: text('list_id')
            .notNull()
            .references(() => bucketList.id, { onDelete: 'cascade' }),
    },
    (table) => [index('bucket_list_member_list_id_idx').on(table.listId)]
);

/** One season of one year. Winter is stored under the year of its December. */
export const bucketSeason = pgTable(
    'bucket_season',
    {
        id: text('id').primaryKey(),
        listId: text('list_id')
            .notNull()
            .references(() => bucketList.id, { onDelete: 'cascade' }),
        year: integer('year').notNull(),
        season: text('season').notNull(),
    },
    (table) => [
        unique().on(table.listId, table.year, table.season),
        check(
            'bucket_season_season',
            sql`${table.season} in ('primavera', 'estate', 'autunno', 'inverno')`
        ),
    ]
);

/** One thing to do in a season. Done when `doneOn` is set. */
export const bucketItem = pgTable(
    'bucket_item',
    {
        id: text('id').primaryKey(),
        seasonId: text('season_id')
            .notNull()
            .references(() => bucketSeason.id, { onDelete: 'cascade' }),
        text: text('text').notNull(),
        addedBy: text('added_by').references(() => user.id, {
            onDelete: 'set null',
        }),
        doneOn: date('done_on'),
        /** Insertion order. */
        position: integer('position').notNull(),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [index('bucket_item_season_id_idx').on(table.seasonId)]
);

/** An invite to share a bucket list. An account sends one at a time. */
export const bucketInvite = pgTable('bucket_invite', {
    id: text('id').primaryKey(),
    fromUserId: text('from_user_id')
        .notNull()
        .unique()
        .references(() => user.id, { onDelete: 'cascade' }),
    toUserId: text('to_user_id')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
        .defaultNow()
        .notNull(),
});

/**
 * A habit in the habit tracker. `daily` is done or not per day, `weekly` adds
 * a target of days per week, `amount` is a number per day against a daily
 * target. Each account has one Sport habit, which stores no days: its days
 * are the dates of the account's workouts.
 */
export const habit = pgTable(
    'habit',
    {
        id: text('id').primaryKey(),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        name: text('name').notNull(),
        mode: text('mode', { enum: ['daily', 'weekly', 'amount'] }).notNull(),
        sport: boolean('sport').default(false).notNull(),
        weeklyTarget: integer('weekly_target'),
        unit: text('unit'),
        dailyTarget: integer('daily_target'),
        position: integer('position').notNull(),
        archivedAt: timestamp('archived_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index('habit_user_id_idx').on(table.userId),
        uniqueIndex('habit_user_id_sport_idx')
            .on(table.userId)
            .where(sql`${table.sport}`),
        check(
            'habit_mode_fields',
            sql`case ${table.mode}
                when 'daily' then ${table.weeklyTarget} is null and ${table.unit} is null and ${table.dailyTarget} is null
                when 'weekly' then ${table.weeklyTarget} between 1 and 7 and ${table.unit} is null and ${table.dailyTarget} is null
                when 'amount' then ${table.weeklyTarget} is null and ${table.unit} is not null and ${table.dailyTarget} >= 1
                else false end`
        ),
        check(
            'habit_sport_weekly',
            sql`not ${table.sport} or (${table.mode} = 'weekly' and ${table.archivedAt} is null)`
        ),
    ]
);

/** A marked day of a habit. `amount` is set only for `amount` habits. */
export const habitDay = pgTable(
    'habit_day',
    {
        habitId: text('habit_id')
            .notNull()
            .references(() => habit.id, { onDelete: 'cascade' }),
        date: date('date').notNull(),
        amount: integer('amount'),
    },
    (table) => [
        primaryKey({ columns: [table.habitId, table.date] }),
        check('habit_day_amount', sql`${table.amount} >= 1`),
    ]
);

/** One line of the brain dump. `createdAt` is when it was written. */
export const brainEntry = pgTable(
    'brain_entry',
    {
        id: text('id').primaryKey(),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        text: text('text').notNull(),
        // With time zone: the time is shown, and pg reads a plain timestamp
        // as the server's local time.
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index('brain_entry_user_id_idx').on(table.userId),
        check(
            'brain_entry_text_length',
            sql`char_length(${table.text}) between 1 and 1000`
        ),
    ]
);

/** One glimmer. `happenedAt` starts as the moment of writing and can be changed. */
export const glimmer = pgTable(
    'glimmer',
    {
        id: text('id').primaryKey(),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        text: text('text').notNull(),
        happenedAt: timestamp('happened_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index('glimmer_user_id_idx').on(table.userId),
        check(
            'glimmer_text_length',
            sql`char_length(${table.text}) between 1 and 1000`
        ),
    ]
);

/** A person the account keeps gifts for. Names are unique per account, ignoring case. */
export const giftRecipient = pgTable(
    'gift_recipient',
    {
        id: text('id').primaryKey(),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        name: text('name').notNull(),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        uniqueIndex('gift_recipient_user_name_idx').on(
            table.userId,
            sql`lower(${table.name})`
        ),
        check(
            'gift_recipient_name_length',
            sql`char_length(${table.name}) between 1 and 100`
        ),
    ]
);

/** One gift for one recipient. An idea until `givenOn` is set. */
export const gift = pgTable(
    'gift',
    {
        id: text('id').primaryKey(),
        recipientId: text('recipient_id')
            .notNull()
            .references(() => giftRecipient.id, { onDelete: 'cascade' }),
        name: text('name').notNull(),
        /** "Compleanno", "Natale", "Anniversario", or the user's own text. */
        occasion: text('occasion'),
        priceCents: integer('price_cents'),
        link: text('link'),
        givenOn: date('given_on'),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index('gift_recipient_id_idx').on(table.recipientId),
        check(
            'gift_name_length',
            sql`char_length(${table.name}) between 1 and 200`
        ),
        check(
            'gift_occasion_length',
            sql`char_length(${table.occasion}) between 1 and 60`
        ),
        check(
            'gift_price_cents',
            sql`${table.priceCents} between 0 and 10000000`
        ),
        check(
            'gift_link_length',
            sql`char_length(${table.link}) between 1 and 2000`
        ),
    ]
);

/** One Semaforo item. The four colours are fixed in `src/semaforo/colours.ts`. */
export const semaforoItem = pgTable(
    'semaforo_item',
    {
        id: text('id').primaryKey(),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        colour: text('colour').notNull(),
        name: text('name').notNull(),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index('semaforo_item_user_id_idx').on(table.userId),
        check(
            'semaforo_item_colour',
            sql`${table.colour} in ('red', 'orange', 'yellow', 'green')`
        ),
        check(
            'semaforo_item_name_length',
            sql`char_length(${table.name}) between 1 and 100`
        ),
    ]
);

export const saga = pgTable(
    'saga',
    {
        id: text('id').primaryKey(),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        name: text('name').notNull(),
        author: text('author'),
        language: text('language'),
        volumes: integer('volumes').notNull(),
        volumesRead: integer('volumes_read').default(0).notNull(),
        nextRelease: text('next_release'),
        archivedAt: timestamp('archived_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index('saga_user_id_idx').on(table.userId),
        check(
            'saga_name_length',
            sql`char_length(${table.name}) between 1 and 100`
        ),
        check('saga_volumes', sql`${table.volumes} between 1 and 99`),
        check(
            'saga_volumes_read',
            sql`${table.volumesRead} between 0 and ${table.volumes}`
        ),
    ]
);

/** One row per account, created on its first save. */
export const userSettings = pgTable('user_settings', {
    userId: text('user_id')
        .primaryKey()
        .references(() => user.id, { onDelete: 'cascade' }),
    /** Tool order and hidden flags. `null` means the code's order, all visible. */
    tools: jsonb('tools').$type<SavedTool[]>(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});
