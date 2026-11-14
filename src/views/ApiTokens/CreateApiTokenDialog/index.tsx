import {
    useCallback,
    useContext,
    useId,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    RiErrorWarningLine,
    RiFileCopyLine,
} from 'react-icons/ri';
import {
    _cs,
    decodeDate,
    isDefined,
    listToGroupList,
    mapToList,
} from '@togglecorp/fujs';
import {
    gql,
    useMutation,
} from 'urql';

import Button from '#components/Button';
import Checkbox from '#components/Checkbox';
import Dialog from '#components/Dialog';
import InputHint from '#components/InputHint';
import InputLabel from '#components/InputLabel';
import Message from '#components/Message';
import RadioInput from '#components/RadioInput';
import TextInput from '#components/TextInput';
import DateContext from '#contexts/date';
import {
    type ApiTokenScopeEnum,
    type CreateApiTokenMutation,
    type CreateApiTokenMutationVariables,
    type MyApiTokensQuery,
} from '#generated/types/graphql';
import useCopyToClipboard from '#hooks/useCopyToClipboard';
import { addDays } from '#utils/common';
import {
    type FieldErrors,
    getFieldErrors,
} from '#utils/errors';

import {
    formatDate,
    formatTimestamp,
    getEndOfDay,
    TOKEN_PREFIX,
} from '../common';

import shared from '../shared.module.css';
import styles from './styles.module.css';

const CREATE_API_TOKEN = gql`
    mutation CreateApiToken($data: ApiTokenCreateInput!) {
        private {
            id
            createApiToken(data: $data) {
                ok
                errors
                result {
                    secret
                    token {
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
        }
    }
`;

const NAME_MAX_LENGTH = 100;
const MAX_EXPIRY_DAYS = 365;

type ScopeOption = MyApiTokensQuery['enums']['ApiTokenScopes'][number];
type CreatedToken = NonNullable<CreateApiTokenMutation['private']['createApiToken']['result']>;

type ExpiryKey = '30' | '90' | '365' | 'custom';
interface ExpiryOption {
    key: ExpiryKey;
    label: string;
}
const expiryOptions: ExpiryOption[] = [
    { key: '30', label: '30 days' },
    { key: '90', label: '90 days' },
    { key: '365', label: '1 year' },
    { key: 'custom', label: 'Custom' },
];
const expiryKeySelector = (option: ExpiryOption) => option.key;
const expiryLabelSelector = (option: ExpiryOption) => option.label;

interface ScopeGroup {
    key: string;
    label: string;
    description: string;
    read: ScopeOption | undefined;
    write: ScopeOption | undefined;
}

// Rows of the scope table: one per resource, with its read and write scopes
function getScopeGroups(options: ScopeOption[]): ScopeGroup[] {
    const optionsByResource = listToGroupList(options, (option) => option.resource);
    return mapToList(optionsByResource, (resourceOptions, resource) => {
        const read = resourceOptions.find((option) => option.action === 'read');
        const write = resourceOptions.find((option) => option.action === 'write');
        const primary = read ?? write;
        if (!primary) {
            return undefined;
        }
        return {
            key: resource,
            label: primary.resourceLabel,
            description: primary.resourceDescription,
            read,
            write,
        };
    }).filter(isDefined);
}

interface Props {
    scopeOptions: ScopeOption[];
    onClose: () => void;
    onCreate: () => void;
}

function CreateApiTokenDialog(props: Props) {
    const {
        scopeOptions,
        onClose,
        onCreate,
    } = props;

    const { fullDate: today } = useContext(DateContext);
    const minDate = addDays(today, 1);
    const maxDate = addDays(today, MAX_EXPIRY_DAYS);
    const maxDateLabel = formatDate(decodeDate(maxDate));

    const nameInputRef = useRef<HTMLInputElement>(null);
    const scopesLabelId = useId();

    const [name, setName] = useState<string | undefined>();
    const [expiry, setExpiry] = useState<ExpiryKey>('30');
    const [customDate, setCustomDate] = useState<string | undefined>();
    const [scopes, setScopes] = useState<ApiTokenScopeEnum[]>([]);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [createdToken, setCreatedToken] = useState<CreatedToken | undefined>();

    const { status: copyStatus, copy } = useCopyToClipboard();

    const [{ fetching }, createApiToken] = useMutation<
        CreateApiTokenMutation,
        CreateApiTokenMutationVariables
    >(CREATE_API_TOKEN);

    const scopeGroups = useMemo(() => getScopeGroups(scopeOptions), [scopeOptions]);

    const expiresAt = expiry === 'custom' ? customDate : addDays(today, Number(expiry));

    const handleNameChange = useCallback((value: string | undefined) => {
        setName(value);
        setFieldErrors((oldErrors) => ({ ...oldErrors, name: undefined }));
    }, []);

    const handleExpiryChange = useCallback((value: ExpiryKey) => {
        setExpiry(value);
        setFieldErrors((oldErrors) => ({ ...oldErrors, expiresAt: undefined }));
    }, []);

    const handleCustomDateChange = useCallback((value: string | undefined) => {
        setCustomDate(value);
        setFieldErrors((oldErrors) => ({ ...oldErrors, expiresAt: undefined }));
    }, []);

    const handleScopeChange = useCallback((checked: boolean, scope: ApiTokenScopeEnum) => {
        setScopes((oldScopes) => {
            const otherScopes = oldScopes.filter((item) => item !== scope);
            if (!checked) {
                return otherScopes;
            }
            const option = scopeOptions.find((item) => item.key === scope);
            // Write includes read of the same resource
            const readScope = option?.action === 'write'
                ? scopeOptions.find((item) => (
                    item.resource === option.resource && item.action === 'read'
                ))?.key
                : undefined;
            if (isDefined(readScope) && !otherScopes.includes(readScope)) {
                return [...otherScopes, scope, readScope];
            }
            return [...otherScopes, scope];
        });
        setFieldErrors((oldErrors) => ({ ...oldErrors, scopes: undefined }));
    }, [scopeOptions]);

    const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedName = name?.trim();
        const clientErrors: FieldErrors = {
            name: !trimmedName ? 'Name is required.' : undefined,
            expiresAt: (!expiresAt || expiresAt < minDate || expiresAt > maxDate)
                ? `Pick a date from tomorrow to ${maxDateLabel}.`
                : undefined,
            scopes: scopes.length === 0 ? 'Select at least one scope.' : undefined,
        };
        if (Object.values(clientErrors).some(isDefined)) {
            setFieldErrors(clientErrors);
            return;
        }

        const result = await createApiToken({
            data: {
                name: trimmedName ?? '',
                scopes,
                expiresAt: getEndOfDay(expiresAt ?? ''),
            },
        });
        const response = result.data?.private.createApiToken;
        if (response?.ok && isDefined(response.result)) {
            setFieldErrors({});
            setCreatedToken(response.result);
            onCreate();
            return;
        }

        const serverErrors = getFieldErrors(response?.errors);
        if (Object.keys(serverErrors).length === 0) {
            setFieldErrors({ nonFieldErrors: result.error?.message ?? 'Could not create the token. Try again.' });
            return;
        }
        setFieldErrors(serverErrors);
    }, [name, expiresAt, minDate, maxDate, maxDateLabel, scopes, createApiToken, onCreate]);

    const handleCopy = useCallback(async () => {
        if (isDefined(createdToken)) {
            await copy(createdToken.secret);
        }
    }, [copy, createdToken]);

    let content: React.ReactNode;
    if (isDefined(createdToken)) {
        const { secret, token } = createdToken;
        const visiblePrefix = `${TOKEN_PREFIX}${token.prefix}`;
        const hasKnownPrefix = secret.startsWith(visiblePrefix);

        content = (
            // NOTE: Sentry Replay blocks this subtree, so the secret is never recorded
            <div
                className={styles.reveal}
                data-sentry-block
            >
                <p className={styles.revealMeta}>
                    <b>{token.name}</b>
                    {` was created. It expires on ${formatTimestamp(token.expiresAt)}.`}
                </p>
                <Message
                    variant="warning"
                    role="note"
                    banner
                    icon={<RiErrorWarningLine />}
                    description={(
                        <>
                            You won&apos;t see this token again.
                            Copy it now and keep it somewhere safe, like a password manager.
                        </>
                    )}
                />
                <div className={styles.secret}>
                    <div
                        className={styles.secretValue}
                        data-sentry-mask
                    >
                        {hasKnownPrefix ? (
                            <>
                                <span className={styles.fixed}>{TOKEN_PREFIX}</span>
                                <span className={styles.id}>{token.prefix}</span>
                                {secret.slice(visiblePrefix.length)}
                            </>
                        ) : secret}
                    </div>
                    <div className={styles.secretFoot}>
                        {hasKnownPrefix && (
                            <span>
                                <span
                                    className={styles.idKey}
                                    aria-hidden
                                />
                                Prefix shown in your token list
                            </span>
                        )}
                        <span aria-live="polite">
                            <Button
                                name={undefined}
                                onClick={handleCopy}
                                title="Copy token"
                                variant={copyStatus === 'copied' ? 'secondary' : 'tertiary'}
                                icons={copyStatus === 'idle' && <RiFileCopyLine />}
                            >
                                {copyStatus === 'idle' && 'Copy'}
                                {copyStatus === 'copied' && 'Copied ✓'}
                                {copyStatus === 'failed' && 'Copy failed, select it manually'}
                            </Button>
                        </span>
                    </div>
                </div>
                <p className={styles.usage}>
                    Send it in the
                    {' '}
                    <code>Authorization: Bearer &lt;token&gt;</code>
                    {' '}
                    header.
                </p>
                <div className={styles.actions}>
                    <Button
                        name={undefined}
                        onClick={onClose}
                        title="Done"
                        variant="primary"
                    >
                        Done
                    </Button>
                </div>
            </div>
        );
    } else {
        content = (
            <form
                className={styles.form}
                onSubmit={handleSubmit}
                noValidate
            >
                <TextInput
                    inputElementRef={nameInputRef}
                    name={undefined}
                    label="Name"
                    variant="general"
                    value={name}
                    onChange={handleNameChange}
                    placeholder="e.g. Laptop scripts"
                    autoComplete="off"
                    maxLength={NAME_MAX_LENGTH}
                    hint={`Where the token is used, so you can tell tokens apart later. Up to ${NAME_MAX_LENGTH} characters.`}
                    error={fieldErrors.name}
                    aria-invalid={isDefined(fieldErrors.name)}
                    withAsterisk
                />
                <div className={styles.field}>
                    <RadioInput
                        name="expiry"
                        label="Expires after"
                        options={expiryOptions}
                        keySelector={expiryKeySelector}
                        labelSelector={expiryLabelSelector}
                        value={expiry}
                        onChange={handleExpiryChange}
                        listContainerClassName={styles.radios}
                        hint={expiry !== 'custom' && isDefined(expiresAt) && (
                            <>
                                Expires on
                                {' '}
                                <b>{formatTimestamp(getEndOfDay(expiresAt))}</b>
                                .
                            </>
                        )}
                        error={expiry !== 'custom' ? fieldErrors.expiresAt : undefined}
                    />
                    {expiry === 'custom' && (
                        <TextInput
                            className={styles.dateInput}
                            name={undefined}
                            type="date"
                            label="Expiry date"
                            variant="general"
                            value={customDate}
                            onChange={handleCustomDateChange}
                            min={minDate}
                            max={maxDate}
                            hint={`Any date from tomorrow to ${maxDateLabel}.`}
                            error={fieldErrors.expiresAt}
                            aria-invalid={isDefined(fieldErrors.expiresAt)}
                        />
                    )}
                </div>
                <div
                    className={styles.field}
                    role="group"
                    aria-labelledby={scopesLabelId}
                >
                    <InputLabel
                        id={scopesLabelId}
                        required
                    >
                        Scopes
                    </InputLabel>
                    <div
                        className={_cs(
                            styles.scopeTable,
                            isDefined(fieldErrors.scopes) && styles.errored,
                        )}
                    >
                        <div className={_cs(styles.scopeRow, styles.headRow)}>
                            <span>Resource</span>
                            <span>Read</span>
                            <span>Write</span>
                        </div>
                        {scopeGroups.map((group) => {
                            const writeChecked = isDefined(group.write)
                                && scopes.includes(group.write.key);
                            return (
                                <div
                                    key={group.key}
                                    className={styles.scopeRow}
                                >
                                    <div>
                                        <div className={styles.resource}>
                                            {group.label}
                                        </div>
                                        <div className={styles.description}>
                                            {group.description}
                                        </div>
                                    </div>
                                    {isDefined(group.read) ? (
                                        <Checkbox
                                            className={styles.check}
                                            name={group.read.key}
                                            value={writeChecked || scopes.includes(group.read.key)}
                                            onChange={handleScopeChange}
                                            disabled={writeChecked}
                                            tooltip={group.read.description}
                                            label={(
                                                <span className={shared.visuallyHidden}>
                                                    {group.read.label}
                                                </span>
                                            )}
                                        />
                                    ) : <span aria-hidden />}
                                    {isDefined(group.write) ? (
                                        <Checkbox
                                            className={styles.check}
                                            name={group.write.key}
                                            value={writeChecked}
                                            onChange={handleScopeChange}
                                            tooltip={group.write.description}
                                            label={(
                                                <span className={shared.visuallyHidden}>
                                                    {group.write.label}
                                                </span>
                                            )}
                                        />
                                    ) : <span aria-hidden />}
                                </div>
                            );
                        })}
                    </div>
                    <InputHint className={styles.hint}>
                        Write includes read.
                        Some data links to other resources:
                        time entries show their project only with Projects read.
                    </InputHint>
                    {isDefined(fieldErrors.scopes) && (
                        <InputHint
                            className={styles.hint}
                            error
                        >
                            {fieldErrors.scopes}
                        </InputHint>
                    )}
                </div>
                {isDefined(fieldErrors.nonFieldErrors) && (
                    <Message
                        variant="error"
                        role="alert"
                        banner
                        icon={<RiErrorWarningLine />}
                        description={fieldErrors.nonFieldErrors}
                    />
                )}
                <div className={styles.actions}>
                    <Button
                        name={undefined}
                        onClick={onClose}
                        title="Cancel"
                        variant="tertiary"
                        disabled={fetching}
                    >
                        Cancel
                    </Button>
                    <Button
                        name={undefined}
                        type="submit"
                        title="Create token"
                        variant="primary"
                        disabled={fetching}
                    >
                        Create token
                    </Button>
                </div>
            </form>
        );
    }

    return (
        <Dialog
            open
            onClose={onClose}
            heading={isDefined(createdToken) ? 'Copy your new token' : 'Create API token'}
            className={styles.createApiTokenDialog}
            contentClassName={styles.content}
            size="auto"
            focusElementRef={nameInputRef}
            // NOTE: Closing while the create request is pending would lose the secret
            persistent={isDefined(createdToken) || fetching}
        >
            {content}
        </Dialog>
    );
}

export default CreateApiTokenDialog;
