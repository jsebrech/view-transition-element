let nextId = 0;

customElements.define('view-transition', class extends HTMLElement {
    #defaultName = 'VT_' + nextId++;

    get name() { return this.getAttribute('name') }
    set name(v) { this.setAttribute('name', v); }

    static get observedAttributes() { return ['name'] }
    attributeChangedCallback() {
        this.update();
    }

    connectedCallback() {
        this.update();
    }

    update() {
        this.style.viewTransitionName = this.name || this.#defaultName;
        // if this is inside a shadow dom, make it visible to light dom view transitions
        // by setting view-transition-name on a shadow part from a light dom stylesheet
        if (this.getRootNode() instanceof ShadowRoot) {
            if (!this.hasAttribute('part')) {
                this.setAttribute('part', this.#defaultName);
            }
            const stylesheet = getTransitionStyleSheet();
            const localName = this.getRootNode().host.localName;
            // delete the old rule
            const oldIndex = [...stylesheet.cssRules].findIndex(r => {
                const match = /^([^:]+)::part\(([^)]+)\)/.exec(r.selectorText);
                if (match && match[1] === localName && match[2] === this.getAttribute('part')) return true;
            });
            if (oldIndex >= 0) stylesheet.deleteRule(oldIndex);
            // add the new rule
            stylesheet.insertRule(
                `${localName}::part(${this.getAttribute('part')}) { 
                    view-transition-name: ${this.style.viewTransitionName};
                }`);
            console.log(this, stylesheet);
        }
    }
});

const getTransitionStyleSheet = () => {
    const adoptedStyleSheets = document.adoptedStyleSheets;
    let stylesheet = adoptedStyleSheets.find(s => s.id === 'view-transition');
    if (!stylesheet) {
        stylesheet = new CSSStyleSheet();
        stylesheet.id = 'view-transition';
        adoptedStyleSheets.push(stylesheet);
    }
    return stylesheet;
}

export const transitionEvents = new EventTarget();

// the currently animating view transition
let currentTransition = null;
// the next transition to run (after currentTransition completes)
let nextTransition = null;

/** start a view transition or queue it for later if one is already animating */
export const startTransition = (updateCallback, transitionType) => {
    console.log('startTransition');
    if (!updateCallback) updateCallback = () => {};
    // a transition is active
    if (currentTransition) {
        // it is running callbacks, but not yet animating
        if (!currentTransition.isReady) {
            currentTransition.addCallback(updateCallback);
            return currentTransition;
        // it is already animating, queue callback in the next transition
        } else {
            if (!nextTransition) {
                nextTransition = new QueueingViewTransition(transitionType);
            }
            return nextTransition.addCallback(updateCallback);
        }
    // if no transition is active, start animating the new transition
    } else {
        currentTransition = new QueueingViewTransition(transitionType);
        currentTransition.addCallback(updateCallback);
        currentTransition.run();
        // after it's done, execute any queued transition
        const doNext = () => {
            if (nextTransition) {
                currentTransition = nextTransition;
                nextTransition = null;
                currentTransition.run();
                currentTransition.finished.finally(doNext);
            } else {
                currentTransition = null;
            }
        }
        currentTransition.finished.finally(doNext);
        return currentTransition;
    }
}

const doViewTransition = (updateCallback, transitionType) => {
    transitionEvents.dispatchEvent(new CustomEvent('transitionstart', { detail: { transitionType } }));
    let transition;
    if (document.startViewTransition) {
        transition = document.startViewTransition(updateCallback);
    } else {
        // fake view transition in firefox
        transition = {
            updateCallbackDone: updateCallback(),
            ready: Promise.resolve(),
            finished: Promise.resolve(),
            skipTransition: () => {}
        };
    }
    transition.finished.finally(() => {
        transitionEvents.dispatchEvent(new CustomEvent('transitionend', { detail: { transitionType } }));  
    });
    return transition;
}

let nextQueueId = 0;

class QueueingViewTransition {
    #id = nextQueueId++;
    #updateCallbackDone = Promise.withResolvers();
    #ready = Promise.withResolvers();
    #finished = Promise.withResolvers();
    #callbacks = [];
    #activeViewTransition = null;
    #transitionType;

    get id() { return this.#id; }

    // transition is running
    isRunning = false;
    // callbacks are complete, animation will start
    isReady = false;
    // animation is complete
    isFinished = false;

    constructor(transitionType) {
        console.log('new transition', this.id);
        this.#transitionType = transitionType;
        this.ready.finally(() => this.isReady = true);
        this.finished.finally(() => (this.isFinished = true) && console.log('finished transition', this.id));
    }

    addCallback(updateCallback) {
        console.log('add callback', this.id, updateCallback);
        if (typeof updateCallback !== 'function') throw new Error('updateCallback must be a function');
        if (this.isReady) throw new Error('view transition already started');
        this.#callbacks.push(updateCallback);
        return this;
    }

    run(skipTransition = false) {
        console.log('run transition', this.id);
        // already running
        if (this.isRunning) return;
        this.isRunning = true;

        // execute callbacks in order in case later ones depend on DOM changes of earlier ones
        // but do it async to allow callbacks to be added until animation starts
        const doNext = () => {
            if (this.#callbacks.length) {
                const callback = this.#callbacks.shift();
                return Promise.try(callback).then(doNext);
            }
        };

        const callback = () => {
            return doNext().then(this.#updateCallbackDone.resolve, this.#updateCallbackDone.reject);
        };

        // jump to the end
        if (skipTransition) {
            callback()
                .then(this.#ready.resolve, this.#ready.reject)
                .then(this.#finished.resolve, this.#finished.reject);
        // start animating
        } else {
            console.log('start view transition', this.id, [...document.querySelectorAll('view-transition')].map(v => [v, v.style.viewTransitionName]));
            this.#activeViewTransition = doViewTransition(callback, this.#transitionType);
            this.#activeViewTransition.ready.then(this.#ready.resolve, this.#ready.reject);
            this.#activeViewTransition.finished.then(this.#finished.resolve, this.#finished.reject);
        }
    }

    // callbacks have fulfilled their promise
    get updateCallbackDone() { return this.#updateCallbackDone.promise }
    // animation is about to start
    get ready() { return this.#ready.promise }
    // animation has completed
    get finished() { return this.#finished.promise }

    skipTransition() {
        if (this.#activeViewTransition) {
            this.#activeViewTransition.skipTransition();
        } else {
            this.run(true);
        }
    }
}