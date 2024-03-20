'use client'

/*
  This example requires some changes to your config:
  
  ```
  // tailwind.config.js
  module.exports = {
    // ...
    plugins: [
      // ...
      require('@tailwindcss/forms'),
    ],
  }
  ```
*/

import dynamic from 'next/dynamic'
import { Suspense, useEffect, useState } from 'react'
import Sidebars from './Sidebars'

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
    <>
      <div>
        <Sidebars />
        <main className="xl:pl-96">
          <div className="px-4 py-10 sm:px-6 lg:px-8 lg:py-6">
              {/* Main area */}
              <div>
                <div className="lg:pl-20">
                  <Suspense fallback={<p>Loading...</p>}>
                      <EditorComp markdown={data} />
                  </Suspense>
                </div>
              </div>
          </div>
        </main>
      </div>

      <aside className="fixed bottom-0 left-20 top-16 hidden w-96 overflow-y-auto border-r border-gray-200 px-4 py-6 sm:px-6 lg:px-8 xl:block">
        {/* Secondary column (hidden on smaller screens) */}
      </aside>
    </>
  )
}