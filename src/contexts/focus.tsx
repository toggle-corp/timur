import { createContext } from 'react';

interface FocusContextProps {
    register: (key: string, inputRef: React.RefObject<HTMLElement>) => void;
    unregister: (key: string) => void;
}

const FocusContext = createContext<FocusContextProps>({
    register: () => {
        // eslint-disable-next-line no-console
        console.warn('FocusContext::register called without provider');
    },
    unregister: () => {
        // eslint-disable-next-line no-console
        console.warn('FocusContext::unregister called without provider');
    },
});

export default FocusContext;
