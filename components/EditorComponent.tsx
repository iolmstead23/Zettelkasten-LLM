import React, { useEffect, useRef } from 'react';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { $getRoot, CLEAR_HISTORY_COMMAND } from 'lexical';
import { useSelectedEditContext } from '@/components/ui/UIProvider';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import Toolbar from '@/components/ui/Toolbar'; // Import the FixedToolbar component

const Placeholder = () => {
  return (
    <div className="absolute top-[1.125rem] left-[1.125rem] opacity-50">
      Start writing...
    </div>
  );
};

function LexicalEditor() {
  const text = useRef<Object>();
  const editorInfo: any = useSelectedEditContext();
  const [editor] = useLexicalComposerContext();

  function onChange(editorState: any): any {
    let rootTree = null;
    editorState.read(() => {
      const root = $getRoot();
      text.current = formatNode(root);
      editorInfo.setSelectedEditID([editorInfo.selectedEditID[0], text.current, editorInfo.selectedEditID[2]]);
    });
    return rootTree;
  }

  function formatNode(node: any): any {
    const children = node.getChildren ? node.getChildren() : [];
    const formattedChildren = children.map((child: any) => formatNode(child));

    if (node.getType() === "root") {
      return {
        root: {
          children: formattedChildren,
          direction: node.getDirection ? node.getDirection() : "ltr",
          format: node.getFormat ? node.getFormat() : "",
          indent: node.getIndent ? node.getIndent() : 0,
          type: node.getType ? node.getType() : "unknown",
          version: node.getVersion ? node.getVersion() : 1,
          ...((node.getTextContent && node.getType() === "text") && { text: node.getTextContent() }),
          ...(node.getDetail && { detail: node.getDetail() }),
          ...(node.getMode && { mode: node.getMode() }),
          ...(node.getStyle && { style: node.getStyle() }),
        }
      };
    } else {
      return {
        children: formattedChildren,
        direction: node.getDirection ? node.getDirection() : "ltr",
        format: node.getFormat ? node.getFormat() : "",
        indent: node.getIndent ? node.getIndent() : 0,
        type: node.getType ? node.getType() : "unknown",
        version: node.getVersion ? node.getVersion() : 1,
        ...((node.getTextContent && node.getType() === "text") && { text: node.getTextContent() }),
        ...(node.getDetail && { detail: node.getDetail() }),
        ...(node.getMode && { mode: node.getMode() }),
        ...(node.getStyle && { style: node.getStyle() }),
      };
    }
  }

  useEffect(() => {
    if (editorInfo.selectedEditID[1]) {
      try {
        const parsedEditorState: any = editor.parseEditorState(JSON.stringify(editorInfo.selectedEditID[1][0]));
        editor.update(() => {
          editor.setEditorState(parsedEditorState);
          editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined);
        });
      } catch (error) {
        console.error('Error parsing editor state:', error);
      }
    }
  }, [editorInfo.selectedEditID[0], editor]);

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
    <div id="editor-wrapper">
      <Toolbar />
      <LexicalEditor />
    </div>
  );
}