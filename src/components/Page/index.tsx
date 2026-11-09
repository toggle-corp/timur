import {
    useCallback,
    useContext,
    useEffect,
    useRef,
} from 'react';
import {
    RiArrowLeftSLine,
    RiArrowRightSLine,
    RiListUnordered,
    RiMenuLine,
} from 'react-icons/ri';
import { unstable_useBlocker as useBlocker } from 'react-router-dom';
import {
    _cs,
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';
import TinyGesture from 'tinygesture';

import Button from '#components/Button';
import Portal from '#components/Portal';
import NavbarContext from '#contexts/navbar';
import SizeContext from '#contexts/size';
import useDebouncedValue from '#hooks/useDebouncedValue';
import useLocalStorage from '#hooks/useLocalStorage';
import useSetFieldValue from '#hooks/useSetFieldValue';

import styles from './styles.module.css';

// NOTE: Swipes that start here edit a field or act on a dialog, not on the page behind it
const NO_SWIPE_SELECTOR = 'input, textarea, select, [contenteditable], .cm-editor, dialog';

// NOTE: A sideways drag inside a horizontal scroller pans it
function isInSidewaysScroller(element: Element, container: Element) {
    let current: Element | null = element;
    while (current && current !== container) {
        const { overflowX } = getComputedStyle(current);
        if (
            (overflowX === 'auto' || overflowX === 'scroll')
            && current.scrollWidth > current.clientWidth
        ) {
            return true;
        }
        current = current.parentElement;
    }
    return false;
}

// Swipe events carry the touchend, whose target is the element where the touch started
function filterSwipe(container: Element, handler: () => void) {
    return (event: MouseEvent | TouchEvent) => {
        const { target } = event;
        if (
            target instanceof Element
            && (target.closest(NO_SWIPE_SELECTOR) || isInSidewaysScroller(target, container))
        ) {
            return;
        }
        handler();
    };
}

interface Props {
    className?: string;
    documentTitle: string;
    startAsideContainerClassName?: string;
    startAsideContent?: React.ReactNode;
    endAsideContainerClassName?: string;
    endAsideContent?: React.ReactNode;
    children: React.ReactNode;
    contentClassName?: string;
    contentContainerClassName?: string;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
}

function Page(props: Props) {
    const {
        className,
        documentTitle,
        startAsideContent,
        startAsideContainerClassName,
        endAsideContent,
        children,
        contentClassName,
        contentContainerClassName,
        endAsideContainerClassName,
        onSwipeLeft,
        onSwipeRight,
    } = props;

    const { screen } = useContext(SizeContext);

    const [storedConfig, setStoredConfig] = useLocalStorage('timur-config');

    const {
        startSidebarShown,
        endSidebarShown,
    } = storedConfig;

    const setFieldValue = useSetFieldValue(setStoredConfig);

    const handleStartSidebarToggle = useCallback(
        (newValue: boolean) => setFieldValue(newValue, 'startSidebarShown'),
        [setFieldValue],
    );
    const handleEndSidebarToggle = useCallback(
        (newValue: boolean) => setFieldValue(newValue, 'endSidebarShown'),
        [setFieldValue],
    );

    const shouldBlockBack = screen === 'mobile' && startSidebarShown && !!startAsideContent;
    const backBlocker = useBlocker(
        useCallback(
            ({ historyAction }: { historyAction: string }) => (
                shouldBlockBack && historyAction === 'POP'
            ),
            [shouldBlockBack],
        ),
    );

    useEffect(() => {
        if (backBlocker.state === 'blocked') {
            setFieldValue(false, 'startSidebarShown');
            backBlocker.reset();
        }
    }, [backBlocker, setFieldValue]);

    useEffect(() => {
        document.title = documentTitle;
    }, [documentTitle]);

    const {
        startActionsRef,
        endActionsRef,
    } = useContext(NavbarContext);

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (isNotDefined(container)) {
            return undefined;
        }
        const gesture = new TinyGesture(
            container,
            {
                mouseSupport: false,
                velocityThreshold: 1,
            },
        );
        if (isDefined(onSwipeLeft)) {
            gesture.on('swipeleft', filterSwipe(container, onSwipeLeft));
        }
        if (isDefined(onSwipeRight)) {
            gesture.on('swiperight', filterSwipe(container, onSwipeRight));
        }

        return () => {
            gesture.destroy();
        };
    }, [onSwipeLeft, onSwipeRight]);

    const debouncedStartSidebarCollapsed = useDebouncedValue(!startSidebarShown, 200);
    const debouncedEndSidebarCollapsed = useDebouncedValue(!endSidebarShown, 200);

    return (
        <div
            ref={containerRef}
            className={_cs(
                styles.page,
                !startSidebarShown && styles.startSidebarCollapsed,
                debouncedStartSidebarCollapsed && styles.debouncedStartSidebarCollapsed,
                debouncedEndSidebarCollapsed && styles.debouncedEndSidebarCollapsed,
                (!endSidebarShown || screen === 'mobile') && styles.endSidebarCollapsed,
                startSidebarShown && !!startAsideContent && styles.startSidebarVisible,
                endSidebarShown
                    && !!endAsideContent
                    && screen === 'desktop'
                    && styles.endSidebarVisible,
                className,
            )}
        >
            {startAsideContent && (
                <Portal container={startActionsRef}>
                    <Button
                        name={!startSidebarShown}
                        onClick={handleStartSidebarToggle}
                        className={styles.toggleCollapsedButton}
                        variant="transparent"
                        title="Toggle left pane"
                    >
                        <RiMenuLine className={styles.sidebarIcon} />
                    </Button>
                </Portal>
            )}
            {startAsideContent && (
                <aside className={_cs(styles.startAside, startAsideContainerClassName)}>
                    <div className={styles.startAsideInner}>
                        {startAsideContent}
                    </div>
                    {startSidebarShown && (
                        <Button
                            name={false}
                            onClick={handleStartSidebarToggle}
                            className={styles.closeLeftPaneButton}
                            variant="tertiary"
                            title="Close left pane"
                            spacing="sm"
                        >
                            <RiArrowLeftSLine />
                        </Button>
                    )}
                </aside>
            )}
            <main className={_cs(styles.main, contentContainerClassName)}>
                <div className={_cs(styles.content, contentClassName)}>
                    {children}
                </div>
            </main>
            {endAsideContent && screen === 'desktop' && (
                <Portal container={endActionsRef}>
                    <Button
                        name={!endSidebarShown}
                        onClick={handleEndSidebarToggle}
                        className={styles.toggleCollapsedButton}
                        variant="transparent"
                        title="Toggle right pane"
                    >
                        <RiListUnordered className={styles.sidebarIcon} />
                    </Button>
                </Portal>
            )}
            {endAsideContent && screen === 'desktop' && (
                <aside className={_cs(styles.endAside, endAsideContainerClassName)}>
                    <div className={styles.endAsideInner}>
                        {endAsideContent}
                    </div>
                    {endSidebarShown && (
                        <Button
                            name={false}
                            onClick={handleEndSidebarToggle}
                            className={styles.closeRightPaneButton}
                            variant="tertiary"
                            title="Close right pane"
                            spacing="sm"
                        >
                            <RiArrowRightSLine />
                        </Button>
                    )}
                </aside>
            )}
        </div>
    );
}

export default Page;
