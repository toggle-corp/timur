import {
    useEffect,
    useState,
} from 'react';

import SizeContext, { SizeContextProps } from '#contexts/size';
import useThrottledValue from '#hooks/useThrottledValue';
import { getWindowSize } from '#utils/common';

interface BaseProps {
    children: React.ReactNode;
}

function SizeProvider(props: BaseProps) {
    const { children } = props;

    const [size, setSize] = useState<SizeContextProps>(getWindowSize);
    const throttledSize = useThrottledValue(size);

    useEffect(() => {
        function handleResize() {
            setSize(getWindowSize());
        }

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <SizeContext.Provider value={throttledSize}>
            {children}
        </SizeContext.Provider>
    );
}

export default SizeProvider;
