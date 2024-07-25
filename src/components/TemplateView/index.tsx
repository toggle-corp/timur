import { _cs } from '@togglecorp/fujs';

import styles from './styles.module.css';

interface Props {
    className?: string;
    title: string;
}

// eslint-disable-next-line import/prefer-default-export
export function Component(props: Props) {
    const {
        className,
        title,
    } = props;

    return (
        <div className={_cs(className, styles.container)}>
            <h2>
                {title}
            </h2>
        </div>
    );
}

Component.displayName = 'TemplateView';
