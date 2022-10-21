import React from 'react';
import ReactDom from 'react-dom/client';

import App from './App';

const container = document.getElementById('root') as Element;

ReactDom.createRoot(container).render(<App />);
