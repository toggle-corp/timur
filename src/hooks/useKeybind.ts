import { useEffect } from 'react';

function useKeybind(callback: (event: KeyboardEvent) => void) {
    useEffect(
        () => {
            document.addEventListener('keydown', callback);
            return () => {
                document.removeEventListener('keydown', callback);
            };
        },
        [callback],
    );
}

export default useKeybind;
