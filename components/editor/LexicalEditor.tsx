import React, { useEffect, useRef } from "react";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { $getRoot, CLEAR_HISTORY_COMMAND } from "lexical";
import { useSelectedEditContext } from "@/components/ui/UIProvider";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

export function LexicalEditor() {
  const text = useRef<Object>();
  const { selectedEditIndex, setSelectedEditIndex } = useSelectedEditContext();
  const [editor] = useLexicalComposerContext();

  const selectEditID = selectedEditIndex?.index!;
  const selectEditContents = selectedEditIndex?.contents!;
  const selectEditName = selectedEditIndex?.name!;

  function onChange(editorState: any): any {
    editorState.read(() => {
      const root = $getRoot();
      if (!root) {
        return;
      }

      // Create properly structured editor state
      const serializedState = {
        root: editorState.toJSON().root,
      };

      text.current = serializedState;

      if (selectedEditIndex) {
        setSelectedEditIndex({
          index: selectEditID,
          contents: serializedState.root, // This ensures we're saving the proper structure
          name: selectEditName,
        });
      }
    });
  }

  useEffect(() => {
    if (!selectEditContents) return;

    try {
      // Create a properly structured editor state
      const editorStateJson = {
        root: {
          children: selectEditContents.children || [],
          direction: selectEditContents.direction || "ltr",
          format: selectEditContents.format || "",
          indent: selectEditContents.indent || 0,
          type: "root",
          version: 1,
        },
      };

      const parsedEditorState = editor.parseEditorState(
        JSON.stringify(editorStateJson)
      );

      editor.update(() => {
        editor.setEditorState(parsedEditorState);
        editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined);
      });
    } catch (error) {
      console.error("Detailed parsing error:", {
        error,
        contents: selectEditContents,
      });
    }
  }, [selectEditID]);

  return (
    <div>
      <RichTextPlugin
        contentEditable={<ContentEditable className="editor-content" />}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <OnChangePlugin onChange={onChange} />
    </div>
  );
}
