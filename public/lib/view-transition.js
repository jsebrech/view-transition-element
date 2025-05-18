let nextId = 0;

customElements.define('view-transition', class extends HTMLElement {
    #defaultName = 'VT_' + nextId++;

    get name() { return this.getAttribute('name') }
    set name(v) { this.setAttribute('name', v) }

    static get observedAttributes() { return ['name'] }
    attributeChangedCallback() {
        this.update();
    }

    connectedCallback() {
        this.style.display = 'contents';
        this.update();
    }

    update() {
        this.style.viewTransitionName = this.name || this.#defaultName;
    }

});

// the currently animating view transition
let currentTransition = null;
// the next transition to run (after currentTransition completes)
let nextTransition = null;

/** start a view transition or queue it for later if one is already animating */
export const startTransition = (updateCallback) => {
    if (document.startViewTransition) {
        // if a transition is already animating, bundle updates into the next transition
        if (currentTransition) {
            if (!nextTransition) {
                nextTransition = new QueueingViewTransition();
            }
            return nextTransition.addCallback(updateCallback);
        // if no transition is currently animating, start animating the new transition
        } else {
            currentTransition = document.startViewTransition(updateCallback);
            // and after it's done, execute any queued transition
            currentTransition.finished.finally(() => {
                if (nextTransition) {
                    currentTransition = nextTransition;
                    nextTransition = null;
                    currentTransition.run();
                }
            });
            return currentTransition;
        }
    } else {
        // fake view transition in firefox
        return {
            updateCallbackDone: updateCallback(),
            ready: Promise.resolve(),
            finished: Promise.resolve(),
            skipTransition: () => {}
        };
    }
}

export const transitionIsPending = () => {
    return !!currentTransition;
}

class QueueingViewTransition {
    #updateCallbackDone = Promise.withResolvers();
    #ready = Promise.withResolvers();
    #finished = Promise.withResolvers();
    #callbacks = [];
    #activeViewTransition = null;

    addCallback(updateCallback) {
        this.#callbacks.push(updateCallback);
        return this;
    }

    run(skipTransition = false) {
        // already running
        if (this.#activeViewTransition) return;

        const callback = () => {
            // execute callbacks in order in case later ones depend on DOM changes of earlier ones
            let promise = this.#callbacks.reduce(
                (prev, cur) => prev.then(cur),
                Promise.resolve()
            );
            return promise.then(this.#updateCallbackDone.resolve, this.#updateCallbackDone.reject);
        };
        // jump to the end
        if (skipTransition) {
            callback()
                .then(this.#ready.resolve, this.#ready.reject)
                .then(this.#finished.resolve, this.#finished.reject);
        // start animating
        } else {
            this.#activeViewTransition = document.startViewTransition(callback);
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