import { createPortal } from 'react-dom';

export interface Props {
    portalKey?: string;
    container?: React.RefObject<Element | DocumentFragment>;
    children: React.ReactNode;
}

function Portal(props: Props) {
    const {
        children,
        container,
        portalKey,
    } = props;

    const ref = container
        ? container.current
        : document.body;

    // NOTE: Should we instead just use document.body?
    if (!ref) {
        return null;
    }

    return (
        <>
            {createPortal(
                children,
                ref,
                portalKey,
            )}
        </>
    );
}

export default Portal;
