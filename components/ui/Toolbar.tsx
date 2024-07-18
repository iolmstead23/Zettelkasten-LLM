import React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { FORMAT_TEXT_COMMAND, TextFormatType } from 'lexical';

const Toolbar = () => {
  const [editor] = useLexicalComposerContext();

  const applyFormat = (formatType: TextFormatType) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, formatType);
  };

  return (
    <div className="fixed-toolbar">
      <button onClick={() => applyFormat('bold')} className="toolbar-button">Bold</button>
      <button onClick={() => applyFormat('italic')} className="toolbar-button">Italic</button>
      <button onClick={() => applyFormat('underline')} className="toolbar-button">Underline</button>
    </div>
  );
};

export default Toolbar;