"use client";

// Import necessary hooks and components
import React, { useState } from "react";
import styledComponents from "styled-components";
import { AiOutlineFile, AiOutlineFolder } from "react-icons/ai";
import {
  DiJavascript1,
  DiCss3Full,
  DiHtml5,
  DiReact,
  DiMarkdown,
} from "react-icons/di";
import {
  useFileTreeContext,
  useSelectedIDContext,
  useNewItemToggleContext,
} from "@/components/ui/UIProvider";
import EmptyFiles from "@/components/ui/EmptyFiles";
import FileDropdown from "@/components/ui/FileTree/FileDropdown";
import FolderDropdown from "@/components/ui/FileTree/FolderDropdown";

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
  id,
  name,
  selection,
  contents,
}: {
  id: number;
  name: string;
  selection: any;
  contents: Object;
}) => {
  /** Extract file extension */
  const ext = name.split(".")[1];

  /** Function to handle file selection */
  const handleSelection = () => {
    selection.setSelectedID([id, name]);
  };

  /** Check if file is selected */
  const isSelected: boolean = selection.selectedID[0] == id ? true : false;

  // Render file component
  // In the File component, replace the existing return with:
  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
      }}
    >
      <div className="pl-5 flex items-center justify-between pr-4">
        {" "}
        {/* Added justify-between and pr-4 */}
        <div className="flex items-center">
          {FILE_ICONS[ext] || <AiOutlineFile />}
          <div onClick={handleSelection}>
            <span
              className={`${
                isSelected ? "text-purple-500" : "text-black"
              } ml-5`}
            >
              {name}
            </span>
          </div>
        </div>
        {/* Dropdown is now positioned absolutely */}
        {isSelected && (
          <div className="absolute right-4">
            <FileDropdown id={id} data={contents} name={name} />
          </div>
        )}
      </div>
    </div>
  );
};

/** Folder component */
const Folder = ({
  id,
  name,
  selection,
  children,
}: {
  id: number;
  name: string;
  selection: any;
  children: any;
}) => {
  const [isOpen, setIsOpen] = useState<boolean | number>(+false);

  /** Function to handle file selection */
  const handleSelection = () => {
    selection.setSelectedID([id, name]);
  };

  // Check if folder is selected
  const isSelected: boolean = selection.selectedID[0] == id ? true : false;

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
          {" "}
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
  // Add better data validation
  if (!data) {
    // console.error("No data passed to Root");
    return null;
  }

  // If we received an object with a files property, use that
  const fileArray = Array.isArray(data)
    ? data
    : data.files && Array.isArray(data.files)
    ? data.files
    : null;

  if (!fileArray) {
    // console.error("Invalid data structure passed to Root:", data);
    return null;
  }

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
                key={id} // Changed from index to id for better React key uniqueness
                id={id}
                name={name}
                selection={selection}
                contents={contents}
              />
            ) : item.type === "folder" ? (
              <Folder key={id} id={id} name={name} selection={selection}>
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
  const selection = useSelectedIDContext();
  const newItemToggle = useNewItemToggleContext();

  // Add data validation and transformation
  const fileData = files?.state?.files;

  return (
    <div className="z-10">
      <div>
        <div
          className="pl-5 flex items-center"
          onClick={() => {
            selection?.setSelectedID([-1, ""]);
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
      {!fileData && (
        <div
          onContextMenu={(e) => {
            e.preventDefault();
          }}
        >
          <EmptyFiles />
        </div>
      )}
    </div>
  );
}

