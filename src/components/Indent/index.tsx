import styles from './styles.module.css';

interface Props {
    level: number;
}

function Indent(props: Props) {
    const { level } = props;

    if (level === 0) {
        return null;
    }

    return (
        <div className={styles.indent}>
            {Array.from(new Array(level).keys()).map((key) => (
                <span key={key} className={styles.item} />
            ))}
        </div>
    );
}

export default Indent;
