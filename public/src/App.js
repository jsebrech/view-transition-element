import '../lib/view-transition.js';
import './Home.js';
import './Details.js';

customElements.define('demo-app', class extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <view-transition>
            <view-route path="/(?:index.html)?" exact>
                <demo-home></demo-home>
            </view-route>
            <view-route path="/video">
                <demo-details></demo-details>
            </view-route>
        </view-transition>
        `;
    }
});
