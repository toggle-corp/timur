import { useContext } from 'react';

import UserContext from '#contexts/user';

import styles from './styles.module.css';

type AdminEntity = 'project' | 'deadline' | 'event' | 'contract';

const entityAdminPath: Record<AdminEntity, string> = {
    project: 'project/project',
    deadline: 'project/deadline',
    event: 'common/event',
    contract: 'track/contract',
};

interface Props {
    entity: AdminEntity;
    id: string;
    children: React.ReactNode;
}

function AdminEditLink(props: Props) {
    const { entity, id, children } = props;
    const { userAuth } = useContext(UserContext);

    if (!userAuth?.isStaff) {
        return children;
    }

    const href = `${import.meta.env.APP_GRAPHQL_DOMAIN}/admin/${entityAdminPath[entity]}/${id}/change/`;

    return (
        <a
            className={styles.adminEditLink}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title={`Edit ${entity} in admin`}
        >
            {children}
        </a>
    );
}

export default AdminEditLink;
