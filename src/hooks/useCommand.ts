import {
    useCallback,
    useState,
} from 'react';

import {
    act,
    backward,
    Command,
    forward,
} from '#utils/command';

function initializeEntries<T, K>(args: {
    commands: Command<T, K>[],
    zeitgeist: number,
    entries: T[],
    keySelector: (entry: T) => K,
    filter: (entry: T) => boolean,
}) {
    const {
        commands,
        zeitgeist,
        entries,
        filter,
        keySelector,
    } = args;

    let currentEntries = entries;

    // NOTE: When setting up, we need to apply all the commands
    if (commands && commands.length > 0) {
        const { entries: newEntries } = forward<T, K>({
            entries,
            commands,
            keySelector,
            // We are applying the commands from 0 to zeitgeist
            zeitgeist: 0,
            watch: undefined,
        }, zeitgeist);

        currentEntries = newEntries;
    }

    // NOTE: After that we need to also clear out entries that do no match
    if (filter && currentEntries.length > 0) {
        currentEntries = currentEntries.filter(filter);
    }

    return currentEntries;
}

function useCommand<T, K>(props: {
    defaultEntries: T[],
    keySelector: (entry: T) => K,
    filter: (entry: T) => boolean,
    commands: React.MutableRefObject<Command<T, K>[]>,
    zeitgeist: React.MutableRefObject<number>,
    watch: (command: Command<T, K>) => void,
}) {
    const {
        defaultEntries,
        keySelector,
        filter,
        commands,
        zeitgeist,
        watch,
    } = props;

    const [entries, setEntries] = useState<T[]>(() => {
        const newEntries = initializeEntries({
            entries: defaultEntries,
            keySelector,
            filter,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            commands: commands.current!,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            zeitgeist: zeitgeist.current!,
        });
        return newEntries;
    });

    const handleEntriesSet = useCallback(
        (e: T[]) => {
            const newEntries = initializeEntries({
                entries: e,
                keySelector,
                filter,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                commands: commands.current!,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                zeitgeist: zeitgeist.current!,
            });
            setEntries(newEntries);
        },
        [commands, filter, keySelector, zeitgeist],
    );

    const handleRedo = useCallback(
        () => {
            const newState = forward(
                {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    commands: commands.current!,
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    zeitgeist: zeitgeist.current!,
                    watch,
                    entries,
                    keySelector,
                },
                1,
            );
            zeitgeist.current = newState.zeitgeist;
            setEntries(newState.entries);
        },
        [commands, entries, keySelector, watch, zeitgeist],
    );

    const handleUndo = useCallback(
        () => {
            const newState = backward(
                {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    commands: commands.current!,
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    zeitgeist: zeitgeist.current!,
                    watch,
                    entries,
                    keySelector,
                },
                1,
            );
            zeitgeist.current = newState.zeitgeist;
            setEntries(newState.entries);
        },
        [commands, entries, keySelector, watch, zeitgeist],
    );

    const handleUpdate = useCallback(
        (command: Command<T, K>) => {
            // TODO: Debounce this if id and type is the same and also check temporal
            const newState = act(
                {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    commands: commands.current!,
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    zeitgeist: zeitgeist.current!,
                    watch,
                    entries,
                    keySelector,
                },
                command,
            );
            zeitgeist.current = newState.zeitgeist;
            commands.current = newState.commands;
            setEntries(newState.entries);
        },
        [commands, entries, keySelector, watch, zeitgeist],
    );

    return {
        entries,
        setEntries: handleEntriesSet,
        undo: handleUndo,
        redo: handleRedo,
        update: handleUpdate,
    };
}

export default useCommand;
