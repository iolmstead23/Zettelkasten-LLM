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
import { useSelectedEditContext } from '@/components/ui/FileTree/FileTreeProvider';

interface EditorProps {
  markdown: string;
  editorRef?: React.MutableRefObject<MDXEditorMethods | null>;
};

const Editor: FC<EditorProps> = ({ markdown }) => {
  const selection = useSelectedEditContext();
  const ref = useRef<MDXEditorMethods>(null)

  // every time a new file is selected update the editors contents
  // there will be logic applied to this from a FileManager that can handle saves and loads
  useEffect(()=>{
    ref?.current?.setMarkdown(selection.selectedEdit[1])
  },[...selection?.selectedEdit])

  return (
    <pre>
      <MDXEditor
        ref={ref}
        markdown={markdown}
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