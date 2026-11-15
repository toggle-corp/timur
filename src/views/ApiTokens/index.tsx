import {
    useCallback,
    useId,
    useMemo,
    useState,
} from 'react';
import { RiErrorWarningLine } from 'react-icons/ri';
import {
    _cs,
    compareDate,
    compareNumber,
    isDefined,
    listToMap,
} from '@togglecorp/fujs';
import {
    gql,
    useMutation,
    useQuery,
} from 'urql';

import BackLink from '#components/BackLink';
import Button from '#components/Button';
import List from '#components/List';
import Message from '#components/Message';
import Page from '#components/Page';
import {
    type ApiTokenStatusEnum,
    type MyApiTokensQuery,
    type MyApiTokensQueryVariables,
    type RevokeApiTokenMutation,
    type RevokeApiTokenMutationVariables,
} from '#generated/types/graphql';
import useCurrentDate from '#hooks/useCurrentDate';
import { getFieldErrors } from '#utils/errors';

import ApiTokenRow, {
    type ApiToken,
    type DisplayStatus,
} from './ApiTokenRow';
import { MAX_ACTIVE_TOKENS } from './common';
import CreateApiTokenDialog from './CreateApiTokenDialog';

import shared from './shared.module.css';
import styles from './styles.module.css';

const MY_API_TOKENS = gql`
    query MyApiTokens {
        enums {
            ApiTokenScopes {
                key
                label
                description
                resource
                action
                resourceLabel
                resourceDescription
            }
            ApiTokenStatus {
                key
                label
            }
        }
        private {
            id
            myApiTokens {
                id
                name
                prefix
                scopes
                createdAt
                expiresAt
                lastUsedAt
                revokedAt
                status
            }
        }
    }
`;

const REVOKE_API_TOKEN = gql`
    mutation RevokeApiToken($id: ID!) {
        private {
            id
            revokeApiToken(id: $id) {
                ok
                errors
                result {
                    id
                    revokedAt
                    status
                }
            }
        }
    }
`;

// Same window as the expiry reminder email
const EXPIRES_SOON_MS = 7 * 24 * 60 * 60 * 1000;
// Token statuses only change at expiry, so a coarse clock is enough
const CLOCK_INTERVAL_MS = 60 * 1000;

interface TokenItem {
    token: ApiToken;
    displayStatus: DisplayStatus;
}

const displayStatusRank: Record<DisplayStatus, number> = {
    soon: 0,
    active: 0,
    expired: 1,
    revoked: 2,
};

const displayStatusToStatus: Record<DisplayStatus, ApiTokenStatusEnum> = {
    soon: 'ACTIVE',
    active: 'ACTIVE',
    expired: 'EXPIRED',
    revoked: 'REVOKED',
};

// Expiry is checked against the current time, so tokens that expire while the page is open
// show as expired without a refetch
function getDisplayStatus(token: ApiToken, now: number): DisplayStatus {
    if (token.status === 'REVOKED') {
        return 'revoked';
    }
    const msLeft = new Date(token.expiresAt).getTime() - now;
    if (token.status === 'EXPIRED' || msLeft <= 0) {
        return 'expired';
    }
    return msLeft <= EXPIRES_SOON_MS ? 'soon' : 'active';
}

// Active tokens by soonest expiry, then expired, then revoked, latest first
function compareTokenItems(a: TokenItem, b: TokenItem) {
    const rankDiff = compareNumber(
        displayStatusRank[a.displayStatus],
        displayStatusRank[b.displayStatus],
    );
    if (rankDiff !== 0) {
        return rankDiff;
    }
    if (a.displayStatus === 'expired') {
        return compareDate(a.token.expiresAt, b.token.expiresAt, -1);
    }
    if (a.displayStatus === 'revoked') {
        return compareDate(a.token.revokedAt, b.token.revokedAt, -1);
    }
    return compareDate(a.token.expiresAt, b.token.expiresAt);
}

const tokenKeySelector = (item: TokenItem) => item.token.id;

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const limitMessageId = useId();
    const now = useCurrentDate(CLOCK_INTERVAL_MS).getTime();

    // Captured on open, so a failed list refetch does not unmount the dialog
    const [dialogScopeOptions, setDialogScopeOptions] = useState<
        MyApiTokensQuery['enums']['ApiTokenScopes'] | undefined
    >();
    const [revokeError, setRevokeError] = useState<{ id: string, message: string } | undefined>();

    const [
        { data, fetching, error },
        reexecuteQuery,
    ] = useQuery<MyApiTokensQuery, MyApiTokensQueryVariables>({
        query: MY_API_TOKENS,
    });

    const [
        { fetching: revokePending },
        revokeApiToken,
    ] = useMutation<RevokeApiTokenMutation, RevokeApiTokenMutationVariables>(
        REVOKE_API_TOKEN,
    );

    const tokens = useMemo(
        () => (data?.private.myApiTokens ?? [])
            .map((token) => ({ token, displayStatus: getDisplayStatus(token, now) }))
            .sort(compareTokenItems),
        [data, now],
    );

    const activeCount = tokens.filter(
        ({ displayStatus }) => displayStatus === 'active' || displayStatus === 'soon',
    ).length;
    const limitReached = activeCount >= MAX_ACTIVE_TOKENS;

    const scopeOptions = data?.enums.ApiTokenScopes;

    const scopeOptionsByKey = useMemo(
        () => listToMap(scopeOptions ?? [], (option) => option.key),
        [scopeOptions],
    );

    const statusLabels = useMemo(
        () => listToMap(
            data?.enums.ApiTokenStatus ?? [],
            (option) => option.key,
            (option) => option.label,
        ),
        [data],
    );

    const handleCreateClick = useCallback(() => {
        setDialogScopeOptions(scopeOptions);
    }, [scopeOptions]);

    const handleCreateDialogClose = useCallback(() => {
        setDialogScopeOptions(undefined);
    }, []);

    const handleCreate = useCallback(() => {
        reexecuteQuery({ requestPolicy: 'network-only' });
    }, [reexecuteQuery]);

    const handleRevoke = useCallback(async (id: string) => {
        setRevokeError(undefined);
        const result = await revokeApiToken({ id });
        const response = result.data?.private.revokeApiToken;
        if (response?.ok) {
            return;
        }
        const { nonFieldErrors } = getFieldErrors(response?.errors);
        setRevokeError({
            id,
            message: nonFieldErrors ?? result.error?.message ?? 'Could not revoke the token.',
        });
        // The token may have expired or been revoked elsewhere
        reexecuteQuery({ requestPolicy: 'network-only' });
    }, [revokeApiToken, reexecuteQuery]);

    const rendererParams = useCallback(
        (_: string, { token, displayStatus }: TokenItem) => ({
            token,
            displayStatus,
            statusLabel: displayStatus === 'soon'
                ? 'Expires soon'
                : statusLabels[displayStatusToStatus[displayStatus]],
            scopeOptionsByKey,
            onRevoke: handleRevoke,
            revokeDisabled: revokePending,
            revokeError: revokeError?.id === token.id ? revokeError.message : undefined,
        }),
        [statusLabels, scopeOptionsByKey, handleRevoke, revokePending, revokeError],
    );

    const createDisabled = limitReached || !scopeOptions;

    return (
        <Page
            documentTitle="Timur - API Tokens"
            className={styles.apiTokens}
            contentClassName={styles.mainContent}
        >
            <BackLink>
                Back to Journal
            </BackLink>
            <div className={styles.pageHead}>
                <div>
                    <h3>API Tokens</h3>
                    <p className={styles.description}>
                        A token lets a script call the Timur API as you.
                        It can only do what its scopes allow.
                    </p>
                </div>
                <div className={styles.headActions}>
                    {tokens.length > 0 && (
                        <span className={styles.count}>
                            <strong>{activeCount}</strong>
                            {` of ${MAX_ACTIVE_TOKENS} active`}
                        </span>
                    )}
                    <Button
                        name={undefined}
                        onClick={handleCreateClick}
                        title="Create token"
                        variant="primary"
                        disabled={createDisabled}
                        aria-describedby={limitReached ? limitMessageId : undefined}
                    >
                        Create token
                    </Button>
                </div>
            </div>
            {limitReached && (
                <Message
                    id={limitMessageId}
                    variant="warning"
                    role="status"
                    banner
                    icon={<RiErrorWarningLine />}
                    description={(
                        <>
                            {`You have ${MAX_ACTIVE_TOKENS} active tokens, the most allowed. `}
                            Revoke one you no longer use to create a new one.
                        </>
                    )}
                />
            )}
            <div
                className={_cs(styles.tokens, tokens.length > 0 && styles.withTokens)}
                role="table"
                aria-label="API tokens"
            >
                {tokens.length > 0 && (
                    <div
                        className={_cs(shared.tokenGrid, styles.headRow)}
                        role="row"
                    >
                        <span role="columnheader">Name</span>
                        <span role="columnheader">Scopes</span>
                        <span role="columnheader">Created</span>
                        <span role="columnheader">Expires</span>
                        <span role="columnheader">Last used</span>
                        <span role="columnheader">Status</span>
                        <span role="columnheader">
                            <span className={shared.visuallyHidden}>Actions</span>
                        </span>
                    </div>
                )}
                <List
                    messageClassName={tokens.length === 0 ? styles.message : undefined}
                    data={tokens}
                    keySelector={tokenKeySelector}
                    renderer={ApiTokenRow}
                    rendererParams={rendererParams}
                    pending={fetching}
                    errored={isDefined(error)}
                    filtered={false}
                    emptyMessage="You have no API tokens"
                    emptyDescription={(
                        <div className={styles.emptyDescription}>
                            Create one to log time or read your journal from a script.
                            You pick what it can access and when it expires.
                            <Button
                                name={undefined}
                                onClick={handleCreateClick}
                                title="Create token"
                                variant="tertiary"
                                disabled={createDisabled}
                            >
                                Create token
                            </Button>
                        </div>
                    )}
                    errorMessage="Could not load your API tokens"
                    compact={tokens.length > 0}
                    showSeparator
                />
            </div>
            {tokens.length > 0 && (
                <p className={styles.listFoot}>
                    Revoked tokens leave this list 30 days after they are revoked.
                </p>
            )}
            {dialogScopeOptions && (
                <CreateApiTokenDialog
                    scopeOptions={dialogScopeOptions}
                    onClose={handleCreateDialogClose}
                    onCreate={handleCreate}
                />
            )}
        </Page>
    );
}

Component.displayName = 'ApiTokens';
