import AdminLink from '#components/AdminLink';
import { getAdminUrl } from '#utils/admin';

type AdminEntity = 'project' | 'deadline' | 'event' | 'contract' | 'timeEntry';

const entityLabels: Record<AdminEntity, string> = {
    project: 'project',
    deadline: 'deadline',
    event: 'event',
    contract: 'contract',
    timeEntry: 'time entry',
};

const entityAdminPath: Record<AdminEntity, string> = {
    project: 'project/project',
    deadline: 'project/deadline',
    event: 'common/event',
    contract: 'track/contract',
    timeEntry: 'track/timeentry',
};

interface Props {
    entity: AdminEntity;
    id: string;
    children: React.ReactNode;
}

function AdminEditLink(props: Props) {
    const { entity, id, children } = props;

    return (
        <AdminLink
            href={getAdminUrl(`${entityAdminPath[entity]}/${id}/change/`)}
            title={`Edit ${entityLabels[entity]} in admin`}
        >
            {children}
        </AdminLink>
    );
}

export default AdminEditLink;
