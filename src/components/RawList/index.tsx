import {
    Fragment,
    Key,
} from 'react';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';

export type ListKey = Key | boolean;

export type Props<DATUM, KEY extends ListKey, RENDERER_PROPS> = {
    data: DATUM[] | undefined | null;
    keySelector(datum: DATUM, index: number): KEY;
    renderer: React.ComponentType<RENDERER_PROPS>;
    rendererParams(key: KEY, datum: DATUM, index: number, data: DATUM[]): RENDERER_PROPS;
    separator?: React.ReactNode;
};

function RawList<DATUM, KEY extends ListKey, RENDERER_PROPS>(
    props: Props<DATUM, KEY, RENDERER_PROPS>,
) {
    const {
        data,
        keySelector,
        renderer: Renderer,
        rendererParams,
        separator,
    } = props;

    if (isNotDefined(data)) {
        return null;
    }

    return (
        <>
            {data.map(
                (datum, i) => {
                    const key = keySelector(datum, i);
                    const rendererProps = rendererParams(key, datum, i, data);

                    return (
                        <Fragment key={String(key)}>
                            <Renderer
                                key={String(key)}
                                // eslint-disable-next-line react/jsx-props-no-spreading
                                {...rendererProps}
                            />
                            {isDefined(separator) && i < (data.length - 1) && separator}
                        </Fragment>
                    );
                },
            )}
        </>
    );
}

export default RawList;
