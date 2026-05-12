import {
    Suspense,
    useDeferredValue,
    useMemo,
} from 'react';
import {
    RiSettingsLine,
    RiTerminalBoxLine,
} from 'react-icons/ri';

import Button from '#components/Button';
import Link from '#components/Link';
import MonthlyCalendar from '#components/MonthlyCalendar';
import useGoogleCalendar from '#hooks/useGoogleCalendar';
import { type WorkItem } from '#utils/types';

import DayEventChipsSection from './DayEventChipsSection';
import GoogleCalendarSection from './GoogleCalendarSection';

import styles from './styles.module.css';

interface Props {
    selectedDate: string;
    setSelectedDate: (newDate: string) => void;
    onWorkItemCreateFromCalendar: (override: Partial<WorkItem>) => void;
    onShortcutsClick: () => void;
    dayWorkItems: WorkItem[];
    lastEditedAt: number | null;
}

function StartSidebar(props: Props) {
    const {
        selectedDate,
        setSelectedDate,
        onShortcutsClick,
        onWorkItemCreateFromCalendar,
        dayWorkItems,
        lastEditedAt,
    } = props;

    const deferredSelectedDate = useDeferredValue(selectedDate);

    const { isConnected: isGoogleCalendarConnected } = useGoogleCalendar();

    const googleEnabled = isGoogleCalendarConnected;

    const addedDescriptions = useMemo(() => {
        const set = new Set<string>();
        dayWorkItems.forEach((item) => {
            if (item.description) {
                set.add(item.description.trim().toLowerCase());
            }
        });
        return set;
    }, [dayWorkItems]);

    return (
        <div className={styles.startSidebar}>
            <MonthlyCalendar
                selectedDate={selectedDate}
                onDateClick={setSelectedDate}
                lastEditedAt={lastEditedAt}
            />
            <Suspense fallback={null}>
                <DayEventChipsSection
                    loading={selectedDate !== deferredSelectedDate}
                    selectedDate={deferredSelectedDate}
                />
                {googleEnabled && (
                    <GoogleCalendarSection
                        loading={selectedDate !== deferredSelectedDate}
                        date={deferredSelectedDate}
                        addedDescriptions={addedDescriptions}
                        onWorkItemCreateFromCalendar={onWorkItemCreateFromCalendar}
                    />
                )}
            </Suspense>
            <div className={styles.bottomActions}>
                <Button
                    name={undefined}
                    className={styles.desktopOnly}
                    onClick={onShortcutsClick}
                    title="Show shortcuts"
                    variant="tertiary"
                    icons={<RiTerminalBoxLine />}
                >
                    Shortcuts
                </Button>
                <Link
                    to="settings"
                    title="Settings"
                    variant="tertiary"
                    icons={<RiSettingsLine />}
                >
                    Settings
                </Link>
            </div>
        </div>
    );
}

export default StartSidebar;
