interface Props {
    current: number | undefined;
    total: number | undefined;
}

function SlideCounter(props: Props) {
    const { current, total } = props;

    if (!current || !total) {
        return null;
    }

    return (
        <span>
            {current}
            {' of '}
            {total}
        </span>
    );
}

export default SlideCounter;
