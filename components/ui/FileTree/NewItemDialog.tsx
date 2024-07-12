'use client'

import { Fragment, useRef, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useFileTreeContext, useNewItemToggleContext, useSelectedIDContext, useSortIndexContext } from '@/components/ui/UIProvider';

/**
 * This file is responsible for providing an interface to create new items
*/
export default function NewItem() {

  // TODO: Reject names if they already exist in the file tree. Force unique names!

  /** This enables us to toggle the creation modal open and close */
  const newToggleContext: any = useNewItemToggleContext();

  /** This enables the manager to read from the filetree */
  const fileContext: any = useFileTreeContext();

  /** This enables us to sort the index */
  const sortIndex = useSortIndexContext();

  /** This enables the manager to read and write selection */
  const selectionIDContext = useSelectedIDContext();

  /** This keeps track of the cancel button */
  const cancelButtonRef = useRef(null);

  /** newName and setNewName are used to keep track of the input's state */
  const [newName, setNewName] = useState<string>('');

  /** This updates the newName state whenever input has changed */
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {setNewName(event.target.value);};

  /** This toggles the newType state between folder and file */
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {setNewType(event.target.value);};

  /** newType and setNewType are used to toggle the selection of Folder or File */
  const [newType, setNewType] = useState<string>("File");

  return (
    <Transition.Root show={newToggleContext?.newIsOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" initialFocus={cancelButtonRef} onClose={() => newToggleContext.setNewIsOpen(false)}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                      Create New
                    </Dialog.Title>
                    <div className="mt-2">
                      <div className=' flex items-center'>
                          <label htmlFor="new" className="sr-only">
                              Add file or folder name without extension
                          </label>
                          <input
                              type="text"
                              name="new"
                              id="new"
                              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                              placeholder="Filename"
                              onChange={handleInputChange}
                          />

                        <div className='px-2'>
                          <select
                            id="type"
                            name="type"
                            className="block min-w-fit rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            defaultValue="File"
                            onChange={handleChange}
                          >
                            <option>File</option>
                            <option>Folder</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  {(newType==="File") && (
                      <button
                        type="button"
                        className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                        onClick={() => {
                          // this inserts a new file in the folder it is located in
                          fileContext.dispatch({
                            type:'insert_file',
                            selectID: selectionIDContext.selectedID[0],
                            payload:{id:1000,name:newName+".md",type:"file",contents:"Enter Text Here"},
                          });

                          // sort index with new file
                          sortIndex.setIndexSort(true);

                          newToggleContext.setNewIsOpen(false);
                        }}
                      >
                        Create File
                      </button>
                    )}

                    {(newType==="Folder") && (
                      <button
                        type="button"
                        className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                        onClick={() => {
                          // this inserts a new folder in the folder it is located in
                          fileContext.dispatch({
                            type:'insert_file',
                            selectID:selectionIDContext.selectedID[0],
                            payload:{id:0,name:newName,type:"folder",contents:[]},
                          });

                          // sort index with new folder
                          sortIndex.setIndexSort(true);

                          newToggleContext.setNewIsOpen(false);
                        }}
                      >
                        Create Folder
                      </button>
                    )}

                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={() => {
                      newToggleContext.setNewIsOpen(false);
                    }}
                    ref={cancelButtonRef}
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};