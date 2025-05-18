import { interceptNavigation } from '../lib/view-route.js';
import '../lib/view-transition.js';
import './app.js';

const app = () => {
    const root = document.getElementById('root');
    root.innerHTML = `<demo-app></demo-app>`;
    interceptNavigation(root);
}

document.addEventListener('DOMContentLoaded', app);
