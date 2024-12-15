import React, { useEffect, useRef } from "react";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { $getRoot, CLEAR_HISTORY_COMMAND } from "lexical";
import { useSelectedEditContext } from "@/components/ui/UIProvider";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import Toolbar from "@/components/ui/Toolbar";

const Placeholder = () => {
  return (
    <div className="absolute top-[1.125rem] left-[1.125rem] opacity-50">
      Start writing...
    </div>
  );
};

function LexicalEditor() {
  // We use ref instead of state to store the text content of the editor because we don't want to trigger a re-render when the text content changes
  const text = useRef<Object>();
  const editorInfo: any = useSelectedEditContext();
  const [editor] = useLexicalComposerContext();

  // This function is used to handle the onChange event of the editor
  function onChange(editorState: any): any {
    let rootTree = null;
    editorState.read(() => {
      const root = $getRoot();
      text.current = formatNode(root);
      editorInfo.setSelectedEditIndex([
        editorInfo.selectedEditIndex[0],
        text.current,
        editorInfo.selectedEditIndex[2],
      ]);
    });
    return rootTree;
  }

  // This function is used to format the node and its children
  function formatNode(node: any): any {
    // Recursively format the node and its children
    const children = node.getChildren ? node.getChildren() : [];
    //This code is used to format the node and its children
    const formattedChildren = children.map((child: any) => formatNode(child));

    //The root node is a special case, as it has no parent
    if (node.getType() === "root") {
      return {
        root: {
          children: formattedChildren,
          direction: node.getDirection ? node.getDirection() : "ltr",
          format: node.getFormat ? node.getFormat() : "",
          indent: node.getIndent ? node.getIndent() : 0,
          type: node.getType ? node.getType() : "unknown",
          version: node.getVersion ? node.getVersion() : 1,
          ...(node.getTextContent &&
            node.getType() === "text" && { text: node.getTextContent() }),
          ...(node.getDetail && { detail: node.getDetail() }),
          ...(node.getMode && { mode: node.getMode() }),
          ...(node.getStyle && { style: node.getStyle() }),
        },
      };
    } else {
      return {
        children: formattedChildren,
        direction: node.getDirection ? node.getDirection() : "ltr",
        format: node.getFormat ? node.getFormat() : "",
        indent: node.getIndent ? node.getIndent() : 0,
        type: node.getType ? node.getType() : "unknown",
        version: node.getVersion ? node.getVersion() : 1,
        ...(node.getTextContent &&
          node.getType() === "text" && { text: node.getTextContent() }),
        ...(node.getDetail && { detail: node.getDetail() }),
        ...(node.getMode && { mode: node.getMode() }),
        ...(node.getStyle && { style: node.getStyle() }),
      };
    }
  }

  useEffect(() => {
    // Load the selected edit ID contents into the editor whenever the selected edit ID changes
    if (editorInfo.selectedEditIndex[1]) {
      try {
        const parsedEditorState: any = editor.parseEditorState(
          JSON.stringify(editorInfo.selectedEditIndex[1][0])
        );
        editor.update(() => {
          editor.setEditorState(parsedEditorState);
          editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined);
        });
      } catch (error) {
        console.error("Error parsing editor state:", error);
      }
    }
  }, [editorInfo.selectedEditIndex[0], editor]);

  return (
    <div>
      <RichTextPlugin
        contentEditable={<ContentEditable className="editor-content" />}
        placeholder={<Placeholder />}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <OnChangePlugin onChange={onChange} />
    </div>
  );
}

export default function Editor() {
  return (
    <div>
      <div id="editor-wrapper">
        <Toolbar />
        <LexicalEditor />
      </div>
    </div>
  );
}
