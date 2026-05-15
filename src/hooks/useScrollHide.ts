import {
    RefObject,
    useEffect,
    useState,
} from 'react';

interface Options {
    revealBelow?: number;
    deadband?: number;
}

function useScrollHide(scrollRef: RefObject<HTMLElement | null>, options: Options = {}) {
    const {
        revealBelow = 60,
        deadband = 8,
    } = options;
    const [hidden, setHidden] = useState(false);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) {
            return undefined;
        }
        let lastY = el.scrollTop;
        let currentHidden = false;
        const handler = () => {
            const currentY = el.scrollTop;
            // NOTE: while near the top, always force-reveal regardless of direction. Covers programmatic scrolls, content removal, and any clamped scrollTop that would otherwise leave the element stuck off-screen at the top.
            if (currentY <= revealBelow) {
                if (currentHidden) {
                    currentHidden = false;
                    setHidden(false);
                }
                lastY = currentY;
                return;
            }
            const delta = currentY - lastY;
            // NOTE: deadband filters out rubber-band/overscroll jitter that would otherwise toggle state on micro-movements.
            if (Math.abs(delta) < deadband) {
                return;
            }
            if (delta > 0 && !currentHidden) {
                currentHidden = true;
                setHidden(true);
            } else if (delta < 0 && currentHidden) {
                currentHidden = false;
                setHidden(false);
            }
            lastY = currentY;
        };
        el.addEventListener('scroll', handler, { passive: true });
        return () => el.removeEventListener('scroll', handler);
    }, [scrollRef, revealBelow, deadband]);

    return hidden;
}

export default useScrollHide;
