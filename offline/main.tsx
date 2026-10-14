import {initializeComputerConnection} from '../lib/wifi-sync';
import React from 'react';import {createRoot} from 'react-dom/client';import Dashboard from '../app/dashboard';import {configureLocalMode} from '../lib/client-api';import '../app/globals.css';
configureLocalMode();await initializeComputerConnection();createRoot(document.getElementById('root')!).render(<React.StrictMode><Dashboard name="Learner" localMode/></React.StrictMode>);
