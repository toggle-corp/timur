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
import {
    animate,
    motion,
    useMotionValue,
    useReducedMotion,
} from 'motion/react';
import TinyGesture from 'tinygesture';

import Button from '#components/Button';
import PageHeader from '#components/PageHeader';
import Portal from '#components/Portal';
import NavbarContext from '#contexts/navbar';
import SizeContext from '#contexts/size';
import useDebouncedValue from '#hooks/useDebouncedValue';
import useLocalStorage from '#hooks/useLocalStorage';
import useSetFieldValue from '#hooks/useSetFieldValue';

import styles from './styles.module.css';

// NOTE: Swipes that start here edit a field or act on a dialog, not on the page behind it
const NO_SWIPE_SELECTOR = 'select, [contenteditable], .cm-editor, dialog';
// A text field takes the swipe only while it is being edited
const TEXT_FIELD_SELECTOR = 'input, textarea';
// A swipe this far across the content, or a fast flick past MIN_FLICK_DISTANCE, changes the page
const SWIPE_DISTANCE_SHARE = 0.3;
const MIN_FLICK_DISTANCE = 40;
const FLICK_VELOCITY = 1;

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

function isBeingEdited(field: HTMLInputElement | HTMLTextAreaElement) {
    if (field === document.activeElement) {
        return true;
    }
    try {
        return field.selectionStart !== field.selectionEnd;
    } catch {
        // NOTE: Inputs such as checkboxes have no text selection, and reading it throws
        return false;
    }
}

function canStartSwipe(target: EventTarget | null, container: Element) {
    if (!(target instanceof Element)) {
        return false;
    }
    if (target.closest(NO_SWIPE_SELECTOR) || isInSidewaysScroller(target, container)) {
        return false;
    }
    const field = target.closest<HTMLInputElement | HTMLTextAreaElement>(TEXT_FIELD_SELECTOR);
    return !field || !isBeingEdited(field);
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
    // The page header, shown with a heading
    heading?: React.ReactNode;
    description?: React.ReactNode;
    headerIcons?: React.ReactNode;
    headerActions?: React.ReactNode;
    // In the middle of the navbar, laid out in a row
    navbarActions?: React.ReactNode;
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
        heading,
        description,
        headerIcons,
        headerActions,
        navbarActions,
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
        midActionsRef,
        endActionsRef,
    } = useContext(NavbarContext);

    const mainRef = useRef<HTMLElement>(null);
    const contentX = useMotionValue(0);
    const reduceMotion = useReducedMotion();
    const swipeEnabled = isDefined(onSwipeLeft) || isDefined(onSwipeRight);

    // NOTE: Read through refs so that a new handler on every render does not restart the gesture
    const swipeHandlersRef = useRef({ onSwipeLeft, onSwipeRight });
    useEffect(() => {
        swipeHandlersRef.current = { onSwipeLeft, onSwipeRight };
    }, [onSwipeLeft, onSwipeRight]);

    useEffect(() => {
        const main = mainRef.current;
        if (!swipeEnabled || isNotDefined(main)) {
            return undefined;
        }
        const gesture = new TinyGesture(main, { mouseSupport: false });
        let tracking = false;

        gesture.on('panstart', (event) => {
            tracking = canStartSwipe(event.target, main);
        });
        gesture.on('panmove', () => {
            if (tracking && gesture.swipingDirection === 'horizontal') {
                contentX.set(gesture.touchMoveX ?? 0);
            }
        });
        gesture.on('panend', () => {
            if (!tracking) {
                return;
            }
            tracking = false;
            const distance = gesture.touchMoveX ?? 0;
            const width = main.clientWidth;
            const isSwipe = gesture.swipingDirection === 'horizontal' && (
                Math.abs(distance) > width * SWIPE_DISTANCE_SHARE
                || (
                    Math.abs(distance) > MIN_FLICK_DISTANCE
                    && Math.abs(gesture.velocityX ?? 0) >= FLICK_VELOCITY
                )
            );
            const handler = distance < 0
                ? swipeHandlersRef.current.onSwipeLeft
                : swipeHandlersRef.current.onSwipeRight;
            if (!isSwipe || isNotDefined(handler)) {
                animate(contentX, 0, { type: 'spring', bounce: 0, duration: 0.3 });
                return;
            }
            if (reduceMotion) {
                contentX.jump(0);
                handler();
                return;
            }
            // The content leaves the way it was swiped; the next page enters from the other side
            const direction = Math.sign(distance);
            animate(contentX, direction * width, { duration: 0.15, ease: 'easeIn' }).then(() => {
                handler();
                contentX.jump(-direction * width * 0.25);
                animate(contentX, 0, { duration: 0.2, ease: 'easeOut' });
            });
        });

        return () => {
            gesture.destroy();
        };
    }, [swipeEnabled, contentX, reduceMotion]);

    const debouncedStartSidebarCollapsed = useDebouncedValue(!startSidebarShown, 200);
    const debouncedEndSidebarCollapsed = useDebouncedValue(!endSidebarShown, 200);

    return (
        <div
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
            {navbarActions && (
                <Portal container={midActionsRef}>
                    <div className={styles.navbarActions}>
                        {navbarActions}
                    </div>
                </Portal>
            )}
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
            <main
                ref={mainRef}
                className={_cs(styles.main, contentContainerClassName)}
            >
                <motion.div
                    className={_cs(styles.content, contentClassName)}
                    style={swipeEnabled ? { x: contentX } : undefined}
                >
                    {heading && (
                        <PageHeader
                            heading={heading}
                            description={description}
                            icons={headerIcons}
                            actions={headerActions}
                        />
                    )}
                    {children}
                </motion.div>
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
