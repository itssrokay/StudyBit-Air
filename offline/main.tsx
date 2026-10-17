import {nativeBridge} from '../lib/local-store';
import {initializeComputerConnection} from '../lib/wifi-sync';
import React from 'react';import {createRoot} from 'react-dom/client';import Dashboard from '../app/dashboard';import {configureLocalMode} from '../lib/client-api';import '../app/globals.css';import '../app/mobile.css';import '../app/goal-tools.css';
configureLocalMode();if(nativeBridge()||matchMedia('(max-width: 720px)').matches)document.documentElement.dataset.phone='true';await initializeComputerConnection();createRoot(document.getElementById('root')!).render(<React.StrictMode><Dashboard name="Learner" localMode/></React.StrictMode>);
