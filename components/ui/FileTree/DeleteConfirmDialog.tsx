'use client'

import { Fragment, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useDeleteToggleContext, useFileLocationContext, useFileTreeContext, useNotifyContentContext, useNotifyToggleContext, useSelectedEditContext, useSortIndexContext } from '@/components/ui/UIProvider';

/** This file is responsible for providing an interface to delete files */
const DeleteItem = ({ id }: { id: number }) => {
  /** This enables us to toggle the delete modal open and close */
  const deleteToggleContext: any = useDeleteToggleContext();
  /** This enables us to intitiate an index sort */
  const sortIndex = useSortIndexContext();
  /** This enables the manager to read from the filetree */
  const fileContext: any = useFileTreeContext();
  /** This keeps track of the cancel button */
  const cancelButtonRef = useRef(null);
  /** This keeps track of toggling notification box on and off */
  const notifyToggle = useNotifyToggleContext();
  /** This keeps track of the notification contents */
  const notifyContent = useNotifyContentContext();
  /** This keeps track of edited file */
  const editorID = useSelectedEditContext();
  return (
    <Transition.Root show={deleteToggleContext.deleteIsOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" initialFocus={cancelButtonRef} onClose={() => deleteToggleContext.setDeleteIsOpen(false)}>
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
                      <h1 className='text-red-600'>Warning! This may delete entire subfolders.</h1>
                      <h1>Are you sure you want to delete this item?</h1>
                    </Dialog.Title>
                    <div className="mt-2">
                      <div>
                        <label htmlFor="delete" className="sr-only">
                          Delete
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                    onClick={() => {
                        // delete
                        fileContext.dispatch({
                            type:'delete_file',
                            payload:{id:id,editorID:editorID.selectedEditID,setEditor:editorID.setSelectedEditID}
                        });
                        // notify user of successful save
                        notifyContent.setNotifyContent(["success", "Delete success!"]);
                        notifyToggle.setNotifyToggle(true);
                        // resort the filetree
                        sortIndex.setIndexSort(true);
                        deleteToggleContext.setDeleteIsOpen(false);
                    }}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={() => {
                      deleteToggleContext.setDeleteIsOpen(false);
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

export default DeleteItem;