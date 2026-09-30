/**
 * The label shown on a bucket list item for who added it: the first letter of
 * their name, or the shortest prefix that tells them apart from the others in
 * `names`. Case is ignored when comparing, so identical names show in full.
 */
export function initials(names: readonly string[]): Map<string, string> {
    const unique = [...new Set(names)];
    return new Map(
        unique.map((name) => {
            const lower = name.toLowerCase();
            const others = unique
                .filter((other) => other !== name)
                .map((other) => other.toLowerCase());
            let length = 1;
            while (
                length < name.length &&
                others.some((other) => other.startsWith(lower.slice(0, length)))
            ) {
                length++;
            }
            const prefix = name.slice(0, length);
            return [name, prefix.charAt(0).toUpperCase() + prefix.slice(1)];
        })
    );
}
