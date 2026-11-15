import { RiErrorWarningLine } from 'react-icons/ri';
import {
    _cs,
    isDefined,
} from '@togglecorp/fujs';

import ConfirmButton from '#components/ConfirmButton';
import Message from '#components/Message';
import Pill from '#components/Pill';
import { type MyApiTokensQuery } from '#generated/types/graphql';
import useFormattedRelativeDate from '#hooks/useFormattedRelativeDate';

import {
    formatDate,
    TOKEN_PREFIX,
} from '../common';

import shared from '../shared.module.css';
import styles from './styles.module.css';

export type ApiToken = MyApiTokensQuery['private']['myApiTokens'][number];
type ScopeOption = MyApiTokensQuery['enums']['ApiTokenScopes'][number];
export type DisplayStatus = 'active' | 'soon' | 'expired' | 'revoked';

const statusPillVariants: Record<DisplayStatus, 'success' | 'warning' | 'error' | 'default'> = {
    active: 'success',
    soon: 'warning',
    expired: 'error',
    revoked: 'default',
};

interface Props {
    token: ApiToken;
    displayStatus: DisplayStatus;
    statusLabel: string | undefined;
    scopeOptionsByKey: Partial<Record<string, ScopeOption>>;
    onRevoke: (id: string) => void;
    revokeDisabled: boolean;
    revokeError: string | undefined;
}

function ApiTokenRow(props: Props) {
    const {
        token,
        displayStatus,
        statusLabel,
        scopeOptionsByKey,
        onRevoke,
        revokeDisabled,
        revokeError,
    } = props;

    const createdRelative = useFormattedRelativeDate(token.createdAt);
    const expiresRelative = useFormattedRelativeDate(token.expiresAt);
    const lastUsedRelative = useFormattedRelativeDate(token.lastUsedAt);
    const revokedRelative = useFormattedRelativeDate(token.revokedAt);

    const maskedToken = `${TOKEN_PREFIX}${token.prefix}…`;

    return (
        <div
            className={_cs(
                shared.tokenGrid,
                styles.apiTokenRow,
                displayStatus === 'revoked' && styles.revokedRow,
            )}
            role="row"
        >
            <div
                className={styles.nameCell}
                role="cell"
            >
                <div className={styles.name}>
                    {token.name}
                </div>
                <div className={styles.prefix}>
                    {maskedToken}
                </div>
            </div>
            <div
                className={styles.scopesCell}
                role="cell"
            >
                {token.scopes.map((scope) => (
                    <Pill
                        key={scope}
                        size="sm"
                        title={scopeOptionsByKey[scope]?.description}
                    >
                        {scopeOptionsByKey[scope]?.label}
                    </Pill>
                ))}
            </div>
            <div className={styles.meta}>
                <div
                    className={styles.when}
                    role="cell"
                >
                    <span className={styles.cellLabel}>Created</span>
                    {createdRelative}
                    <small>{formatDate(token.createdAt)}</small>
                </div>
                {displayStatus === 'revoked' ? (
                    <div
                        className={styles.when}
                        role="cell"
                    >
                        <span className={styles.cellLabel}>Expires</span>
                        {formatDate(token.expiresAt)}
                    </div>
                ) : (
                    <div
                        className={_cs(
                            styles.when,
                            displayStatus === 'soon' && styles.warning,
                            displayStatus === 'expired' && styles.error,
                        )}
                        role="cell"
                    >
                        <span className={styles.cellLabel}>
                            {displayStatus === 'expired' ? 'Expired' : 'Expires'}
                        </span>
                        {expiresRelative}
                        <small>{formatDate(token.expiresAt)}</small>
                    </div>
                )}
                <div
                    className={_cs(
                        styles.when,
                        !token.lastUsedAt && styles.muted,
                    )}
                    role="cell"
                >
                    <span className={styles.cellLabel}>Last used</span>
                    {token.lastUsedAt ? lastUsedRelative : 'Never used'}
                </div>
            </div>
            <div
                className={styles.statusCell}
                role="cell"
            >
                <Pill
                    className={styles.statusPill}
                    size="sm"
                    variant={statusPillVariants[displayStatus]}
                    icon={displayStatus !== 'revoked' && (
                        <span
                            className={styles.statusDot}
                            aria-hidden
                        />
                    )}
                >
                    {statusLabel}
                </Pill>
                {displayStatus === 'revoked' && token.revokedAt && (
                    <small>{revokedRelative}</small>
                )}
            </div>
            <div
                className={styles.actionCell}
                role="cell"
            >
                {(displayStatus === 'active' || displayStatus === 'soon') && (
                    <ConfirmButton
                        name={token.id}
                        onClick={onRevoke}
                        title="Revoke token"
                        variant="tertiary"
                        spacing="sm"
                        disabled={revokeDisabled}
                        confirmDisabled={revokeDisabled}
                        confirmHeading={`Revoke "${token.name}"?`}
                        confirmDescription={(
                            <div className={styles.confirmDescription}>
                                <p>
                                    Scripts using
                                    {' '}
                                    <span className={styles.mono}>{maskedToken}</span>
                                    {' '}
                                    will get an error from their next request.
                                    You can&apos;t undo this.
                                </p>
                                {isDefined(revokeError) && (
                                    <Message
                                        variant="error"
                                        role="alert"
                                        banner
                                        icon={<RiErrorWarningLine />}
                                        description={revokeError}
                                    />
                                )}
                            </div>
                        )}
                        confirmLabel="Revoke token"
                    >
                        Revoke
                    </ConfirmButton>
                )}
                {isDefined(revokeError) && (
                    <small
                        className={styles.revokeError}
                        role="status"
                    >
                        {revokeError}
                    </small>
                )}
            </div>
        </div>
    );
}

export default ApiTokenRow;
