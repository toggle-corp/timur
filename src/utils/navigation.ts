import { type IconType } from 'react-icons';
import {
    RiBallPenLine,
    RiHome2Line,
    RiSlideshow4Line,
    RiTeamLine,
} from 'react-icons/ri';

import { type WrappedRoutes } from '../App/routes';

interface NavSection {
    to: keyof WrappedRoutes;
    pathPrefix: string;
    label: string;
    icon: IconType;
}

export const homeSection: NavSection = {
    to: 'home',
    pathPrefix: '/',
    label: 'Home',
    icon: RiHome2Line,
};

export const journalSection: NavSection = {
    to: 'dailyJournal',
    pathPrefix: '/daily-journal',
    label: 'Journal',
    icon: RiBallPenLine,
};

export const standupSection: NavSection = {
    to: 'dailyStandup',
    pathPrefix: '/daily-standup',
    label: 'Standup',
    icon: RiSlideshow4Line,
};

export const timesheetsSection: NavSection = {
    to: 'timesheets',
    pathPrefix: '/timesheets',
    label: 'Timesheets',
    icon: RiTeamLine,
};

export function isInSection(pathname: string, section: NavSection) {
    const { pathPrefix } = section;
    if (pathPrefix === '/') {
        return pathname === '/';
    }
    return pathname === pathPrefix || pathname.startsWith(`${pathPrefix}/`);
}
