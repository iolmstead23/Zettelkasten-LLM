'use client'

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import FileTreeSidebar from '@/components/ui/FileTree/FileTreeSidebar';
import { useDeleteToggleContext, useNewItemToggleContext, useNotifyToggleContext, useRenameToggleContext, useSelectedIDContext } from '@/components/ui/UIProvider';
import RenameFile from '@/components/ui/FileTree/RenameFileDialog';
import NewItem from '@/components/ui/FileTree/NewItemDialog';
import Notification from './Notification';
import FileInfoDisplay from './FileInfoDisplay';
import EditorFileOptions from './EditorFileOptions';
import DeleteItem from './FileTree/DeleteConfirmDialog';

const EditorComp = dynamic(() => import('@/components/EditorComponent'), { ssr: false });

/** This is the main Dashboard component */
export default function Dashboard() {
  const renameToggle = useRenameToggleContext();
  const deleteToggle = useDeleteToggleContext();
  const newItemToggle = useNewItemToggleContext();
  const selectedInfo = useSelectedIDContext();
  const notifyToggle = useNotifyToggleContext();

  return (
    <main className="xl:pl-96 max-h-full">

      {(renameToggle.renameIsOpen===true) && (
        <div>
          <RenameFile id={selectedInfo.selectedID[0] as number} name={selectedInfo.selectedID[1] as string} />
        </div>
      )}

      {(newItemToggle.newIsOpen===true) && (
        <div>
          <NewItem />
        </div>
      )}

      {(deleteToggle.deleteIsOpen===true) && (
        <div>
          <DeleteItem id={selectedInfo.selectedID[0] as number} />
        </div>
      )}

      {(notifyToggle.notifyToggle==true) && (
        <div>
          <Notification />
        </div>
      )}

      <div className="px-4 py-10 sm:px-6 lg:px-8 lg:py-6">
        {/* Main area */}
        <div className="lg:pl-20">
          <Suspense fallback={<p className='text-center'>Loading...</p>}>
            <div className='my-2'>
              <div className='relative items-center flex'>
                <EditorFileOptions />
              </div>
            </div>
            <div className="block overflow-y-auto max-h-screen">
              <div className='h-[74vh]'>
                <EditorComp markdown='Select a file!'/>
              </div>

              <div className='bottom-0 p-1'>
                <FileInfoDisplay />
              </div>
            </div>
          </Suspense>

          <aside
            className="absolute bottom-0 left-20 top-16 hidden w-96 overflow-y-auto border-r border-gray-200 px-4 py-6 sm:px-6 lg:px-8 xl:block"
            onContextMenu={(e) => {
              e.preventDefault(); // prevent the default behavior when right clicked
            }}
          >
            <FileTreeSidebar />
          </aside>
        </div>
      </div>
    </main>
  )
};