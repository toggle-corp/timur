import { createContext } from 'react';

export interface NavbarContextProps {
    startActionsRef: React.RefObject<HTMLDivElement> | undefined;
    midActionsRef: React.RefObject<HTMLDivElement> | undefined;
    endActionsRef: React.RefObject<HTMLDivElement> | undefined;
}

const NavbarContext = createContext<NavbarContextProps>({
    startActionsRef: undefined,
    midActionsRef: undefined,
    endActionsRef: undefined,
});

export default NavbarContext;
