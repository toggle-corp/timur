import { createContext } from 'react';

const DialogContext = createContext<{ dialogRef?: React.RefObject<HTMLDialogElement> }>({
});

export default DialogContext;
