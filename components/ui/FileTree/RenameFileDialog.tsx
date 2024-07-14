'use client'

import { Fragment, useRef, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useFileTreeContext, useNotifyContentContext, useNotifyToggleContext, useRenameToggleContext, useSortIndexContext } from '@/components/ui/UIProvider';

/** This file is responsible for providing an interface to rename files */
const RenameFile = ({ name, id }: { name:string, id:number }) => {
  /** This enables us to toggle the rename modal open and close */
  const renameToggleContext: any = useRenameToggleContext();
  /** This enables us to intitiate an index sort */
  const sortIndex = useSortIndexContext();
  /** This enables the manager to read from the filetree */
  const fileContext: any = useFileTreeContext();
  /** This keeps track of the cancel button */
  const cancelButtonRef = useRef(null);
  /** newName and setNewName are used to keep track of the input's state */
  const [newName, setNewName] = useState<string>('');
  /** This updates the newName state whenever input has changed */
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {setNewName(event.target.value);};
  /** ext is the files extension */
  const ext = name.split('.')[1];
  /** This lets us toggle the notification on and off */
  const notifyToggle = useNotifyToggleContext();
  /** This tracks the notifications contents */
  const notifyContent = useNotifyContentContext();

  return (
    <Transition.Root show={renameToggleContext.renameIsOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" initialFocus={cancelButtonRef} onClose={() => renameToggleContext.setRenameIsOpen(false)}>
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
                      Rename
                    </Dialog.Title>
                    <div className="mt-2">
                        <div>
                            <label htmlFor="rename" className="sr-only">
                                Rename File Without Extension
                            </label>
                            <input
                                type="text"
                                name="rename"
                                id="rename"
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                placeholder={name.split('.')[0]}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                    onClick={() => {
                      if (newName.length < 15) {
                        // rename file
                        fileContext.dispatch({
                          type:'rename_file',
                          payload:{id:id, newName:newName+"."+ext}
                        });

                        // notify user of successful save
                        notifyContent.setNotifyContent(["success","Rename success!"]);
                        notifyToggle.setNotifyToggle(true);

                        // resort the filetree
                        sortIndex.setIndexSort(true);
                        renameToggleContext.setRenameIsOpen(false);
                      } else {
                        // notify user of error
                        notifyContent.setNotifyContent(["error","Name is more than 15 characters!"]);
                        notifyToggle.setNotifyToggle(true);
                      };
                    }}
                  >
                    Rename
                  </button>

                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={() => {
                      renameToggleContext.setRenameIsOpen(false);
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

export default RenameFile;