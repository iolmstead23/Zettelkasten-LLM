'use client'

import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { Fragment, useEffect, useRef } from 'react'
import { useFileLocationContext, useFileTreeContext, useNotifyContentContext, useNotifyToggleContext, useSelectedEditContext } from '@/components/ui/UIProvider'

interface FileTreeObject {
    id: number;
    type: string;
    name: string;
    contents: FileTreeObject[] | string;
};

export default function EditorFileOptions() {
    const filetreeContext: any = useFileTreeContext();
    const selectedEditID = useSelectedEditContext();
    const notifyContent = useNotifyContentContext();
    const notifyToggle = useNotifyToggleContext();
    const fileLocation = useFileLocationContext();

    const selectedEditName = useRef<string>('');

    function save(): any {
        /* do not save if there is no file currently being edited */
        (selectedEditID.selectedEditID[0] != -1) && filetreeContext.dispatch({
          type:'save_file',
          payload:{
            id:selectedEditID.selectedEditID[0],
            contents:selectedEditID.selectedEditID[1]
        }});

        // notify user of successful save
        notifyContent.setNotifyContent(["success","Save success!"]);
        notifyToggle.setNotifyToggle(true);
    }

    // Helper function to check if a file exists in the file tree
    function fileExists(files: FileTreeObject[], fileId: number): boolean {
        for (const file of files) {
            // If the file is found, return true
            if (file.id === fileId) {
                return true;
            }
            // If the file is a folder, check if the file exists in the folder
            if (file.type === 'folder' && fileExists(file.contents as FileTreeObject[], fileId)) {
                return true;
            }
        }
        return false;
    }

    // Get the name of the currently selected file being edited and updating the state
    useEffect(() => {
        const fileId = selectedEditID.selectedEditID[0];
        // If the file is not found or the file is not being edited, set the name to an empty string
        if (fileId === -1 || !fileExists(filetreeContext.state.files, fileId)) {
            selectedEditName.current = '';
        } else {
            selectedEditName.current = selectedEditID.selectedEditID[2] as string ?? '';
        }
    }, [selectedEditID.selectedEditID, filetreeContext.state.files]);

    // Array of items to be displayed in the dropdown menu
    const items:{name:string,action:()=>void}[] = [
        { name: 'Save', action: save },
        { name: 'Import', action: ()=>{}}
    ];

    return (
        <div className="inline-flex">
            <button
                type="button"
                className=" inline-flex items-center rounded-l-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
                File Options
            </button>
            <Menu as="div" className="relative -ml-px block rounded-md shadow-sm">
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
                <div className="px-5 pt-2">
                {
                    // This displays the edited files location in the filetree
                    `File Location /
                    ${fileLocation.fileLocation.map((item: any) => (
                        item &&
                        fileLocation.fileLocation 
                    ) ? item : '').filter(Boolean).join(' / ')}
                    ${(fileLocation.fileLocation.length>0) ? " / " : ''}
                    ${selectedEditName.current}
                `}
                </div>
            </div>      
        </div>
    )
}