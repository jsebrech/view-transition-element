export const routerEvents = new EventTarget();

const baseURL = new URL(window.originalHref || document.URL);
const basePath = baseURL.pathname.slice(0, baseURL.pathname.lastIndexOf('/'));

const handleLinkClick = (e) => {
    const a = e.target.closest('a');
    if (a && a.href) {
        e.preventDefault();
        const anchorUrl = new URL(a.href);
        const pageUrl = basePath + anchorUrl.pathname + anchorUrl.search + anchorUrl.hash;
        routerEvents.dispatchEvent(new CustomEvent('navigate', { detail: { url: pageUrl, a }}));
    }
}

const handleNavigate = (e) => {
    pushState(null, null, e.detail.url);
}

/** 
 * intercept link navigation for all links inside root, 
 * and do single-page navigation using pushState instead.
 * @param {HTMLElement} root
 */
export const interceptNavigation = (root) => {
    root.addEventListener('click', handleLinkClick);
    // by default, navigate events cause pushState() calls
    // add capturing listener to routerEvents before interceptNavigation() to prevent
    routerEvents.addEventListener('navigate', handleNavigate);
}

/**
 * Notify routes on popstate (browser back/forward)
 * @param {PopStateEvent} e 
 */
export const handlePopState = (e) => {
    routerEvents.dispatchEvent(new PopStateEvent('popstate', { state: e.state }));
}
window.addEventListener('popstate', handlePopState);

/**
 * Navigate to a new state and update routes
 * @param {*} state 
 * @param {*} unused 
 * @param {*} url 
 */
export const pushState = (state, unused, url) => {
    history.pushState(state, unused, url);
    routerEvents.dispatchEvent(new PopStateEvent('popstate', { state }));
}

/**
 * Match a path against the current document's location pathname (case-insensitive)
 * @param {string} path The path to match, if started with a slash it is treated as relative to the document's URL
 * @param {boolean} exact If true, the document's location must have no further path components
 * @returns An array containing the matched path components, null if no match.
 */
export const matchesRoute = (path, exact) => {
    const fullPath = path.startsWith('/') ? basePath + '(' + path + ')' : '(' + path + ')';
    const regex = new RegExp(`^${fullPath.replaceAll('/', '\\/')}${exact ? '$' : ''}`, 'gi');
    const relativeUrl = location.pathname;
    return regex.exec(relativeUrl);
}

/**
 * Usage:
 * <view-route path="/(?:index.html)?" exact><p>hello</p><view-route> = only match / or /index.html and show the text "hello"
 * <view-route path="/"> = match every route below / (e.g. for site navigation)
 * <view-route path="/todos/([\w]+)"> = match #/todos/:id
 * <view-route path="*"> = match if no other route matches within the same parent node
 * 
 * routechange event contains detail.matches, the array of matched parts of the regex
 */
customElements.define('view-route', class extends HTMLElement {

    #matches = [];

    get isActive() {
        return !!this.#matches?.length;
    }

    get matches() {
        return this.#matches;
    }

    set matches(v) {
        this.#matches = v;
        this.style.display = this.isActive ? 'contents' : 'none';
        if (this.isActive) {
            this.dispatchEvent(new CustomEvent('routechange', { detail: v, bubbles: true }));
        }
    }

    connectedCallback() {
        routerEvents.addEventListener('popstate', this);
        this.update();
    }

    disconnectedCallback() {
        routerEvents.removeEventListener('popstate', this);
    }

    handleEvent(e) {
        this.update();
    }

    static get observedAttributes() {
        return ['path', 'exact'];
    }

    attributeChangedCallback() {
        this.update();
    }

    update() {
        const path = this.getAttribute('path') || '/';
        const exact = this.hasAttribute('exact');
        this.matches = this.matchesRoute(path, exact) || [];
    }

    matchesRoute(path, exact) {
        // '*' triggers fallback route if no other route on the same DOM level matches
        if (path === '*') {
            const activeRoutes = 
                Array.from(this.parentNode.getElementsByTagName('view-route')).filter(_ => _.isActive);
            if (!activeRoutes.length) return [location.pathname, '*'];
        // normal routes
        } else {
            return matchesRoute(path, exact);
        }
        return null;
    }
});
