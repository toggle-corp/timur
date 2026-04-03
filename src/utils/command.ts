export interface AddCommand<T, K> {
    type: 'add',
    key: K;
    newValue: T;
    timestamp: number;
}

export interface EditCommand<T, K> {
    type: 'edit',
    key: K;
    oldValue: Partial<T>;
    newValue: Partial<T>;
    timestamp: number;
}

export interface DeleteCommand<T, K> {
    type: 'delete',
    key: K;
    oldValue: T;
    timestamp: number;
}

export type Command<T, K> = AddCommand<T, K> | EditCommand<T, K> | DeleteCommand<T, K>;

interface State<E, K> {
    entries: E[],
    commands: Command<E, K>[],
    zeitgeist: number;
    keySelector: (item: E) => K,

    watch: ((item: Command<E, K>) => void) | undefined,
}

export function forward<E, K>(state: State<E, K>, to: number): State<E, K> {
    const {
        entries,
        commands,
        zeitgeist,
        keySelector,
        watch,
    } = state;

    const newEntries = [...entries];
    const newZeitgeist = zeitgeist + to;

    if (newZeitgeist > commands.length) {
        // eslint-disable-next-line no-console
        console.error('Cannot go forward');
        return state;
    }

    commands.slice(zeitgeist, newZeitgeist).forEach((command) => {
        if (command.type === 'add') {
            // NOTE: Need to check if adding a item with duplicate key
            // When chaning page, we get the same entry from server and from the commands causing
            if (!newEntries.find((entry) => keySelector(entry) === keySelector(command.newValue))) {
                newEntries.push(command.newValue);
                watch?.(command);
            }
        } else if (command.type === 'delete') {
            const index = newEntries.findIndex((item) => keySelector(item) === command.key);
            if (index === -1) {
                // eslint-disable-next-line no-console
                console.error(`Could not find item ${command.key} while deleting`);
                return;
            }
            newEntries.splice(index, 1);
            watch?.(command);
        } else if (command.type === 'edit') {
            const index = newEntries.findIndex((item) => keySelector(item) === command.key);
            if (index === -1) {
                // eslint-disable-next-line no-console
                console.error(`Could not find item ${command.key} while editing`);
                return;
            }
            newEntries[index] = {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                ...newEntries[index]!,
                ...command.newValue,
            };
            watch?.(command);
        }
    });

    const newState = {
        ...state,
        entries: newEntries,
        zeitgeist: newZeitgeist,
    };
    return newState;
}

export function backward<E, K>(state: State<E, K>, to: number): State<E, K> {
    const {
        entries,
        commands,
        zeitgeist,
        keySelector,
        watch,
    } = state;

    const newZeitgeist = zeitgeist - to;

    if (newZeitgeist < 0) {
        // eslint-disable-next-line no-console
        console.error('Cannot go backward');
        return state;
    }

    const newEntries = [...entries];

    commands.slice(newZeitgeist, zeitgeist).reverse().forEach((command) => {
        if (command.type === 'delete') {
            newEntries.push(command.oldValue);
            watch?.({
                type: 'add',
                key: command.key,
                newValue: command.oldValue,
                timestamp: new Date().getTime(),
            });
        } else if (command.type === 'add') {
            const index = newEntries.findIndex((item) => keySelector(item) === command.key);
            if (index === -1) {
                // eslint-disable-next-line no-console
                console.error(`Could not find item ${command.key} while deleting`);
                return;
            }
            newEntries.splice(index, 1);
            watch?.({
                type: 'delete',
                key: command.key,
                oldValue: command.newValue,
                timestamp: new Date().getTime(),
            });
        } else if (command.type === 'edit') {
            const index = newEntries.findIndex((item) => keySelector(item) === command.key);
            if (index === -1) {
                // eslint-disable-next-line no-console
                console.error(`Could not find item ${command.key} while editing`);
                return;
            }
            newEntries[index] = {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                ...newEntries[index]!,
                ...command.oldValue,
            };
            watch?.({
                type: 'edit',
                key: command.key,
                oldValue: command.newValue,
                newValue: command.oldValue,
                timestamp: new Date().getTime(),
            });
        }
    });

    const newState = {
        ...state,
        entries: newEntries,
        zeitgeist: newZeitgeist,
    };
    return newState;
}

function isMergeable<E, K>(foo: Command<E, K>, bar: Command<E, K>) {
    return (
        foo.type === bar.type
        && foo.key === bar.key
        && Math.abs(foo.timestamp - bar.timestamp) <= 300
    );
}

function squash<T>(foo: T[]) {
    if (foo.length <= 0) {
        return undefined;
    }
    return foo.reduce((acc, val) => ({
        ...acc,
        ...val,
    }), foo[0]);
}

export function act<E, K>(state: State<E, K>, command: Command<E, K>): State<E, K> {
    const {
        commands,
        zeitgeist,
    } = state;

    const newHistory = [
        ...commands.slice(0, zeitgeist),
        command,
    ];

    const newState = forward({
        ...state,
        commands: newHistory,
    }, 1);

    if (newState.commands.length < 2) {
        return newState;
    }

    // NOTE: We want to merge similar actions so that we do not have a lot of actions.
    let cursor = newState.commands.length - 1;
    do {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const currentElement = newState.commands[cursor]!;
        const prevElement = newState.commands[cursor - 1];
        if (!prevElement) {
            break;
        }
        const shouldContinue = isMergeable(
            prevElement,
            currentElement,
        );
        if (!shouldContinue) {
            break;
        }
        cursor -= 1;
    } while (cursor >= 0);

    if (cursor === newState.commands.length - 1) {
        return newState;
    }

    // NOTE: These are all update actions only
    const mergedAction: EditCommand<E, K> = {
        type: 'edit',
        oldValue: squash(
            newState.commands
                .slice(cursor, newState.commands.length)
                .reverse()
                // FIXME: Need to add cast here
                .map((c) => (c as EditCommand<E, K>).oldValue),
        ) ?? ({} as Partial<E>),
        newValue: squash(
            newState.commands
                .slice(cursor, newState.commands.length)
                // FIXME: Need to add cast here
                .map((c) => (c as EditCommand<E, K>).newValue),
        ) ?? ({} as Partial<E>),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        key: newState.commands[newState.commands.length - 1]!.key,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        timestamp: newState.commands[newState.commands.length - 1]!.timestamp,
    };

    const actualCommands = [...newState.commands.slice(0, cursor), mergedAction];
    const actualZeitgeist = cursor + 1;

    const newestState = {
        ...newState,
        commands: actualCommands,
        zeitgeist: actualZeitgeist,
    };

    return newestState;
}

export function pick<O, K extends keyof O>(obj: O, keys: K[]): Partial<O> {
    return keys.reduce((acc, key) => ({
        ...acc,
        [key]: obj[key],
    }), {});
}
