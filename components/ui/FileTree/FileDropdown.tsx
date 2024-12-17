import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import {
  useRenameToggleContext,
  useSelectedEditContext,
  useSortIndexContext,
  useFileLocationContext,
  useDeleteToggleContext,
} from "@/components/ui/UIProvider";

/** I do not know what this does */
function classNames(...classes: any) {
  return classes.filter(Boolean).join(" ");
}

/** This keeps track of the dropdown options that allow FileTree actions */
export default function FileDropdown({
  index,
  data,
  name,
}: {
  index: number;
  data: any;
  name: string;
}) {
  /** This allows us to change the text editor contents */
  const selectEditContext = useSelectedEditContext();
  /** This open and closes the Rename dialog */
  const renameContext = useRenameToggleContext();
  /** This open and closes the Delete dialog */
  const deleteContext = useDeleteToggleContext();
  /** This keeps track of the subdirectory of folders for the file being edited */
  const fileLocation = useFileLocationContext();
  /** This triggers the reducer function to resort the index */
  const sortIndex = useSortIndexContext();
  /** This keeps track of the file being edited */
  data ? data : (data = {});

  return (
    <Menu as="div" className="block">
      <div>
        <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 bg-white text-xs font-semibold text-gray-900 hover:bg-gray-50">
          <ChevronDownIcon
            className="-mr-1 h-5 w-5 text-gray-400"
            aria-hidden="true"
          />
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <span
                  className={classNames(
                    active ? "bg-gray-100 text-gray-900" : "text-gray-700",
                    "block px-4 py-2 text-sm"
                  )}
                  // In FileDropdown.tsx
                  onClick={() => {
                    try {
                      // Ensure we're working with the proper structure
                      const contentData = Array.isArray(data) ? data[0] : data;

                      selectEditContext.setSelectedEditIndex({
                        index: index,
                        contents: contentData,
                        name: name,
                      });
                      fileLocation.setFileLocation([""]);
                      sortIndex.setIndexSort(true);
                    } catch (err) {
                      console.error(
                        "Error in FileDropdown click handler:",
                        err
                      );
                    }
                  }}
                >
                  Edit
                </span>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <span
                  className={classNames(
                    active ? "bg-gray-100 text-gray-900" : "text-gray-700",
                    "block px-4 py-2 text-sm"
                  )}
                  onClick={() => {
                    renameContext.setRenameIsOpen(true);
                  }}
                >
                  Rename
                </span>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <span
                  className={classNames(
                    active ? "bg-gray-100 text-gray-900" : "text-gray-700",
                    "block px-4 py-2 text-sm"
                  )}
                  onClick={() => {
                    deleteContext.setDeleteIsOpen(true);
                  }}
                >
                  Delete
                </span>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
