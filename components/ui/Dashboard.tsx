'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import FileTreeSidebar from '@/components/ui/FileTree/FileTreeSidebar'

const EditorComp = dynamic(() => import('@/components/EditorComponent'), { ssr: false });

export default function Dashboard() {

  return (
    <main className="xl:pl-96 max-h-full">
      <div className="px-4 py-10 sm:px-6 lg:px-8 lg:py-6">
        {/* Main area */}
        <div className="lg:pl-20">
          <Suspense fallback={<p className='text-center'>Loading...</p>}>
            <div className="flex overflow-y-auto flex-col max-h-screen">
              <EditorComp markdown='Select a file!'/>
            </div>
          </Suspense>

          <aside
            className="absolute bottom-0 left-20 top-16 hidden w-96 overflow-y-auto border-r border-gray-200 px-4 py-6 sm:px-6 lg:px-8 xl:block"
            onContextMenu={(e) => {
              e.preventDefault(); // prevent the default behaviour when right clicked
            }}
          >
            <FileTreeSidebar />
          </aside>
        </div>
      </div>
    </main>
  )
}