import './layout.js';
import { ChevronLeft, PlayIcon, PauseIcon } from './icons.js';
import { fetchVideo, fetchVideoDetails } from './data.js';

customElements.define('demo-details', class extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <view-route path="/video/(?<id>[\\w]+)">
                <demo-page>
                    <a class="link fit back" href="/" slot="heading">
                        ${ChevronLeft()} Back
                    </a>
                    <div class="details">
                        <demo-video></demo-video>
                        <demo-video-details></demo-video-details>
                    </div>
                </demo-page>
            </view-route>
        `;
        this.id = null;
        this.addEventListener('routechange', this);
    }
    
    handleEvent(e) { 
        if (e.type === 'routechange') {
            this.update(e.detail?.groups?.id);
        }
    }

    update(id) {
        const videoElem = this.querySelector('demo-video');
        if (id) {
            fetchVideo(id).then(video => {
                videoElem.innerHTML = `
                    <div
                        aria-hidden="true"
                        class="thumbnail ${video.image}">
                        <demo-video-controls></demo-video-controls>
                    </div>
                `;
            });
            this.querySelector('demo-video-details').update(id);
        } else {
            videoElem.innerHTML = '';
        }
    }
});

customElements.define('demo-video-details', class extends HTMLElement {
    update(id) {
        if (id) {
            this.innerHTML = videoInfoFallback();
            fetchVideoDetails(id).then(video => {
                this.innerHTML = videoInfo(video);
            });
        } else this.innerHTML = '';
    }
});

customElements.define('demo-video-controls', class extends HTMLElement {
    isPlaying = false;
    connectedCallback() {
        this.innerHTML = `
            <span class="controls">
                ${PlayIcon()}
            </span>
        `;
        this.addEventListener('click', this);
        this.update();
    }
    handleEvent(e) {
        this.isPlaying = !this.isPlaying;
        this.update();
    }
    update() {
        this.querySelector('span').innerHTML = this.isPlaying ? PauseIcon() : PlayIcon();
    }
})

const videoInfoFallback = () => `
    <div class="fallback title"></div>
    <div class="fallback description"></div>
`;

const videoInfo = (details) => `
    <p class="info-title">${details.title}</p>
    <p class="info-description">${details.description}</p>
`;