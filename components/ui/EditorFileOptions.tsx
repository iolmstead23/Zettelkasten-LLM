'use client'

import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { Fragment } from 'react'
import { useFileLocationContext, useFileTreeContext, useNotifyContentContext, useNotifyToggleContext, useSelectedEditContext } from '@/components/ui/UIProvider'

export default function EditorFileOptions() {

    const filetreeContext: any = useFileTreeContext();
    const selectedEditID = useSelectedEditContext();
    const notifyContent = useNotifyContentContext();
    const notifyToggle = useNotifyToggleContext();
    const fileLocation = useFileLocationContext();

    function save(): any {
        selectedEditID.selectedEditID[0] != 0 && filetreeContext.dispatch({
          type:'save_file',
          payload:{
            id:selectedEditID.selectedEditID[0],
            content:selectedEditID.selectedEditID[1]
        }});

        // notify user of successful save
        notifyContent.setNotifyContent(["success","Rename success!"]);
        notifyToggle.setNotifyToggle(true);
    }

    const items:{name:string,action:()=>void}[] = [
        { name: 'Save', action: save },
        { name: 'Import', action: ()=>{}}
    ]

    const selectedEditName = selectedEditID.selectedEditID[2] ?? '';

    return (
        <div className="inline-flex rounded-md shadow-sm">
            <button
                type="button"
                className=" inline-flex items-center rounded-l-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
                File Options
            </button>
            <Menu as="div" className="relative -ml-px block">
                <Menu.Button className="relative z-10 inline-flex items-center rounded-r-md bg-white px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                    <span className="sr-only">Open options</span>
                    <ChevronDownIcon aria-hidden="true" className="h-5 w-5" />
                </Menu.Button>
                <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                >
                    <Menu.Items
                        className="z-50 absolute right-0 -mr-1 mt-2 w-36 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5"
                    >
                        <div className="py-1">
                            {items.map((item) => (
                            <Menu.Item key={item.name}>
                                <button
                                onClick={item.action}
                                className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:text-gray-900"
                                >
                                {item.name}
                                </button>
                            </Menu.Item>
                            ))}
                        </div>
                    </Menu.Items>
                </Transition>
            </Menu>

            <div>
                <div className="px-5">
                {`File Location:
                    ${(selectedEditName!='') ? " / " : ''}
                    ${fileLocation.fileLocation.map((item: any) => item ? item : '').filter(Boolean).join(' / ')}
                    ${(selectedEditID.selectedEditID[0]!=1) ? " / " : ''}
                    ${selectedEditName}
                `}
                </div>
            </div>      
        </div>
    )
}