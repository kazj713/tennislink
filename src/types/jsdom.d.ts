declare module 'jsdom' {
  export class JSDOM {
    window: Window;
    constructor(html: string, options?: any);
  }

  interface Window {
    document: Document;
  }

  interface HTMLElement {
    innerHTML: string;
    innerText: string;
    value?: string;
    textContent: string;
    appendChild(node: Node): void;
    setAttribute(name: string, value: string): void;
    getAttribute(name: string): string | null;
  }

  interface Text {
    nodeValue: string | null;
  }

  interface Node {
    nodeType: number;
  }
}
