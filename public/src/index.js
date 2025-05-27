import { interceptNavigation, routerEvents, pushState } from '../lib/view-route.js';
import { startTransition } from '../lib/view-transition.js';
import './App.js';

const app = () => {
    // intercept default router behavior to make it animate view transitions
    routerEvents.addEventListener('navigate', (e) => {
        e.stopImmediatePropagation();
        const { url, a } = e.detail;
        const isBackNav = a?.hasAttribute('back');
        startTransition(
            () => {
                pushState(null, null, url);
                // give routes time to render before snapshotting
                return new Promise(resolve => setTimeout(resolve, 10));
            }, 
            isBackNav ? 'nav-back' : 'nav-forward');
    }, { capture: true });

    const root = document.getElementById('root');
    root.innerHTML = `<demo-app></demo-app>`;
    interceptNavigation(root);
}

document.addEventListener('DOMContentLoaded', app);
