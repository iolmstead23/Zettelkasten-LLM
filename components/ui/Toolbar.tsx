import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from "lexical";
import { createEmptyHistoryState, registerHistory } from "@lexical/history";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaBold,
  FaUndo,
  FaRedo,
  FaItalic,
  FaUnderline,
  FaStrikethrough,
  FaAlignLeft,
  FaAlignRight,
  FaAlignCenter,
  FaAlignJustify,
  FaBook,
} from "react-icons/fa";
import {
  useCombinedOperations,
  useFileTreeContext,
  useKnowledgeGraphContext,
  useSaveContext,
  useSelectedEditContext,
} from "@/components/ui/UIProvider";
import { FileTreeObject } from "@/types";
import { WRAP_EDGE_COMMAND } from "../editor/TextWrapperPlugin";

const LowPriority = 1;

function Divider() {
  return <div className="divider" />;
}

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const filetreeContext = useFileTreeContext();
  const toolbarRef = useRef(null);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);

  const { state } = useFileTreeContext(); // Access the file tree context
  const selectedEditIndex = useSelectedEditContext();

  const history = createEmptyHistoryState();

  const { handleAddEdge } = useCombinedOperations();
  const { nodes } = useKnowledgeGraphContext(); // Add this to check current state

  // Add debug button
  const debugState = () => {
    console.log("Current file tree:", state.files);
    console.log("Current graph nodes:", nodes);
  };

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Update text format
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
    }
  }, []);

  useEffect(() => {
    registerHistory(editor, history, 100);
    const unregister = mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, _newEditor) => {
          $updateToolbar();
          return false;
        },
        LowPriority
      )
    );

    return () => {
      unregister();
    };
  }, [editor]);

  const checkIfNoteExists = useCallback(
    (noteName: string) => {
      const searchFiles: any = (files: FileTreeObject[]) => {
        for (const file of files) {
          // Normalize both strings for comparison
          const filenameCleaned = file.name.split(".")[0].toLowerCase().trim();
          const noteNameCleaned = noteName.toLowerCase().trim();

          if (file.type === "file" && filenameCleaned === noteNameCleaned) {
            return file;
          }
          if (file.type === "folder" && Array.isArray(file.contents)) {
            const found = searchFiles(file.contents);
            if (found) {
              return found;
            }
          }
        }
        return null;
      };

      return searchFiles(state.files);
    },
    [state.files]
  );

  const createEdge = useCallback(
    (fromId: string, toId: string) => {
      // Use handleAddEdge directly instead of manual dispatch
      handleAddEdge(fromId, toId);
    },
    [handleAddEdge]
  );

  // Modify handleLinkButtonClick to ensure IDs are strings
  const handleLinkButtonClick = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const selectedText = selection.getTextContent().trim();

        const existingNote = checkIfNoteExists(selectedText);

        if (existingNote && selectedEditIndex.selectedEditIndex.index !== -1) {
          const connectNotes = confirm(
            `Note "${selectedText}" exists. Would you like to link these notes together?`
          );
          if (connectNotes) {
            // Ensure IDs are strings and handle potential undefined
            const sourceId = String(existingNote.id || crypto.randomUUID());
            const targetId = String(
              selectedEditIndex.selectedEditIndex.index || crypto.randomUUID()
            );

            // Create the edge in the graph first
            createEdge(sourceId, targetId);

            // Dispatch with a slight delay to ensure previous update completes
            editor.dispatchCommand(WRAP_EDGE_COMMAND, {
              text: selectedText,
              id: sourceId,
            });
          }
        }
      }
    });
  }, [editor, checkIfNoteExists, createEdge, selectedEditIndex, state.files]);

  return (
    <div className="toolbar" ref={toolbarRef}>
      <button
        onClick={() => {
          editor.dispatchCommand(UNDO_COMMAND, undefined);
        }}
        className="toolbar-item spaced"
        aria-label="Undo"
      >
        <FaUndo />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(REDO_COMMAND, undefined);
        }}
        className="toolbar-item"
        aria-label="Redo"
      >
        <FaRedo />
      </button>
      <Divider />
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
        }}
        className={"toolbar-item spaced " + (isBold ? "active" : "")}
        aria-label="Format Bold"
      >
        <FaBold />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
        }}
        className={"toolbar-item spaced " + (isItalic ? "active" : "")}
        aria-label="Format Italics"
      >
        <FaItalic />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
        }}
        className={"toolbar-item spaced " + (isUnderline ? "active" : "")}
        aria-label="Format Underline"
      >
        <FaUnderline />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
        }}
        className={"toolbar-item spaced " + (isStrikethrough ? "active" : "")}
        aria-label="Format Strikethrough"
      >
        <FaStrikethrough />
      </button>
      <Divider />
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left");
        }}
        className="toolbar-item spaced"
        aria-label="Left Align"
      >
        <FaAlignLeft />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center");
        }}
        className="toolbar-item spaced"
        aria-label="Center Align"
      >
        <FaAlignCenter />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right");
        }}
        className="toolbar-item spaced"
        aria-label="Right Align"
      >
        <FaAlignRight />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify");
        }}
        className="toolbar-item spaced"
        aria-label="Justify Align"
      >
        <FaAlignJustify />
      </button>
      <button
        onClick={handleLinkButtonClick}
        className="toolbar-item"
        aria-label="Link"
      >
        <FaBook />
      </button>
      <button
        onClick={debugState}
        className="ml-2 bg-gray-500 text-white px-4 py-2 rounded"
      >
        Debug State
      </button>
    </div>
  );
}

export default ToolbarPlugin;
