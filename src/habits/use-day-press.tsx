/**
 * What tapping a day cell does, for the week view and the month calendar:
 * Sport days lead to Sport, amount days open the sheet, the others toggle.
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';

import { AmountSheet } from '@/habits/amount-sheet';
import { dayOf } from '@/habits/stats';
import type { Habit, useHabits } from '@/hooks/use-habits';

type Marks = Pick<ReturnType<typeof useHabits>, 'mark' | 'unmark'>;

export function useDayPress({ mark, unmark }: Marks) {
    const router = useRouter();
    // The amount habit and day whose sheet is open.
    const [editing, setEditing] = useState<{ habit: Habit; day: string }>();

    const press = (habit: Habit, day: string) => {
        if (habit.sport) {
            router.push(
                dayOf(habit, day)
                    ? '/sport'
                    : {
                          pathname: '/sport/allenamento',
                          params: { data: day },
                      }
            );
        } else if (habit.mode === 'amount') setEditing({ habit, day });
        else if (dayOf(habit, day)) unmark(habit, day);
        else mark(habit, day);
    };

    const sheet = editing && (
        <AmountSheet
            key={`${editing.habit.id}-${editing.day}`}
            habit={editing.habit}
            day={editing.day}
            onSave={(amount) => mark(editing.habit, editing.day, amount)}
            onClose={() => setEditing(undefined)}
        />
    );

    return { press, sheet };
}
