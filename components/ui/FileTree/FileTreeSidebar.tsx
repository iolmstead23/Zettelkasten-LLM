"use client";

// Import necessary hooks and components
import React, { useState } from "react";
import { AiOutlineFile, AiOutlineFolder } from "react-icons/ai";
import { BiPencil } from "react-icons/bi";
import {
  DiJavascript1,
  DiCss3Full,
  DiHtml5,
  DiReact,
  DiMarkdown,
} from "react-icons/di";
import {
  useFileTreeContext,
  useSelectedIndexContext,
  useNewItemToggleContext,
} from "@/components/ui/UIProvider";
import FileDropdown from "@/components/ui/FileTree/FileDropdown";
import FolderDropdown from "@/components/ui/FileTree/FolderDropdown";
import { useSelectedEditContext } from "@/components/ui/UIProvider";
import { SelectedEditIndexType } from "@/types";

// Define types for file icons and collapsible component
interface FILE_ICONS {
  js: React.JSX.Element;
  css: React.JSX.Element;
  html: React.JSX.Element;
  jsx: React.JSX.Element;
}

interface CollapsableComponent {
  isOpen: boolean | number;
  children: any;
}

interface RootValues {
  id: number;
  type: string;
  name: string;
  contents: Object | string;
}

// File icons object
const FILE_ICONS: Record<any, any> = {
  js: <DiJavascript1 />,
  css: <DiCss3Full />,
  html: <DiHtml5 />,
  jsx: <DiReact />,
  md: <DiMarkdown />,
};

const Collapsible: React.FC<CollapsableComponent> = ({ children, isOpen }) => {
  return (
    <ul
      role="list"
      className={`flex flex-1 flex-col gap-y-7 overflow-hidden ${
        isOpen ? "h-0" : "h-full"
      }`}
    >
      <li>
        <ul role="list" className="-mx-2 space-y-1">
          {children}
        </ul>
      </li>
    </ul>
  );
};

/** File Component */
const File = ({
  index,
  name,
  selection,
  contents,
}: {
  index: number;
  name: string;
  selection: any;
  contents: Object;
}) => {
  /** Extract file extension */
  const ext = name.split(".")[1];

  // Add this to get the currently edited file's info
  const { selectedEditIndex } = useSelectedEditContext();
  const selectEdit: SelectedEditIndexType = selectedEditIndex!;

  /** Function to handle file selection */
  const handleSelection = () => {
    selection.setSelectedIndex([index, name]);
  };

  /** Check if file is selected */
  const isSelected: boolean = selection.selectedIndex[0] == index ? true : false;

  /** Check if file is being edited */
  const isBeingEdited: boolean = selectEdit?.index === index;

  // In the File component, replace the existing return with:
  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
      }}
    >
      <div className="pl-5 flex items-center justify-between pr-4">
        {/* Added justify-between and pr-4 */}
        <div className="flex items-center">
          {FILE_ICONS[ext] || <AiOutlineFile />}
          <div onClick={handleSelection} className="flex items-center">
            <span
              className={`${
                isSelected ? "text-purple-500" : "text-black"
              } ml-5`}
            >
              {name}
            </span>
            {isBeingEdited && (
              <BiPencil className="ml-2 text-gray-500" size={14} />
            )}
          </div>
        </div>
        {/* Dropdown is now positioned absolutely */}
        {isSelected && (
          <div className="absolute right-4">
            <FileDropdown index={index} data={contents} name={name} />
          </div>
        )}
      </div>
    </div>
  );
};

/** Folder component */
const Folder = ({
  index,
  name,
  selection,
  children,
}: {
  index: number;
  name: string;
  selection: any;
  children: any;
}) => {
  const [isOpen, setIsOpen] = useState<boolean | number>(+false);

  /** Function to handle file selection */
  const handleSelection = () => {
    selection.setSelectedIndex([index, name]);
  };

  // Check if folder is selected
  const isSelected: boolean = selection.selectedIndex[0] == index ? true : false;

  // Render folder component
  // In the Folder component, replace the existing return with:
  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
      }}
    >
      <div className="pl-5 flex-col">
        <div className="flex items-center justify-between pr-4">
          {/* Added justify-between and pr-4 */}
          <div className="flex items-center" onClick={handleSelection}>
            <AiOutlineFolder />
            <span
              className={`${
                isSelected ? "text-purple-500" : "text-black"
              } pl-5`}
            >
              {name}
            </span>
          </div>
          {/* Dropdown is now positioned absolutely */}
          {isSelected && (
            <div className="absolute right-4">
              <FolderDropdown isOpen={isOpen} setIsOpen={setIsOpen} />
            </div>
          )}
        </div>
        <Collapsible isOpen={isOpen}>{children}</Collapsible>
      </div>
    </div>
  );
};

/** Tree component */
const Tree = ({ children }: any) => {
  return <div className="leading-[1.5]">{children}</div>;
};

/** Root component to render file tree */
const Root = ({ data, selection }: any) => {

  // If we received an object with a files property, use that
  const fileArray = Array.isArray(data)
    ? data
    : data.files && Array.isArray(data.files)
    ? data.files
    : null;
  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
      }}
    >
      {data.map((item: any, index: number) => {
        const { id, type, name, contents }: RootValues = item;

        return (
          <div key={index} className="min-h-5">
            {item.type === "file" ? (
              <File
                key={id}
                index={id}
                name={name}
                selection={selection}
                contents={contents}
              />
            ) : item.type === "folder" ? (
              <Folder key={id} index={id} name={name} selection={selection}>
                <Root data={contents} selection={selection} />
              </Folder>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

// Attach components to Tree component
Tree.File = File;
Tree.Folder = Folder;
Tree.Root = Root;

/** This is the container that provides the FileTree logic */
export default function FileTreeSidebar() {
  const files: any = useFileTreeContext();
  const selection = useSelectedIndexContext();
  const newItemToggle = useNewItemToggleContext();

  // Add data validation and transformation
  const fileData = files?.state?.files;

  return (
    <div className="z-10">
      <div>
        <div
          className="pl-5 flex items-center"
          onClick={() => {
            selection?.setSelectedIndex([-1, ""]);
            newItemToggle?.setNewIsOpen(true);
          }}
        >
          Create New
          <div className="pl-2">
            <img
              src="/plus-circle-svgrepo-com.svg"
              alt="New Item"
              width={15}
              height={15}
            />
          </div>
        </div>

        {fileData && (
          <Tree>
            <Tree.Root
              data={Array.isArray(fileData) ? fileData : []}
              selection={selection}
            />
          </Tree>
        )}
      </div>
    </div>
  );
}
