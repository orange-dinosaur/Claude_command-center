/**
 * Small helpers for calling the API routes from the app.
 */

/** The JSON of a successful answer. Any other answer rejects. */
export const json = (res: Response) => (res.ok ? res.json() : Promise.reject());
