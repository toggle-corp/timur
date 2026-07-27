import {
    useMemo,
    useState,
} from 'react';
import {
    FcCalendar,
    FcVoicePresentation,
} from 'react-icons/fc';
import { RiSearchLine } from 'react-icons/ri';
import { isTruthyString } from '@togglecorp/fujs';

import Link from '#components/Link';
import Message from '#components/Message';
import Page from '#components/Page';
import TextInput from '#components/TextInput';

import { type WrappedRoutes } from '../../App/routes';

import styles from './styles.module.css';

interface AppItem {
    name: string;
    url: string;
    icon: string;
}

interface AppGroup {
    title: string;
    apps: AppItem[];
}

const APP_GROUPS: AppGroup[] = [
    {
        title: 'Togglecorp',
        apps: [
            { name: 'Website', url: 'https://togglecorp.com', icon: 'https://togglecorp.com/favicon.png' },
            { name: 'Blog', url: 'https://blog.togglecorp.com', icon: 'https://togglecorp.com/favicon.png' },
            { name: 'Miti', url: 'https://miti.togglecorp.com', icon: 'https://miti.togglecorp.com/favicon.png' },
        ],
    },
    {
        title: 'IFRC',
        apps: [
            { name: 'Go', url: 'https://go.ifrc.org', icon: 'https://go.ifrc.org/go-icon.svg' },
            { name: 'Alert Hub', url: 'https://alerthub.ifrc.org', icon: 'https://go.ifrc.org/go-icon.svg' },
            { name: 'Survey Designer', url: 'https://surveydesigner.ifrc.org', icon: 'https://go.ifrc.org/go-icon.svg' },
            { name: 'RC Select', url: 'https://rcselect.ifrc.org', icon: 'https://go.ifrc.org/go-icon.svg' },
            { name: 'Montandon', url: 'https://radiantearth.github.io/stac-browser/#/external/montandon-eoapi-stage.ifrc.org/stac/?.language=en', icon: 'https://go.ifrc.org/go-icon.svg' },
        ],
    },
    {
        title: 'IDMC',
        apps: [
            { name: 'Helix', url: 'https://helix-tools-api.idmcdb.org/external-api', icon: 'https://www.internal-displacement.org/favicon.ico' },
            { name: 'Website Components', url: 'https://release-website-components.idmcdb.org', icon: 'https://www.internal-displacement.org/favicon.ico' },
            { name: 'Website', url: 'https://internal-displacement.org', icon: 'https://www.internal-displacement.org/favicon.ico' },
        ],
    },
    {
        title: 'Mapswipe',
        apps: [
            { name: 'iOS App', url: 'https://apps.apple.com/us/app/mapswipe/id1133855392', icon: 'https://mapswipe.org/logo-compact.svg' },
            { name: 'Android App', url: 'https://play.google.com/store/apps/details?id=org.missingmaps.mapswipe&pli=1', icon: 'https://mapswipe.org/logo-compact.svg' },
            { name: 'Web App', url: 'https://web.mapswipe.org', icon: 'https://mapswipe.org/logo-compact.svg' },
            { name: 'Website', url: 'https://mapswipe.org', icon: 'https://mapswipe.org/logo-compact.svg' },
            { name: 'Community Dashboard', url: 'https://community.mapswipe.org/', icon: 'https://mapswipe.org/logo-compact.svg' },
            { name: 'Manager Dashboard', url: 'https://managers.mapswipe.org/', icon: 'https://mapswipe.org/logo-compact.svg' },
            { name: 'Docs', url: 'https://docs.mapswipe.org/', icon: 'https://mapswipe.org/logo-compact.svg' },
        ],
    },
    {
        title: 'SNWG',
        apps: [
            { name: 'RGT', url: 'https://impact.earthdata.nasa.gov/snwg/rgt/', icon: 'https://impact.earthdata.nasa.gov/snwg/rgt/meta/favicon.png' },
        ],
    },
    {
        title: 'CPAOR',
        apps: [
            { name: 'Country Profiles', url: 'https://data.cpaor.net', icon: 'https://cpaor.net/themes/custom/child_protection/logo.png' },
        ],
    },
    {
        title: 'CAPN',
        apps: [
            { name: 'Website', url: 'https://capnnepal.org.np', icon: 'https://capnnepal.org.np/_next/static/media/logo.3573e22c.png' },
        ],
    },
    {
        title: 'NRCS',
        apps: [
            { name: 'Website', url: 'https://nrcs.org', icon: 'https://nrcs.org/favicon.ico' },
        ],
    },
    {
        title: 'SMTM',
        apps: [
            { name: 'X Lite', url: 'https://npstocks.com', icon: 'https://npstocks.com/favicon.ico' },
            { name: 'Npstocks', url: 'https://play.google.com/store/apps/details?id=np.com.smtmcapital.npstocks&hl=en', icon: 'https://npstocks.com/favicon.ico' },
        ],
    },
    {
        title: 'Kitab Bazar',
        apps: [
            { name: 'Website', url: 'https://www.kitabbazar.org', icon: 'https://www.kitabbazar.org/favicon.ico' },
        ],
    },
    {
        title: 'Gaatha',
        apps: [
            { name: 'Website', url: 'https://www.storiesofgaatha.com', icon: 'https://www.storiesofgaatha.com/favicon.ico' },
        ],
    },
];

interface InternalLinkItem {
    name: string;
    to: keyof WrappedRoutes;
    icon: React.ReactNode;
}

const TIMUR_LINKS: InternalLinkItem[] = [
    { name: 'Daily Journal', to: 'dailyJournal', icon: <FcCalendar className={styles.appIcon} /> },
    { name: 'Standup Deck', to: 'dailyStandup', icon: <FcVoicePresentation className={styles.appIcon} /> },
];

function matchText(text: string, search: string) {
    return text.toLowerCase().includes(search);
}

interface AppIconProps {
    icon: string;
    name: string;
}

function AppIcon(props: AppIconProps) {
    const { icon, name } = props;
    return (
        <img
            className={styles.appIcon}
            src={icon}
            alt={name}
        />
    );
}

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const [searchText, setSearchText] = useState<string | undefined>(undefined);

    const normalizedSearch = searchText?.trim().toLowerCase() ?? '';
    const hasSearch = isTruthyString(normalizedSearch);

    const filteredTimurLinks = useMemo(
        () => (hasSearch
            ? TIMUR_LINKS.filter((item) => matchText(item.name, normalizedSearch))
            : TIMUR_LINKS),
        [hasSearch, normalizedSearch],
    );

    const filteredGroups = useMemo(
        () => {
            if (!hasSearch) {
                return APP_GROUPS;
            }
            return APP_GROUPS
                .map((group) => ({
                    ...group,
                    apps: group.apps.filter(
                        (app) => matchText(app.name, normalizedSearch)
                            || matchText(app.url, normalizedSearch),
                    ),
                }))
                .filter((group) => group.apps.length > 0);
        },
        [hasSearch, normalizedSearch],
    );

    const hasResults = filteredTimurLinks.length > 0 || filteredGroups.length > 0;

    return (
        <Page
            documentTitle="Timur - Home"
            className={styles.home}
            contentClassName={styles.mainContent}
        >
            <div className={styles.applications}>
                <TextInput
                    name={undefined}
                    className={styles.search}
                    variant="general"
                    icons={<RiSearchLine />}
                    value={searchText}
                    placeholder="Search"
                    onChange={setSearchText}
                />
                <div className={styles.grid}>
                    {filteredTimurLinks.length > 0 && (
                        <section className={styles.group}>
                            <h2 className={styles.groupTitle}>
                                Quick Links
                            </h2>
                            <div className={styles.appList}>
                                {filteredTimurLinks.map((item) => (
                                    <Link
                                        key={item.to}
                                        to={item.to}
                                        className={styles.appLinkContainer}
                                        linkElementClassName={styles.appLink}
                                        icons={item.icon}
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}
                    {filteredGroups.map((group) => (
                        <section
                            key={group.title}
                            className={styles.group}
                        >
                            <h2 className={styles.groupTitle}>
                                {group.title}
                            </h2>
                            <div className={styles.appList}>
                                {group.apps.map((app) => (
                                    <Link
                                        key={app.name}
                                        external
                                        href={app.url}
                                        className={styles.appLinkContainer}
                                        linkElementClassName={styles.appLink}
                                        icons={<AppIcon icon={app.icon} name={app.name} />}
                                    >
                                        {app.name}
                                    </Link>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
                {!hasResults && (
                    <Message
                        title="Oh no!"
                        description={`No match for "${searchText}"`}
                    />
                )}
            </div>
        </Page>
    );
}

Component.displayName = 'Home';
