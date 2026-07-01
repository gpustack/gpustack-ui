// Wrapper around core-ui's FullMarkdown that co-locates the KaTeX stylesheet.
//
// core-ui deliberately does NOT bundle katex.min.css (importing it there
// base64-inlines ~1.4MB of fonts into the shared, render-blocking index.css).
// Importing it here keeps the KaTeX CSS in the route chunk that actually
// renders math, so it loads lazily and never blocks first paint.
//
// Always import FullMarkdown from this module, not from '@gpustack/core-ui/markdown'.
import { FullMarkdown } from '@gpustack/core-ui/markdown';
import 'katex/dist/katex.min.css';

export default FullMarkdown;
