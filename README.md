# graphijs

`graphijs` is an npm package for working with graphs in JavaScript projects. You can easily use it in React, Next.js, Vite, and many other JavaScript frameworks and environments.

## Installation

Install via npm:

```bash
npm install graphijs
```

## Usage

You can import and use `graphijs` in your JavaScript or TypeScript code:

```js
// ES Modules
import { Graph } from 'graphijs';

// CommonJS
const { Graph } = require('graphijs');
```

### Example in React

```jsx
import React from 'react';
import { Graph } from 'graphijs';

function MyComponent() {
  React.useEffect(() => {
    const g = new Graph();
    g.addNode('A');
    g.addNode('B');
    g.addEdge('A', 'B');
    // Use your graph logic here
  }, []);

  return <div>Check console for graph operations.</div>;
}

export default MyComponent;
```

### Example in Next.js

```js
import { Graph } from 'graphijs';

export default function Home() {
  React.useEffect(() => {
    const g = new Graph();
    // Your logic here
  }, []);
  return <main>Graphijs in Next.js!</main>;
}
```

### Example in Vite

Just import and use as shown above; Vite supports both ES Modules and CommonJS.

## Supported Environments

- React
- Next.js
- Vite
- Any JavaScript runtime (Node.js, browser, etc.)

## Features

- Create and manipulate graphs
- Add nodes and edges
- Integrate into any frontend or backend JS project

## License

MIT
