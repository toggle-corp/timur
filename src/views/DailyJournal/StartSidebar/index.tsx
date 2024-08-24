import {
    useCallback,
    useContext,
} from 'react';
import { IoCalendar } from 'react-icons/io5';
import {
    isDefined,
    isFalsyString,
    isNotDefined,
    listToGroupList,
    mapToList,
} from '@togglecorp/fujs';

import Button from '#components/Button';
import Checkbox from '#components/Checkbox';
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
    workItems: WorkItem[];
}

function StartSidebar(props: Props) {
    const { workItems } = props;

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

    return (
        <div
            className={styles.startSidebar}
        >
            <div className={styles.calendar}>
                <IoCalendar />
            </div>
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
                <Button
                    name={undefined}
                    onClick={handleCopyTextButtonClick}
                    variant="secondary"
                    disabled={workItems.length === 0}
                    title="Copy standup text"
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
                    name="checkboxForStatus"
                    label="Use checkbox for status"
                    tooltip="Use checkbox instead of select input for the status. i.e. to toggle TODO, Doing and Done"
                    value={storedConfig.checkboxForStatus}
                    onChange={setConfigFieldValue}
                />
                <SelectInput
                    name="defaultTaskStatus"
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
                    options={enums?.enums.TimeEntryType}
                    keySelector={workItemTypeKeySelector}
                    labelSelector={workItemTypeLabelSelector}
                    onChange={setConfigFieldValue}
                    value={storedConfig.defaultTaskType}
                    nonClearable
                    // listContainerClassName={styles.typeOptionList}
                />
            </div>
        </div>
    );
}

export default StartSidebar;
