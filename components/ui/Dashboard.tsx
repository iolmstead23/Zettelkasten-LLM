'use client'

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import FileTreeSidebar from '@/components/ui/FileTree/FileTreeSidebar';
import { useFileTreeContext, useNewItemToggleContext, useNotifyContentContext, useNotifyToggleContext, useRenameToggleContext, useSelectedEditContext, useSelectedIDContext, useSortIndexContext } from '@/components/ui/UIProvider';
import RenameFile from '@/components/ui/FileTree/RenameFileDialog';
import NewItem from '@/components/ui/FileTree/NewItemDialog';
import Notification from './Notification';

const EditorComp = dynamic(() => import('@/components/EditorComponent'), { ssr: false });

/** This is the main Dashboard component */
export default function Dashboard() {
  const filetreeContext: any = useFileTreeContext();
  const renameToggle = useRenameToggleContext();
  const newItemToggle = useNewItemToggleContext();
  const selectedInfo = useSelectedIDContext();
  const selectedEditInfo = useSelectedEditContext();
  const notifyToggle = useNotifyToggleContext();
  const notifyContent = useNotifyContentContext();
  const sortIndex = useSortIndexContext();

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

      {(notifyToggle.notifyToggle==true) && (
        <div>
          <Notification />
        </div>
      )}

      <div className="px-4 py-10 sm:px-6 lg:px-8 lg:py-6">
        {/* Main area */}
        <div className="lg:pl-20">
          <Suspense fallback={<p className='text-center'>Loading...</p>}>
            <div className="flex overflow-y-auto flex-col max-h-screen">
              <div className='m-2'>
                <button
                  onClick={()=>{
                    selectedEditInfo.selectedEditID[0] != 0 && filetreeContext.dispatch({
                      type:'save_file',
                      payload:{
                        id:selectedEditInfo.selectedEditID[0],
                        content:selectedEditInfo.selectedEditID[1]
                      }
                    });
                    // notify user of successful save
                    notifyContent.setNotifyContent(["success","Save success!"]);
                    notifyToggle.setNotifyToggle(true);

                    // resort the filetree
                    sortIndex.setIndexSort(true);
                  }}>
                  Save
                </button>
              </div>
              <EditorComp markdown='Select a file!'/>
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