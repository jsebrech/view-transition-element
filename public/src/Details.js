import './Layout.js';
import { startTransition } from '../lib/view-transition.js';
import { ChevronLeft } from './Icons.js';
import { fetchVideo, fetchVideoDetails } from './data.js';

customElements.define('demo-details', class extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <view-route path="/video/(?<id>[\\w]+)">
                <demo-page>
                    <div slot="heading">
                        <a class="link fit back" href="/" back>
                            ${ChevronLeft()} Back
                        </a>
                    </div>
                    <div class="details">
                        <demo-video></demo-video>
                        <demo-video-details></demo-video-details>
                    </div>
                </demo-page>
            </view-route>
        `;
        const id = this.querySelector('view-route').matches?.groups?.id ?? null;
        this.update(id);
        this.addEventListener('routechange', this);
    }
    
    handleEvent(e) { 
        if (e.type === 'routechange') {
            this.update(e.detail?.groups?.id);
        }
    }

    update(id) {
        const videoElem = this.querySelector('demo-video');
        videoElem.innerHTML = '';
        if (id) {
            startTransition(() => fetchVideo(id).then(video => {
                videoElem.innerHTML = `
                    <view-transition name="video-${video.id}">
                        <div
                            aria-hidden="true"
                            class="thumbnail ${video.image}">
                            <demo-video-controls></demo-video-controls>
                        </div>
                    </view-transition>
                `;
            }));
            this.querySelector('demo-video-details').update(id);
        }
    }
});

customElements.define('demo-video-details', class extends HTMLElement {
    async update(id) {
        if (id) {
            const load = fetchVideoDetails(id);
            const wait = new Promise((resolve) => { setTimeout(resolve, 10, null); });
            let video = await Promise.race([load, wait]);
            if (video) {
                this.innerHTML = videoInfo(video);
            } else {
                // animate fallback in by sliding up
                this.innerHTML = `<view-transition name="slide-up">${videoInfoFallback()}</view-transition>`;
                video = await load;
                // animate fallback out by sliding down
                this.querySelector('view-transition').name = 'slide-down';
                // animate content in by sliding up
                startTransition(() => {
                    this.innerHTML = 
                        `<view-transition name="slide-up">${videoInfo(video)}</view-transition>`;
                }).finished.then(() => {
                    this.querySelector('view-transition').name = '';
                });
            }
        } else this.innerHTML = '';
    }
});

const videoInfoFallback = () => `
    <div class="fallback title"></div>
    <div class="fallback description"></div>
`;

const videoInfo = (details) => `
    <p class="info-title">${details.title}</p>
    <p class="info-description">${details.description}</p>
`;