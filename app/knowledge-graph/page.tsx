'use client'

import dynamic from 'next/dynamic';

const SimpleGraph = dynamic(() => import('@/components/knowledge-graph'), {
    ssr: false,
})

export default function KnowledgeGraph() {
    return (
        <div className="lg:flex lg:h-full lg:flex-col xl:pl-[8em] h-full w-full">
            <SimpleGraph />
        </div>
    );
}