import { createContext } from 'react';

const DialogContext = createContext<{ dialogRef?: React.RefObject<HTMLDialogElement | null> }>({
});

export default DialogContext;
