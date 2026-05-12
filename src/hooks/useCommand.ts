import {
    useCallback,
    useRef,
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
    initialFilter: (entry: T) => boolean,
    commands: React.MutableRefObject<Command<T, K>[]>,
    zeitgeist: React.MutableRefObject<number>,
    setCommands: (value: Command<T, K>[]) => void,
    setZeitgeist: (value: number) => void,
    watch: (command: Command<T, K>) => void,
}) {
    const {
        defaultEntries,
        keySelector,
        initialFilter,
        commands,
        zeitgeist,
        watch,
        setZeitgeist,
        setCommands,
    } = props;

    const entriesRef = useRef<T[]>([]);
    const [entries, setEntries] = useState<T[]>(() => {
        const newEntries = initializeEntries({
            entries: defaultEntries,
            keySelector,
            filter: initialFilter,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            commands: commands.current!,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            zeitgeist: zeitgeist.current!,
        });
        entriesRef.current = newEntries;
        return newEntries;
    });

    const handleEntriesSet = useCallback(
        (e: T[], filter: (entry: T) => boolean) => {
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
            entriesRef.current = newEntries;
        },
        [commands, keySelector, zeitgeist],
    );

    const handleRedo = useCallback(
        (filter: (entry: T) => boolean) => {
            const newState = forward(
                {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    commands: commands.current!,
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    zeitgeist: zeitgeist.current!,
                    watch,
                    entries: entriesRef.current,
                    keySelector,
                },
                1,
            );
            setZeitgeist(newState.zeitgeist);
            setEntries(newState.entries.filter(filter));
            entriesRef.current = newState.entries;
        },
        [commands, keySelector, watch, zeitgeist, setZeitgeist],
    );

    const handleUndo = useCallback(
        (filter: (entry: T) => boolean) => {
            const newState = backward(
                {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    commands: commands.current!,
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    zeitgeist: zeitgeist.current!,
                    watch,
                    entries: entriesRef.current,
                    keySelector,
                },
                1,
            );
            setEntries(newState.entries.filter(filter));
            entriesRef.current = newState.entries;
            setZeitgeist(newState.zeitgeist);
        },
        [commands, keySelector, watch, zeitgeist, setZeitgeist],
    );

    const handleUpdate = useCallback(
        (command: Command<T, K>, filter: (entry: T) => boolean) => {
            const newState = act(
                {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    commands: commands.current!,
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    zeitgeist: zeitgeist.current!,
                    watch,
                    entries: entriesRef.current,
                    keySelector,
                },
                command,
            );
            setEntries(newState.entries.filter(filter));
            entriesRef.current = newState.entries;
            setZeitgeist(newState.zeitgeist);
            setCommands(newState.commands);
        },
        [commands, keySelector, setCommands, setZeitgeist, watch, zeitgeist],
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
