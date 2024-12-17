import { EditorConfig, NodeKey, SerializedTextNode, TextNode } from "lexical";
export function $createEdgeNode(text: string): EdgeNode {
  return new EdgeNode(text);
}

export class EdgeNode extends TextNode {
  __text: string;

  constructor(text: string, key?: NodeKey) {
    super(text, key);
    this.__text = text;
  }

  static getType(): string {
    return "edge";
  }

  getText(): string {
    return this.__text;
  }

  static clone(node: EdgeNode): EdgeNode {
    return new EdgeNode(node.__text);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config);
    element.style.color = "red";
    element.setAttribute("data-edge-node", "true");
    return element;
  }

  updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean {
    const isUpdated = super.updateDOM(prevNode, dom, config);
    if (prevNode.__text !== this.__text) {
      dom.setAttribute("data-custom-property", this.__text);
    }
    return isUpdated;
  }

  exportJSON(): SerializedTextNode {
    return {
      ...super.exportJSON(),
      type: "edge",
      version: 1,
      text: this.__text,
    };
  }

  static importJSON(serializedNode: SerializedTextNode): EdgeNode {
    return new EdgeNode(serializedNode.text);
  }
}

export function $isEdgeNode(node: any): node is EdgeNode {
  return node instanceof EdgeNode;
}
