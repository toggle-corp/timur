import { useMemo } from 'react';

function usePermissions() {
    const perms = useMemo(
        () => ({
            isSuperUser: true,
        }),
        [],
    );

    return perms;
}

export default usePermissions;
