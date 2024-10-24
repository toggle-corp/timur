import { useContext } from 'react';

import Checkbox from '#components/Checkbox';
import Page from '#components/Page';
import SelectInput from '#components/SelectInput';
import EnumsContext from '#contexts/enums';
import { EnumsQuery } from '#generated/types/graphql';
import useLocalStorage from '#hooks/useLocalStorage';
import useSetFieldValue from '#hooks/useSetFieldValue';
import { colorscheme } from '#utils/constants';
import { EditingMode } from '#utils/types';

import WorkItemRow from '../DailyJournal/DayView/WorkItemRow';

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
function workItemStatusColorSelector(item: WorkItemStatusOption): [string, string] {
    if (item.key === 'DOING') {
        return colorscheme[1];
    }
    if (item.key === 'DONE') {
        return colorscheme[5];
    }
    return colorscheme[7];
}

function defaultColorSelector<T>(_: T, i: number): [string, string] {
    return colorscheme[i % colorscheme.length];
}

/** @knipignore */
// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const { enums } = useContext(EnumsContext);
    const [storedConfig, setStoredConfig] = useLocalStorage('timur-config');
    const setConfigFieldValue = useSetFieldValue(setStoredConfig);

    return (
        <Page
            documentTitle="Timur - Settings"
            className={styles.settings}
            contentClassName={styles.mainContent}
        >
            <div className={styles.section}>
                <h4>
                    Entry
                </h4>
                <Checkbox
                    name="compactTextArea"
                    label="Only expand text area on focus"
                    value={storedConfig.compactTextArea}
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
                    name="indent"
                    label="Indent headings"
                    value={storedConfig.indent}
                    onChange={setConfigFieldValue}
                />
                <Checkbox
                    name="enableStrikethrough"
                    label="Strikethrough completed entries 🧪"
                    value={storedConfig.enableStrikethrough}
                    onChange={setConfigFieldValue}
                />
                <Checkbox
                    name="enableCollapsibleGroups"
                    label="Enable collapsible groups 🧪"
                    value={storedConfig.enableCollapsibleGroups}
                    onChange={setConfigFieldValue}
                />
                <div className={styles.container}>
                    <WorkItemRow
                        className={styles.workItem}
                        workItem={{
                            clientId: 'xyz',
                            date: '2024-09-06',
                            description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam vel enim sit amet augue iaculis pharetra non ac nulla. In justo enim, egestas sed mi cursus, efficitur interdum felis.',
                            duration: 90,
                            id: undefined,
                            startTime: undefined,
                            status: 'DOING',
                            task: '1',
                            type: 'DEVELOPMENT',
                        }}
                        contractId="1"
                    />
                    <WorkItemRow
                        className={styles.workItem}
                        workItem={{
                            clientId: 'abc',
                            date: '2024-09-10',
                            description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam vel enim sit amet augue iaculis pharetra non ac nulla. In justo enim, egestas sed mi cursus, efficitur interdum felis.',
                            duration: 10,
                            id: undefined,
                            startTime: undefined,
                            status: 'DONE',
                            task: '1',
                            type: 'DESIGN',
                        }}
                        contractId="1"
                    />
                </div>
            </div>
            <div className={styles.section}>
                <h4>
                    Create Entry
                </h4>
                <SelectInput
                    name="defaultTaskStatus"
                    variant="general"
                    label="Default Entry Status"
                    options={enums?.enums.TimeEntryStatus}
                    keySelector={workItemStatusKeySelector}
                    labelSelector={workItemStatusLabelSelector}
                    colorSelector={workItemStatusColorSelector}
                    onChange={setConfigFieldValue}
                    value={storedConfig.defaultTaskStatus}
                    nonClearable
                />
                <SelectInput
                    name="defaultTaskType"
                    label="Default Entry Type"
                    variant="general"
                    options={enums?.enums.TimeEntryType}
                    keySelector={workItemTypeKeySelector}
                    labelSelector={workItemTypeLabelSelector}
                    colorSelector={defaultColorSelector}
                    onChange={setConfigFieldValue}
                    value={storedConfig.defaultTaskType}
                />
            </div>
            <div className={styles.section}>
                <h4>
                    Create Notes
                </h4>
                <SelectInput
                    name="editingMode"
                    label="Editing Mode"
                    variant="general"
                    options={editingOptions}
                    keySelector={editingOptionKeySelector}
                    labelSelector={editingOptionLabelSelector}
                    // colorSelector={defaultColorSelector}
                    onChange={setConfigFieldValue}
                    value={storedConfig.editingMode}
                    nonClearable
                />
            </div>
        </Page>
    );
}

Component.displayName = 'Settings';
