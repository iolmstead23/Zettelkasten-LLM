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
} from '@mdxeditor/editor'
import {FC} from 'react'

interface EditorProps {
  markdown: string
  editorRef?: React.MutableRefObject<MDXEditorMethods | null>
}

/**
 * Extend this Component further with the necessary plugins or props you need.
 * proxying the ref is necessary. Next.js dynamically imported components don't support refs. 
*/
const Editor: FC<EditorProps> = ({ markdown, editorRef }) => {
  
  return (
    <pre>
      <MDXEditor
        ref={editorRef}
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
  )
}

export default Editor