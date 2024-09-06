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
                    Journal
                </h4>
                <Checkbox
                    name="compactTextArea"
                    label="Collapse text area on blur"
                    value={storedConfig.compactTextArea}
                    onChange={setConfigFieldValue}
                />
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
                    Note
                </h4>
                <SelectInput
                    name="editingMode"
                    label="Note Editing Mode"
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
