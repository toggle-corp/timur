import {
    isTruthyString,
    listToMap,
} from '@togglecorp/fujs';

// CustomErrorType is sent as-is from the backend, so its keys are snake_case
interface ErrorItem {
    field?: string;
    messages?: string | null;
    array_errors?: ({ messages?: string | null } | null)[] | null;
}

export type FieldErrors = Partial<Record<string, string>>;

// Flattens the `errors` of a mutation response (CustomErrorType) into one message per field.
// Errors without a field are keyed as `nonFieldErrors`.
export function getFieldErrors(errors: unknown): FieldErrors {
    if (!Array.isArray(errors)) {
        return {};
    }
    const fieldMessages = (errors as ErrorItem[])
        .map((item) => ({
            field: item.field ?? 'nonFieldErrors',
            message: [
                item.messages,
                ...(item.array_errors?.map((arrayError) => arrayError?.messages) ?? []),
            ].filter(isTruthyString).join(' '),
        }))
        .filter((item) => item.message.length > 0);
    return listToMap(
        fieldMessages,
        (item) => item.field,
        (item) => item.message,
    );
}
