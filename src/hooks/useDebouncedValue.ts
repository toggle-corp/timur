import {
    useEffect,
    useState,
} from 'react';

function useDebouncedValue<T>(
    input: T,
    debounceTime = 300,
): T {
    const [debounceValue, setDebouncedValue] = useState(
        () => input,
    );
    useEffect(() => {
        const handler = setTimeout(
            () => {
                setDebouncedValue(input);
            },
            debounceTime,
        );
        return () => {
            clearTimeout(handler);
        };
    }, [input, debounceTime]);
    return debounceValue;
}

export default useDebouncedValue;
