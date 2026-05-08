import { createContext } from 'react';

export interface NavbarContextProps {
    startActionsRef: React.RefObject<HTMLDivElement | null> | undefined;
    midActionsRef: React.RefObject<HTMLDivElement | null> | undefined;
    endActionsRef: React.RefObject<HTMLDivElement | null> | undefined;
}

const NavbarContext = createContext<NavbarContextProps>({
    startActionsRef: undefined,
    midActionsRef: undefined,
    endActionsRef: undefined,
});

export default NavbarContext;
