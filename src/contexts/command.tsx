import { createContext } from 'react';

import { type Command } from '#utils/command';
import { type WorkItem } from '#utils/types';

export interface CommandContextProps {
    commands: React.MutableRefObject<Command<WorkItem, string>[]>,
    zeitgeist: React.MutableRefObject<number>,
    setCommands: (value: Command<WorkItem, string>[]) => void,
    setZeitgeist: (value: number) => void,
    watch: (command: Command<WorkItem, string>) => void,
    redoable: boolean,
    undoable: boolean,
    inFlight: boolean,
}

const CommandContext = createContext<CommandContextProps>({
    commands: { current: [] },
    zeitgeist: { current: 0 },
    setCommands: () => {
        // eslint-disable-next-line no-console
        console.warn('CommandContext.setCommands called without initializing provider');
    },
    setZeitgeist: () => {
        // eslint-disable-next-line no-console
        console.warn('CommandContext.setZeitgeist called without initializing provider');
    },
    watch: () => {
        // eslint-disable-next-line no-console
        console.warn('CommandContext.watch called without initializing provider');
    },
    undoable: false,
    redoable: false,
    inFlight: false,
});
export default CommandContext;
