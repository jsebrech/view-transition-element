customElements.define('demo-page', class extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="${import.meta.resolve('./styles.css')}">
            <link rel="stylesheet" href="${import.meta.resolve('./animations.css')}">
            <div class="page">
                <div class="top">
                    <div class="top-nav">
                        <slot name="heading"></slot>
                    </div>
                </div>
                <div class="bottom">
                    <div class="content"><slot></slot></div>
                </div>
            </div>
        `;
    }
});
