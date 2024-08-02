import {
    Client,
    Contract,
    Project,
    Task,
} from '#utils/types';
import { listToMap } from '@togglecorp/fujs';

const togglecorp: Client = {
    id: 1,
    title: 'Togglecorp',
    abbvr: 'TC',
};

const ifrc: Client = {
    id: 2,
    title: 'International Federation of Red Cross and Red Crescent Societies',
    abbvr: 'IFRC',
};

const idmc: Client = {
    id: 3,
    title: 'Internal Displacement Monitoring Center',
    abbvr: 'IDMC',
};

const mapSwipeCommunity: Client = {
    id: 4,
    title: 'MapSwipe Community',
};

const deepBoard: Client = {
    id: 5,
    title: 'Deep Board',
};

const devSeed: Client = {
    id: 6,
    title: 'Development Seed',
    abbvr: 'DevSeed',
};

export const clientList = [
    togglecorp,
    ifrc,
    idmc,
    mapSwipeCommunity,
    deepBoard,
    devSeed,
];

const timur: Project = {
    id: 1,
    title: 'Timur',
    client: togglecorp.id,
};
const go: Project = {
    id: 2,
    title: 'GO',
    client: ifrc.id,
};
const helix: Project = {
    id: 3,
    title: 'Helix',
    client: idmc.id,
};
const deep: Project = {
    id: 4,
    title: 'Deep',
    client: deepBoard.id,
};
const nasa: Project = {
    id: 5,
    title: 'NASA',
    client: devSeed.id,
};
const tcManagement: Project = {
    id: 6,
    title: 'Togglecorp',
    client: togglecorp.id,
};

export const projectList: Project[] = [
    timur,
    go,
    helix,
    deep,
    nasa,
    tcManagement,
];

const timurPhaseOneDevelopment: Contract = {
    id: 10001,
    title: 'Development - Phase 1',
    project: timur.id,
};
const goDref: Contract = {
    id: 11001,
    title: 'DREF',
    project: go.id,
};
const goLocalUnits: Contract = {
    id: 11002,
    title: 'Local Units',
    project: go.id,
};
const goGuestUser: Contract = {
    id: 11003,
    title: 'Guest User',
    project: go.id,
};
const opsLearning: Contract = {
    id: 11004,
    title: 'Operational Learning',
    project: go.id,
};
const goMaintenance: Contract = {
    id: 11005,
    title: 'Maintenance',
    project: go.id,
};
const nasaSupportJuly2024November2024: Contract = {
    id: 15001,
    title: 'Support (2024, July-10 to 2024, November 8)',
    project: nasa.id,
};
const tcGeneral: Contract = {
    id: 16001,
    title: 'TC General',
    project: tcManagement.id,
};

export const contractList = [
    timurPhaseOneDevelopment,
    goDref,
    goLocalUnits,
    goGuestUser,
    opsLearning,
    goMaintenance,
    nasaSupportJuly2024November2024,
    tcGeneral,
];

const timurUi: Task = {
    id: 10001001,
    title: 'User Interface Development',
    contract: timurPhaseOneDevelopment.id,
};

const goDrefImportTemplate: Task = {
    id: 11001001,
    title: 'DREF Application Import Template',
    contract: goDref.id,
};
const goMaintenanceWork: Task = {
    id: 11001002,
    title: 'Maintenance',
    contract: goMaintenance.id,
};
const nasaRgtAssessmentCycle: Task = {
    id: 15001001,
    title: 'RGT: Implement Assessment Cycle',
    contract: nasaSupportJuly2024November2024.id,
};
const nasaRgtFilter: Task = {
    id: 15001002,
    title: 'RGT: Improve Filtering',
    contract: nasaSupportJuly2024November2024.id,
};
const nasaRgtBugFixes: Task = {
    id: 15001003,
    title: 'RGT: Bug fixes',
    contract: nasaSupportJuly2024November2024.id,
};
const nasaRgtMaintenance: Task = {
    id: 15001004,
    title: 'RGT: Maintenance',
    contract: nasaSupportJuly2024November2024.id,
};
const nasaAptBugFixes: Task = {
    id: 15002001,
    title: 'APT: Bug fixes',
    contract: nasaSupportJuly2024November2024.id,
};
const nasaAptMaintenance: Task = {
    id: 15002002,
    title: 'APT: Maintenance',
    contract: nasaSupportJuly2024November2024.id,
};
const tcManagementMeeting: Task = {
    id: 16001001,
    title: 'Management Meeting',
    contract: tcGeneral.id,
};

export const taskList = [
    timurUi,
    goDrefImportTemplate,
    goMaintenanceWork,
    nasaRgtFilter,
    nasaRgtAssessmentCycle,
    nasaRgtBugFixes,
    nasaRgtMaintenance,
    nasaAptBugFixes,
    nasaAptMaintenance,
    tcManagementMeeting,
];

export const clientById = listToMap(clientList, ({ id }) => id);
export const projectById = listToMap(projectList, ({ id }) => id);
export const contractById = listToMap(contractList, ({ id }) => id);
export const taskById = listToMap(taskList, ({ id }) => id);
