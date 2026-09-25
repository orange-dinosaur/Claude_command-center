/**
 * Shared pieces of the sport API. Server only: it imports the database schema.
 */

import { workoutType } from '@/db/schema';

export const workoutTypeColumns = {
    id: workoutType.id,
    name: workoutType.name,
};
