import {
    useCallback,
    useContext,
} from 'react';
import {
    IoCalendar,
    IoChevronBackSharp,
    IoChevronForwardSharp,
    IoCodeSlash,
} from 'react-icons/io5';
import {
    encodeDate,
    isDefined,
    isFalsyString,
    isNotDefined,
    listToGroupList,
    mapToList,
} from '@togglecorp/fujs';

import Button from '#components/Button';
import Checkbox from '#components/Checkbox';
import RadioInput from '#components/RadioInput';
import EnumsContext from '#contexts/enums';
import { EnumsQuery } from '#generated/types/graphql';
import useLocalStorage from '#hooks/useLocalStorage';
import useSetFieldValue from '#hooks/useSetFieldValue';
import { addDays } from '#utils/common';
import {
    defaultConfigValue,
    KEY_CONFIG_STORAGE,
    KEY_DATA_STORAGE_OLD,
} from '#utils/constants';
import { getFromStorage } from '#utils/localStorage';
import {
    ConfigStorage,
    WorkItem,
    WorkItemStatus,
} from '#utils/types';

import styles from './styles.module.css';

type WorkItemTypeOption = EnumsQuery['enums']['TimeEntryType'][number];
function workItemTypeKeySelector(item: WorkItemTypeOption) {
    return item.key;
}
function workItemTypeLabelSelector(item: WorkItemTypeOption) {
    return item.label;
}

type WorkItemStatusOption = EnumsQuery['enums']['TimeEntryStatus'][number];
function workItemStatusKeySelector(item: WorkItemStatusOption) {
    return item.key;
}
function workItemStatusLabelSelector(item: WorkItemStatusOption) {
    return item.label;
}

interface Props {
    selectedDate: string,
    setSelectedDate: React.Dispatch<React.SetStateAction<string>>;
    workItems: WorkItem[];
    onAddEntryClick: () => void;
}

function StartSidebar(props: Props) {
    const {
        selectedDate,
        setSelectedDate,
        workItems,
        onAddEntryClick,
    } = props;

    const { taskById } = useContext(EnumsContext);
    const { enums } = useContext(EnumsContext);

    // NOTE: We cannot put this outside the component.
    const today = new Date();

    const [storedConfig, setStoredConfig] = useLocalStorage<ConfigStorage>(
        KEY_CONFIG_STORAGE,
        defaultConfigValue,
    );

    const setConfigFieldValue = useSetFieldValue(setStoredConfig);

    const handleExportButtonClick = useCallback(() => {
        const prevData = getFromStorage(KEY_DATA_STORAGE_OLD);
        window.navigator.clipboard.writeText(JSON.stringify(prevData));
    }, []);

    const handleTodaySelection = useCallback(
        () => {
            setSelectedDate(encodeDate(new Date()));
        },
        [setSelectedDate],
    );

    const handleCopyTextButtonClick = useCallback(
        () => {
            function toSubItem(workItem: WorkItem) {
                const description = workItem.description ?? '??';
                const status: WorkItemStatus = workItem.status ?? 'TODO';
                const task = taskById?.[workItem.task]?.name ?? '??';

                return description
                    .split('\n')
                    .map((item, i) => ([
                        i === 0 ? '  -' : '   ',
                        status !== 'DONE' ? `\`${status.toUpperCase()}\`` : undefined,
                        i === 0 ? `${task}: ${item}` : item,
                    ].filter(isDefined).join(' ')))
                    .join('\n');
            }

            if (isNotDefined(taskById)) {
                return;
            }

            const groupedWorkItems = mapToList(listToGroupList(
                workItems,
                (workItem) => taskById[workItem.task].contract.project.id,
                undefined,
                (list) => ({
                    project: taskById?.[list[0].task].contract.project,
                    workItems: list,
                }),
            ));

            const text = groupedWorkItems.map((projectGrouped) => {
                const { project, workItems: projectWorkItems } = projectGrouped;

                return `- ${project.name}\n${projectWorkItems.map((workItem) => toSubItem(workItem)).join('\n')}`;
            }).join('\n');

            if (isFalsyString(text)) {
                return;
            }

            window.navigator.clipboard.writeText(text);
        },
        [workItems, taskById],
    );

    const handleDateSelection = useCallback(
        (value: string | undefined) => {
            // NOTE: We do not reset selected date
            if (value) {
                setSelectedDate(value);
            }
        },
        [setSelectedDate],
    );

    return (
        <div
            className={styles.startSidebar}
        >
            <div className={styles.dateNavigation}>
                <Button
                    name={addDays(selectedDate, -1)}
                    onClick={handleDateSelection}
                    variant="secondary"
                    title="Previous day"
                    spacing="sm"
                >
                    <IoChevronBackSharp />
                </Button>
                <Button
                    name={addDays(selectedDate, 1)}
                    onClick={handleDateSelection}
                    variant="secondary"
                    title="Next day"
                    spacing="sm"
                >
                    <IoChevronForwardSharp />
                </Button>
                <Button
                    name={undefined}
                    onClick={handleTodaySelection}
                    variant="secondary"
                    disabled={selectedDate === encodeDate(today)}
                    spacing="sm"
                >
                    Today
                </Button>
            </div>
            <div className={styles.calendar}>
                <IoCalendar />
            </div>
            <div className={styles.actions}>
                <Button
                    name={undefined}
                    onClick={handleExportButtonClick}
                    variant="tertiary"
                    spacing="sm"
                    icons={<IoCodeSlash />}
                >
                    Copy data
                </Button>
                {/*
                <Button
                    name
                    onClick={handleShortcutsButtonClick}
                    variant="secondary"
                    title="Open shortcuts"
                    spacing="sm"
                    icons={(
                        <IoInformation />
                    )}
                >
                    Shortcuts
                </Button>
                        */}
                <Button
                    name={undefined}
                    onClick={handleCopyTextButtonClick}
                    variant="tertiary"
                    disabled={workItems.length === 0}
                >
                    Copy standup text
                </Button>
                {/*
                <Button
                    name
                    onClick={handleNoteUpdateClick}
                    variant="secondary"
                >
                    {currentNote && !!currentNote.content
                        ? 'Edit notes'
                        : 'Add notes'}
                </Button>
                */}
            </div>
            <div className={styles.quickSettings}>
                <Checkbox
                    name="showInputIcons"
                    label="Show input icons"
                    value={storedConfig.showInputIcons}
                    onChange={setConfigFieldValue}
                />
                <Checkbox
                    name="focusMode"
                    label="Enable focus mode"
                    tooltip="Focus mode will remove all of the visual distraction from the page and allows you to focus on writing the journal"
                    value={storedConfig.focusMode}
                    onChange={setConfigFieldValue}
                />
                <Checkbox
                    name="checkboxForStatus"
                    label="Use checkbox for status"
                    tooltip="Use checkbox instead of select input for the status. i.e. to toggle TODO, Doing and Done"
                    value={storedConfig.checkboxForStatus}
                    onChange={setConfigFieldValue}
                />
                <Checkbox
                    name="allowMultipleEntry"
                    label="Allow multiple entry"
                    onChange={setConfigFieldValue}
                    value={storedConfig.allowMultipleEntry}
                />
                <RadioInput
                    name="defaultTaskStatus"
                    label="Default Status"
                    options={enums?.enums.TimeEntryStatus}
                    keySelector={workItemStatusKeySelector}
                    labelSelector={workItemStatusLabelSelector}
                    onChange={setConfigFieldValue}
                    value={storedConfig.defaultTaskStatus}
                />
                <RadioInput
                    name="defaultTaskType"
                    label="Default Type"
                    options={enums?.enums.TimeEntryType}
                    keySelector={workItemTypeKeySelector}
                    labelSelector={workItemTypeLabelSelector}
                    onChange={setConfigFieldValue}
                    value={storedConfig.defaultTaskType}
                    listContainerClassName={styles.typeOptionList}
                />
            </div>
            <Button
                name
                onClick={onAddEntryClick}
            >
                Add entry
            </Button>
        </div>
    );
}

export default StartSidebar;
