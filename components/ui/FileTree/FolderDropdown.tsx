import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import {
  useDeleteToggleContext,
  useNewItemToggleContext,
  useRenameToggleContext,
} from "@/components/ui/UIProvider";

/** I have no idea what this does */
function classNames(...classes: any) {
  return classes.filter(Boolean).join(" ");
}

/** This keeps track of the dropdown options that allow FileTree actions */
export default function FolderDropdown({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean | number;
  setIsOpen: (e: boolean | number) => void;
}) {
  /** This lets us toggle the rename dialog on and off */
  const renameContext = useRenameToggleContext();
  /** This provides the content for the rename dialog */
  const newContext = useNewItemToggleContext();
  /** This lets us toggle the delete dialog on and off */
  const deleteContext = useDeleteToggleContext();

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
                  onClick={() => {
                    setIsOpen(+!isOpen);
                  }}
                >
                  {isOpen ? "Expand" : "Collapse"}
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
                    newContext.setNewIsOpen(true);
                  }}
                >
                  New
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
                    renameContext?.setRenameIsOpen(true);
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
