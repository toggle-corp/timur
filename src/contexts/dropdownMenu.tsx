import { createContext } from 'react';

interface DropdownMenuContextProps {
    closePopover: () => void;
}

const DropdownMenuContext = createContext<DropdownMenuContextProps>({
    closePopover: () => {
        // eslint-disable-next-line no-console
        console.warn('DropdownMenuContext::closePopover called without a provider');
    },
});

export default DropdownMenuContext;
