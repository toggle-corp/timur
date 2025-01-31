import { createContext } from 'react';

import { type Command } from '#utils/command';
import { type WorkItem } from '#utils/types';

export interface CommandContextProps {
    commands: React.MutableRefObject<Command<WorkItem, string>[]>,
    zeitgeist: React.MutableRefObject<number>,
    watch: (command: Command<WorkItem, string>) => void,
}

const CommandContext = createContext<CommandContextProps>({
    commands: { current: [] },
    zeitgeist: { current: 0 },
    watch: () => {
        // eslint-disable-next-line no-console
        console.warn('CommandContext.watch called without initializing provider');
    },
});
export default CommandContext;
