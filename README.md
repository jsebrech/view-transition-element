# Vanilla view transitions

A vanilla JS implementation of a single page router `<view-route>` 
and declarative view transitions using a `<view-transition>` custom element. 
Both can be used independently.

The `<view-transition>` element is loosely based on React's `<ViewTransition>`:
https://react.dev/blog/2025/04/23/react-labs-view-transitions-activity-and-more

More specifically, the example here is based on the *final result* example code of that blog post:
https://codesandbox.io/p/sandbox/njn4yc

This repo can also be used as a template for a vanilla single-page application.

Works in Chrome, Edge, Safari, Firefox (no transitions).

View transition support for Firefox is planned on their roadmap: https://bugzilla.mozilla.org/show_bug.cgi?id=1823896

Part of the [Plain Vanilla Web](https://plainvanillaweb.com) project.

## Using

Drop the web components from the `lib/` folder into a vanilla project and load them into the document to start using.

### view-route

A routing custom element that wraps content that is conditional on the current route.

`lib/view-route.js`

```html
<!-- Basic routing -->
<view-route path="/home">Home content</view-route>
<view-route path="/about">About content</view-route>

<!-- Exact match -->
<view-route path="/(?:index.html)?" exact>Landing page</view-route>

<!-- Dynamic routes with parameters -->
<view-route path="/video/([\w]+)">Video details</view-route>

<!-- Fallback route -->
<view-route path="*">404 Not Found</view-route>
```

```js
import { interceptNavigation, pushState } from './lib/view-route.js';

// Enable SPA navigation for all links
interceptNavigation(document.body);

// Programmatic navigation
pushState(null, null, '/new-path');

// Access route matches
document.querySelector('view-route').addEventListener('routechange', e => {
  console.log('Route matches:', e.detail.matches);
});
```

See [jsebrech/view-route](https://github.com/jsebrech/view-route) for more info.

### view-transition

A declarative view transition custom element that marks its contents as taking part as a separate entity in a view transition. It also automatically makes itself
visible to light DOM view transitions when it is in a shadow DOM.

When possible it is recommended to set `view-transition-name` styles directly instead of using this custom element. This example demonstrates both approaches.

`lib/view-transition.js`

```html
<!-- Named transitions for shared elements -->
<view-transition name="hero-image">
  <img src="image.jpg" alt="Hero">
</view-transition>

<!-- Auto-generated names -->
<view-transition>
  <div class="card">Content</div>
</view-transition>
```

The `startTransition` is similar to native `document.startViewTransition` except that it will queue new transitions
if an existing one is already executing, instead of aborting the current one.

```js
import { startTransition } from './lib/view-transition.js';

// Trigger view transition
startTransition(() => {
  // DOM updates here
  element.textContent = 'New content';
});

// With transition type
startTransition(() => {
  updateDOM();
}, 'slide-left');
```

To combine `startTransition` view transitions with `pushState` single-page routing see `index.js`.

### html

HTML-encoding in template literals is done using [html-literal](https://github.com/jsebrech/html-literal), which is bundled in this repo.

## Example

Run the example single-page application with `npx serve public`

Redirecting the `/video/...` routes to `index.html` is handled by `serve.json` when running through `npx serve`, 
and by `404.html` when deployed on GitHub Pages. When deploying elsewhere a different redirect mechanism should be configured.
