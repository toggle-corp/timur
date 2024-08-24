import { createContext } from 'react';

import {
    getWindowSize,
    Size,
} from '#utils/common';

export type SizeContextProps = Size;

const SizeContext = createContext<SizeContextProps>({
    ...getWindowSize(),
});

export default SizeContext;
