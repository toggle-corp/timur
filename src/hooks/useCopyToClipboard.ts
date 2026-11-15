import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

type CopyStatus = 'idle' | 'copied' | 'failed';

const RESET_DELAY = 2000;

function useCopyToClipboard() {
    const [status, setStatus] = useState<CopyStatus>('idle');
    const timeoutRef = useRef<number | undefined>(undefined);

    useEffect(() => () => {
        window.clearTimeout(timeoutRef.current);
    }, []);

    const copy = useCallback(async (text: string) => {
        window.clearTimeout(timeoutRef.current);
        let newStatus: CopyStatus;
        try {
            // NOTE: navigator.clipboard is undefined outside secure contexts
            await navigator.clipboard.writeText(text);
            newStatus = 'copied';
        } catch {
            newStatus = 'failed';
        }
        setStatus(newStatus);
        timeoutRef.current = window.setTimeout(() => setStatus('idle'), RESET_DELAY);
        return newStatus === 'copied';
    }, []);

    return { status, copy };
}

export default useCopyToClipboard;
