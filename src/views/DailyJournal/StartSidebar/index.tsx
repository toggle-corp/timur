import {
    useCallback,
    useContext,
} from 'react';
import {
    isDefined,
    isFalsyString,
    isNotDefined,
    listToGroupList,
    mapToList,
} from '@togglecorp/fujs';

import Button from '#components/Button';
import Checkbox from '#components/Checkbox';
import Link from '#components/Link';
import MonthlyCalendar from '#components/MonthlyCalendar';
import SelectInput from '#components/SelectInput';
import EnumsContext from '#contexts/enums';
import { EnumsQuery } from '#generated/types/graphql';
import useLocalStorage from '#hooks/useLocalStorage';
import useSetFieldValue from '#hooks/useSetFieldValue';
import {
    defaultConfigValue,
    KEY_CONFIG_STORAGE,
} from '#utils/constants';
import {
    ConfigStorage,
    EditingMode,
    WorkItem,
    WorkItemStatus,
} from '#utils/types';

import styles from './styles.module.css';

type EditingOption = { key: EditingMode, label: string };
function editingOptionKeySelector(item: EditingOption) {
    return item.key;
}
function editingOptionLabelSelector(item: EditingOption) {
    return item.label;
}
const editingOptions: EditingOption[] = [
    { key: 'normal', label: 'Normies' },
    { key: 'vim', label: 'Vim Masterace' },
];

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
    workItems: WorkItem[];
    selecteDate: string;
    setSelectedDate: (newDate: string) => void;
}

function StartSidebar(props: Props) {
    const {
        workItems,
        selecteDate,
        setSelectedDate,
    } = props;

    const { taskById } = useContext(EnumsContext);
    const { enums } = useContext(EnumsContext);

    const [storedConfig, setStoredConfig] = useLocalStorage<ConfigStorage>(
        KEY_CONFIG_STORAGE,
        defaultConfigValue,
    );

    const setConfigFieldValue = useSetFieldValue(setStoredConfig);

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

    const date = new Date(selecteDate);

    return (
        <div
            className={styles.startSidebar}
        >
            <MonthlyCalendar
                className={styles.calendar}
                year={date.getFullYear()}
                month={date.getMonth()}
                onDateClick={setSelectedDate}
            />
            <div className={styles.actions}>
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
                <Link
                    to="dailyJournal"
                    variant="secondary"
                >
                    Go to today
                </Link>
                <Button
                    name={undefined}
                    onClick={handleCopyTextButtonClick}
                    variant="secondary"
                    disabled={workItems.length === 0}
                    title="Copy standup text"
                >
                    Copy standup text
                </Button>
            </div>
            <div className={styles.quickSettings}>
                <Checkbox
                    name="showInputIcons"
                    label="Show input icons"
                    value={storedConfig.showInputIcons}
                    onChange={setConfigFieldValue}
                />
                <Checkbox
                    name="checkboxForStatus"
                    label="Use checkbox for status"
                    tooltip="Use checkbox instead of select input for the status. i.e. to toggle TODO, Doing and Done"
                    value={storedConfig.checkboxForStatus}
                    onChange={setConfigFieldValue}
                />
                <SelectInput
                    name="defaultTaskStatus"
                    variant="general"
                    label="Default Status"
                    options={enums?.enums.TimeEntryStatus}
                    keySelector={workItemStatusKeySelector}
                    labelSelector={workItemStatusLabelSelector}
                    onChange={setConfigFieldValue}
                    value={storedConfig.defaultTaskStatus}
                    nonClearable
                />
                <SelectInput
                    name="defaultTaskType"
                    label="Default Type"
                    variant="general"
                    options={enums?.enums.TimeEntryType}
                    keySelector={workItemTypeKeySelector}
                    labelSelector={workItemTypeLabelSelector}
                    onChange={setConfigFieldValue}
                    value={storedConfig.defaultTaskType}
                    nonClearable
                />
                <SelectInput
                    name="editingMode"
                    label="Editing Mode"
                    variant="general"
                    options={editingOptions}
                    keySelector={editingOptionKeySelector}
                    labelSelector={editingOptionLabelSelector}
                    onChange={setConfigFieldValue}
                    value={storedConfig.editingMode}
                    nonClearable
                />
            </div>
        </div>
    );
}

export default StartSidebar;
