// TextWrapperPlugin.tsx
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
} from "lexical";
import { useEffect } from "react";
import { $createEdgeNode } from "./EdgeNode";

export const WRAP_EDGE_COMMAND: LexicalCommand<{
  text: string;
  id: string;
}> = createCommand();

export function TextWrapperPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const removeCommand = editor.registerCommand(
      WRAP_EDGE_COMMAND,
      (payload) => {
        // Ensure a completely fresh update
        editor.update(() => {
          const selection = $getSelection();
          const root = $getRoot();
          if (!$isRangeSelection(selection)) {
            // If no selection, insert at the end of the root
            const paragraphNode = $createParagraphNode();
            const edgeNode = $createEdgeNode(payload.text);
            paragraphNode.append(edgeNode);
            root.append(paragraphNode);
            return true;
          }

          try {
            // Create a paragraph node to wrap the EdgeNode
            const paragraphNode = $createParagraphNode();
            const edgeNode = $createEdgeNode(payload.text);

            paragraphNode.append(edgeNode);

            selection.insertNodes([paragraphNode]);
            return true;
          } catch (error) {
            console.error("Error inserting EdgeNode:", error);
            return false;
          }
        });

        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );

    return removeCommand;
  }, [editor]);

  return null;
}
