import { useEffect } from 'react';

interface Options {
    // An inner layer, such as a tooltip, listens in the capture phase to handle a key
    // before the outer layers, and calls preventDefault so that they skip it
    capture?: boolean;
}

function useKeybind(callback: (event: KeyboardEvent) => void, options?: Options) {
    const capture = options?.capture ?? false;
    useEffect(
        () => {
            document.addEventListener('keydown', callback, capture);
            return () => {
                document.removeEventListener('keydown', callback, capture);
            };
        },
        [callback, capture],
    );
}

export default useKeybind;
