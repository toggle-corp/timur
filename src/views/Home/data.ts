import { listToMap } from '@togglecorp/fujs';

import {
    Client,
    Contract,
    Project,
    Task,
} from '#utils/types';

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
const americanRedCross: Client = {
    id: 4,
    title: 'American Red Cross',
    abbvr: 'ARC',
};
const devSeed: Client = {
    id: 6,
    title: 'Development Seed',
    abbvr: 'DevSeed',
};
const dfs: Client = {
    id: 7,
    title: 'Data Friendly Space',
    abbvr: 'DFS',
};
const nasa: Client = {
    id: 8,
    title: 'National Aeronautics and Space Administration',
    abbvr: 'NASA',
};

export const clientList = [
    togglecorp,
    ifrc,
    idmc,
    americanRedCross,
    dfs,
    devSeed,
    dfs,
    nasa,
];

const timur: Project = {
    id: 1,
    title: 'Timur',
    client: togglecorp.id,
    contractor: togglecorp.id,
};
const go: Project = {
    id: 2,
    title: 'GO',
    client: ifrc.id,
    contractor: dfs.id,
};
const helix: Project = {
    id: 3,
    title: 'Helix',
    client: idmc.id,
    contractor: dfs.id,
};
const deep: Project = {
    id: 4,
    title: 'Deep',
    client: dfs.id,
    contractor: dfs.id,
};
const snwg: Project = {
    id: 5,
    title: 'SNWG',
    client: nasa.id,
    contractor: devSeed.id,
};
const tcWork: Project = {
    id: 6,
    title: 'Togglecorp',
    client: togglecorp.id,
    contractor: togglecorp.id,
};
const apt: Project = {
    id: 7,
    title: 'APT',
    client: nasa.id,
    contractor: devSeed.id,
};
const mapSwipe: Project = {
    id: 8,
    title: 'MapSwipe',
    client: americanRedCross.id,
    contractor: americanRedCross.id,
};
const alertHub: Project = {
    id: 9,
    title: 'AlertHub',
    client: ifrc.id,
    contractor: dfs.id,
};

export const projectList: Project[] = [
    timur,
    go,
    helix,
    deep,
    snwg,
    tcWork,
    apt,
    mapSwipe,
    alertHub,
];

// Contracts
const timurPhaseOneDevelopment: Contract = {
    id: 10101,
    title: 'MVP-0',
    project: timur.id,
};
const goTwentyFourQ3: Contract = {
    id: 10201,
    title: '2024 Q3',
    project: go.id,
};
const helixSupport: Contract = {
    id: 10301,
    title: 'Support and Maintenance',
    project: helix.id,
};
const mapSwipeSupport2024And2025: Contract = {
    id: 10801,
    title: 'Support and Maintenance 2024/25',
    project: mapSwipe.id,
};
const snwgSupportJuly2024November2024: Contract = {
    id: 10501,
    title: 'SNWG Support (2024, July-10 to 2024, November 8)',
    project: snwg.id,
};
const aptSupportJuly2024November2024: Contract = {
    id: 10502,
    title: 'APT Support (2024, July-10 to 2024, November 8)',
    project: apt.id,
};
const tcGeneral: Contract = {
    id: 10601,
    title: 'TC General',
    project: tcWork.id,
};
const alertHubPhaseTwo: Contract = {
    id: 10901,
    title: 'Phase 2',
    project: alertHub.id,
};
const deepMaintence: Contract = {
    id: 10401,
    title: 'Support and maintenance',
    project: deep.id,
};

const contractList = [
    timurPhaseOneDevelopment,
    goTwentyFourQ3,
    helixSupport,
    mapSwipeSupport2024And2025,
    snwgSupportJuly2024November2024,
    aptSupportJuly2024November2024,
    tcGeneral,
    alertHubPhaseTwo,
    deepMaintence,
];

// TC tasks
const tcWebsite: Task = {
    id: 10601001,
    title: 'Togglecorp Website',
    contract: tcGeneral.id,
};
const tcProjectPortfolio: Task = {
    id: 10601002,
    title: 'Project Portfolio',
    contract: tcGeneral.id,
};

// Deep tasks
const deepAnalysisModule: Task = {
    id: 10401001,
    title: 'Analysis Module',
    contract: deepMaintence.id,
};
const deepOcr: Task = {
    id: 10401002,
    title: 'OCR',
    contract: deepMaintence.id,
};

// AlertHub tasks
const alertHubLogin: Task = {
    id: 10901001,
    title: 'Login',
    contract: alertHubPhaseTwo.id,
};
const alertHubSubscription: Task = {
    id: 10901002,
    title: 'Subscription',
    contract: alertHubPhaseTwo.id,
};
const alertHubSupport: Task = {
    id: 10901003,
    title: 'Support and maintenance',
    contract: alertHubPhaseTwo.id,
};
const alertHubGoogleAnalytics: Task = {
    id: 10901004,
    title: 'Google Analytics',
    contract: alertHubPhaseTwo.id,
};

// SNWG tasks
const snwgFargetIntegration: Task = {
    id: 10501001,
    title: 'Farget integration',
    contract: snwgSupportJuly2024November2024.id,
};
const snwgAsanaSync: Task = {
    id: 10501002,
    title: 'ASANA sync',
    contract: snwgSupportJuly2024November2024.id,
};
const snwgAssessmentCycle: Task = {
    id: 10501003,
    title: 'Assessment cycle management',
    contract: snwgSupportJuly2024November2024.id,
};

const snwgReportVersion: Task = {
    id: 10501004,
    title: 'Report & ReportVersion refactor',
    contract: snwgSupportJuly2024November2024.id,
};

// APT tasks
const aptBugFixes: Task = {
    id: 10502001,
    title: 'Bug fixes',
    contract: aptSupportJuly2024November2024.id,
};

// Helix tasks
const helixAwsAccount: Task = {
    id: 10301001,
    title: 'AWS accounts',
    contract: helixSupport.id,
};
const helixUpdateTextCases: Task = {
    id: 10301002,
    title: 'Update test cases',
    contract: helixSupport.id,
};

// MapSwipe tasks
const mapSwipeAccessibility: Task = {
    id: 10801001,
    title: 'Accessibility',
    contract: mapSwipeSupport2024And2025.id,
};
const mapSwipeBugFixes: Task = {
    id: 10801002,
    title: 'Bug fixes',
    contract: mapSwipeSupport2024And2025.id,
};
const mapSwipeEnhancements: Task = {
    id: 10801003,
    title: 'Enhancements',
    contract: mapSwipeSupport2024And2025.id,
};

// Timur tasks
const timurUi: Task = {
    id: 10001001,
    title: 'User Interface Development',
    contract: timurPhaseOneDevelopment.id,
};

// GO tasks
const goCountryPages: Task = {
    id: 11001,
    title: 'Country Pages',
    contract: goTwentyFourQ3.id,
};
const goOpsLearning: Task = {
    id: 11002,
    title: 'Ops. Learning',
    contract: goTwentyFourQ3.id,
};
const goDref: Task = {
    id: 11003,
    title: 'DREF',
    contract: goTwentyFourQ3.id,
};
const goDrefImport: Task = {
    id: 11004,
    title: 'DREF Import',
    contract: goTwentyFourQ3.id,
};
const goGuestUser: Task = {
    id: 11005,
    title: 'Gues User Permission',
    contract: goTwentyFourQ3.id,
};
const goPlaywrightIntegration: Task = {
    id: 11006,
    title: 'Playwright Integration',
    contract: goTwentyFourQ3.id,
};
const goRiskModule: Task = {
    id: 11007,
    title: 'Risk Module',
    contract: goTwentyFourQ3.id,
};
const goSiteImprovements: Task = {
    id: 11008,
    title: 'Site Improvements',
    contract: goTwentyFourQ3.id,
};
const goStorybook: Task = {
    id: 11009,
    title: 'Storybook',
    contract: goTwentyFourQ3.id,
};

export const taskList = [
    tcWebsite,
    tcProjectPortfolio,
    deepAnalysisModule,
    deepOcr,
    alertHubLogin,
    alertHubSubscription,
    alertHubSupport,
    alertHubGoogleAnalytics,
    snwgFargetIntegration,
    snwgAsanaSync,
    snwgAssessmentCycle,
    snwgReportVersion,
    aptBugFixes,
    helixAwsAccount,
    helixUpdateTextCases,
    mapSwipeAccessibility,
    mapSwipeBugFixes,
    mapSwipeEnhancements,
    timurUi,
    goCountryPages,
    goOpsLearning,
    goDref,
    goDrefImport,
    goGuestUser,
    goPlaywrightIntegration,
    goRiskModule,
    goSiteImprovements,
    goStorybook,
];

export const clientById = listToMap(clientList, ({ id }) => id);
export const projectById = listToMap(projectList, ({ id }) => id);
export const contractById = listToMap(contractList, ({ id }) => id);
export const taskById = listToMap(taskList, ({ id }) => id);
