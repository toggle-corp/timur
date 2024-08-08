export type PurgeNull<T> = (
    T extends (infer Z)[]
        ? PurgeNull<Z>[]
        : (
            T extends object
                ? { [K in keyof T]: PurgeNull<T[K]> }
                : (T extends null ? undefined : T)
        )
)

export function removeNull<T>(
    data: T,
    ignoreKeys?: string[] | null | undefined,
): PurgeNull<T>;
