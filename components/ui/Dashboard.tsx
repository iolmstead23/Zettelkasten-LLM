'use client'

import dynamic from 'next/dynamic'
import { Suspense, useEffect, useState } from 'react'
import FileTreeSidebar from '@/components/ui/FileTree/FileTreeSidebar'

const EditorComp = dynamic(() => import('@/components/EditorComponent'), { ssr: false })
const file_name = "/notes/Business of IT.md"

export default function Dashboard() {

  const [data, setData] = useState('');

  useEffect(() => {
    fetch(file_name)
    .then((response) => {
      return response.text();
    })
    .then((text) => {
      setData(text);
    });
  }, []);

  return (
    <main className="xl:pl-96 max-h-full">
      <div className="px-4 py-10 sm:px-6 lg:px-8 lg:py-6">
        {/* Main area */}
        <div className="lg:pl-20">
          <Suspense fallback={<p className='text-center'>Loading...</p>}>
            <div className="flex overflow-y-auto flex-col max-h-screen">
              <EditorComp markdown={data} />
            </div>
          </Suspense>

          <aside className="absolute bottom-0 left-20 top-16 hidden w-96 overflow-y-auto border-r border-gray-200 px-4 py-6 sm:px-6 lg:px-8 xl:block">
            <FileTreeSidebar />
          </aside>
        </div>
      </div>
    </main>
  )
}