import './like-button.js';

customElements.define('demo-video', class extends HTMLElement {
    update(video) {
        this.innerHTML = `
            <div class="video">
                <a class="link" href="/video/${video.id}">
                    <view-transition name="video-${video.id}">
                        <div
                            aria-hidden="true"
                            tabIndex={-1}
                            class="thumbnail ${video.image}">
                        </div>
                    </view-transition>

                    <div class="info">
                        <div class="video-title">${video.title}</div>
                        <div class="video-description">${video.description}</div>
                    </div>
                </a>
                <demo-video-like id="${video.id}"></demo-video-like>
            </div>
        `;
    }
});
