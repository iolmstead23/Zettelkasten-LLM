'use client'

import dynamic from 'next/dynamic'
import { Suspense, useEffect, useState } from 'react'

import Files from './Files';

const EditorComp = dynamic(() => import('../EditorComponent'), { ssr: false })
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
          <Files />
        </div>
      </div>
    </main>
  )
}