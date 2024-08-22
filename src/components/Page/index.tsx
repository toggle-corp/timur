import {
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import {
    IoList,
    IoMenu,
} from 'react-icons/io5';
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

import styles from './styles.module.css';

interface Props {
    className?: string;
    documentTitle: string;
    startAsideContainerClassName?: string;
    startAsideContent?: React.ReactNode;
    endAsideContainerClassName?: string;
    endAsideContent?: React.ReactNode;
    children: React.ReactNode;
    contentClassName?: string;
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
        endAsideContainerClassName,
        onSwipeLeft,
        onSwipeRight,
    } = props;

    useEffect(() => {
        document.title = documentTitle;
    }, [documentTitle]);

    const { width } = useContext(SizeContext);
    const [startSidebarCollapsed, setStartSidebarCollapsed] = useState(width <= 900);
    const [endSidebarCollapsed, setEndSidebarCollapsed] = useState(true);
    const {
        startActionsRef,
        endActionsRef,
    } = useContext(NavbarContext);

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isNotDefined(containerRef.current)) {
            return undefined;
        }
        const gesture = new TinyGesture(
            containerRef.current,
            {
                mouseSupport: false,
                velocityThreshold: 1,
            },
        );
        const swipeLeftListener = isDefined(onSwipeLeft) ? gesture.on('swipeleft', onSwipeLeft) : undefined;
        const swipeRightListener = isDefined(onSwipeRight) ? gesture.on('swiperight', onSwipeRight) : undefined;

        return () => {
            swipeLeftListener?.cancel();
            swipeRightListener?.cancel();
        };
    }, [onSwipeLeft, onSwipeRight]);

    return (
        <div
            ref={containerRef}
            className={_cs(
                styles.page,
                startSidebarCollapsed && styles.startSidebarCollapsed,
                (endSidebarCollapsed || width <= 900) && styles.endSidebarCollapsed,
                !startSidebarCollapsed && !!startAsideContent && styles.startSidebarVisible,
                !endSidebarCollapsed
                    && !!endAsideContent
                    && width > 900
                    && styles.endSidebarVisible,
                className,
            )}
        >
            {startAsideContent && (
                <Portal container={startActionsRef}>
                    <Button
                        name={!startSidebarCollapsed}
                        onClick={setStartSidebarCollapsed}
                        className={styles.toggleCollapsedButton}
                        variant="tertiary"
                    >
                        <IoMenu className={styles.sidebarIcon} />
                    </Button>
                </Portal>
            )}
            {startAsideContent && (
                <aside className={_cs(styles.startAside, startAsideContainerClassName)}>
                    {startAsideContent}
                </aside>
            )}
            <main className={styles.main}>
                <div className={_cs(styles.content, contentClassName)}>
                    {children}
                </div>
            </main>
            {endAsideContent && width > 900 && (
                <Portal container={endActionsRef}>
                    <Button
                        name={!endSidebarCollapsed}
                        onClick={setEndSidebarCollapsed}
                        variant="tertiary"
                    >
                        <IoList className={styles.sidebarIcon} />
                    </Button>
                </Portal>
            )}
            {endAsideContent && width > 900 && (
                <aside className={_cs(styles.endAside, endAsideContainerClassName)}>
                    {endAsideContent}
                </aside>
            )}
        </div>
    );
}

export default Page;
