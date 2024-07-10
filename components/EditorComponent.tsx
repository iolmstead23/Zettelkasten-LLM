'use client'

import {
  MDXEditor,
  UndoRedo,
  BoldItalicUnderlineToggles,
  toolbarPlugin,
  MDXEditorMethods,
  CodeToggle,
  CreateLink,
  headingsPlugin,
  ListsToggle
} from '@mdxeditor/editor';
import {FC, useEffect, useRef} from 'react';
import { useSelectedEditContext } from '@/components/ui/UIProvider';

interface EditorProps {
  markdown: string;
  editorRef?: React.MutableRefObject<MDXEditorMethods | null>;
};

const Editor: FC<EditorProps> = ({ markdown }) => {
  const selection = useSelectedEditContext();
  const ref = useRef<MDXEditorMethods>(null)

// every time a new file is selected update the editor's contents
  // there will be logic applied to this from a FileManager that can handle saves and loads
  useEffect(() => {
    const selectedMarkdown = selection.selectedEditID[1];

    if (typeof selectedMarkdown === 'string') {
      ref?.current?.setMarkdown(selectedMarkdown);
    }
  }, [selection.selectedEditID[0]]);

  useEffect(() => {
    selection.setSelectedEditID([selection.selectedEditID[0] as number, markdown])
  }, [markdown])

  return (
    <pre>
      <MDXEditor
        ref={ref}
        markdown={markdown}
        // update selection content as markdown
        onChange={(e: string) => selection.setSelectedEditID([selection.selectedEditID[0] as number, e])}
        plugins={[
          headingsPlugin(),
          toolbarPlugin({
            toolbarContents: () => (
              <>
                {' '}
                <UndoRedo />
                <BoldItalicUnderlineToggles />
                <CodeToggle />
                <CreateLink />
                <ListsToggle />
              </>
            )
          })
        ]}
      />
    </pre>
  );
};

/** This is the editor component that allows for markdown editing */
export default Editor;