import './index.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import {
    isNotDefined,
} from '@togglecorp/fujs';

import App from './App/index.tsx';

const webappRootId = 'webapp-root';
const webappRootElement = document.getElementById(webappRootId);

if (isNotDefined(webappRootElement)) {
    // eslint-disable-next-line no-console
    console.error(`Could not find html element with id '${webappRootId}'`);
} else {
    ReactDOM.createRoot(webappRootElement).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
    );
}
