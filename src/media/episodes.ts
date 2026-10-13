/**
 * What a tap on an episode dot changes on a series season.
 */

import type { Title } from '@/hooks/use-titles';

export type EpisodeChanges = Pick<Title, 'watched'> &
    Partial<Pick<Title, 'status' | 'endDate'>>;

/**
 * Episodes are watched in order, so tapping `episode` marks every one up to
 * it. Tapping the last one marked steps back by one. Reaching the last
 * episode finishes the season, ending it `today` unless it has an end date.
 */
export function tapEpisode(
    title: Pick<Title, 'episodes' | 'watched' | 'endDate'>,
    episode: number,
    today: string
): EpisodeChanges {
    const watched = episode === title.watched ? episode - 1 : episode;
    if (watched !== title.episodes) return { watched };
    return { watched, status: 'done', endDate: title.endDate ?? today };
}
