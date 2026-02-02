import {
    useMemo,
    useRef,
} from 'react';

import NavbarContext, { NavbarContextProps } from '#contexts/navbar';

interface BaseProps {
    children: React.ReactNode;
}

function NavbarProvider(props: BaseProps) {
    const { children } = props;
    const navbarStartActionRef = useRef<HTMLDivElement>(null);
    const navbarMidActionRef = useRef<HTMLDivElement>(null);
    const navbarEndActionRef = useRef<HTMLDivElement>(null);

    const navbarContextValue = useMemo<NavbarContextProps>(() => ({
        startActionsRef: navbarStartActionRef,
        midActionsRef: navbarMidActionRef,
        endActionsRef: navbarEndActionRef,
    }), []);

    return (
        <NavbarContext.Provider value={navbarContextValue}>
            {children}
        </NavbarContext.Provider>
    );
}

export default NavbarProvider;
