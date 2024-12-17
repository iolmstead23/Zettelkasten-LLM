import React, { useEffect } from "react";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { $getRoot } from "lexical";
import {
  useSaveContext,
  useSelectedEditContext,
} from "@/components/ui/UIProvider";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import Toolbar from "@/components/ui/Toolbar";
import { SelectedEditIndexType } from "@/types";
import { TextWrapperPlugin } from "@/components/editor/TextWrapperPlugin";

function EditorComponent() {
  const { selectedEditIndex, setSelectedEditIndex } = useSelectedEditContext();
  const [editor] = useLexicalComposerContext();

  // Add a debug log function
  const logEditorState = (context: string) => {
    console.log(`Editor State Debug - ${context}:`, {
      selectedEditIndex,
      contents: selectedEditIndex?.contents,
    });
  };

  function onChange(editorState: any): void {
    try {
      editorState.read(() => {
        const root = $getRoot();
        if (!root) return;

        const serializedState = editorState.toJSON();

        if (selectedEditIndex?.index !== undefined) {
          const editData: SelectedEditIndexType = {
            index: selectedEditIndex.index,
            contents: { root: serializedState.root },
            name: selectedEditIndex.name || "",
          };

          setSelectedEditIndex(editData);
        }
      });
    } catch (err) {
      console.error("Error in onChange:", err);
      logEditorState("onChange Error");
    }
  }

  useEffect(() => {
    if (!selectedEditIndex?.contents?.root) {
      console.warn("No root content available");
      return;
    }

    try {
      const serializedContent = JSON.stringify(selectedEditIndex.contents);
      const parsedEditorState = editor.parseEditorState(serializedContent);
      editor.setEditorState(parsedEditorState);
    } catch (err) {
      console.error("Editor state error:", err);
    }
  }, [selectedEditIndex?.index, editor]);

  return (
    <div>
      <RichTextPlugin
        contentEditable={<ContentEditable className="editor-content" />}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <OnChangePlugin onChange={onChange} />
      <TextWrapperPlugin />
    </div>
  );
}

export default function Editor() {
  return (
    <div>
      <div id="editor-wrapper">
        <Toolbar />
        <EditorComponent />
      </div>
    </div>
  );
}
