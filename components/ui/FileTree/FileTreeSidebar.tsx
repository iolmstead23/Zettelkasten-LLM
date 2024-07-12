'use client'

// Import necessary hooks and components
import React, { useState } from "react";
import styledComponents from "styled-components";
import { AiOutlineFile, AiOutlineFolder } from "react-icons/ai";
import { DiJavascript1, DiCss3Full, DiHtml5, DiReact, DiMarkdown } from "react-icons/di";
import { useFileTreeContext, useSelectedIDContext, useNewItemToggleContext } from "@/components/ui/UIProvider";
import EmptyFiles from "@/components/ui/Files";
import FileDropdown from "@/components/ui/FileTree/FileDropdown";
import FolderDropdown from "@/components/ui/FileTree/FolderDropdown";

// Define types for file icons and collapsible component
interface FILE_ICONS {
  js: React.JSX.Element;
  css: React.JSX.Element;
  html: React.JSX.Element;
  jsx: React.JSX.Element;
};

interface CollapsableComponent {
  isopen: boolean | number;
  children: any;
};

interface RootValues {
  id:number;
  name:string;
  contents:string;
}

// File icons object
const FILE_ICONS: Record<any, any> = {
  js: <DiJavascript1 />,
  css: <DiCss3Full />,
  html: <DiHtml5 />,
  jsx: <DiReact />,
  md: <DiMarkdown />,
};

// Styled components for tree structure
const StyledTree = styledComponents.div`
  line-height: 1.5;
`;

const StyledFile = styledComponents.div`
  padding-left: 20px;
  display: flex;
  align-items: center;
  span {
    margin-left: 5px;
  }
`;

const StyledFolder = styledComponents.div`
  padding-left: 20px;
  .folder--label {
    display: flex;
    align-items: center;
    span {
      margin-left: 5px;
    }
  }
`;

// Collapsible styled component
const Collapsible: React.FC<CollapsableComponent> = styledComponents.div`
  height: ${(p: any)=> (p.isopen ? "0" : "auto")};
  overflow: hidden;
`;

// File component
const File = ({ id, name, selection, contents }:{ id:number, name:string, selection:any, contents:string }) => {

  // Extract file extension
  const ext = name.split(".")[1];

  // Function to handle file selection
  const handleSelection = () => { selection.setSelectedID([id,name]); };

  // Check if file is selected
  const isSelected: boolean = (selection.selectedID[0]==id) ? true : false;

  // Render file component
  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault(); // prevent the default behavior when right clicked
      }}
    >
      <StyledFile>
        <div className="flex items-center">
          {/* Render file icon */}
          {FILE_ICONS[ext] || <AiOutlineFile />}
          {/* Render file name */}
          <div onClick={handleSelection}>
            <span
              className={`${isSelected ? 'text-purple-500' : 'text-black'}`}
            >
              {name}
            </span>
          </div>
          {/* Render file dropdown menu if selected */}
          {isSelected && (
            // this keeps track of how far left the dropdown is from the item
            <div className="ml-10">
              <FileDropdown id={id} data={contents} name={name} />
            </div>
            )}
        </div>
      </StyledFile>
    </div>
  );
};

// Folder component
const Folder = ({ id, name, selection, children }: {id:number, name:string, selection:any, children:any}) => {
  const [isOpen, setIsOpen] = useState<boolean | number>(+false);

  // Function to handle file selection
  const handleSelection = () => { selection.setSelectedID([id,name]); };

  // Check if folder is selected
  const isSelected: boolean = (selection.selectedID[0]==id) ? true : false;

  // Render folder component
  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault(); // prevent the default behavior when right clicked
      }}
    >
      <StyledFolder>
        <div className="flex items-center">
          {/* Render folder icon and name */}
          <div className="folder--label" onClick={handleSelection}>
            <AiOutlineFolder />
            <span
              className={`${isSelected ? 'text-purple-500' : 'text-black'}`}
            >
            {name}
            </span>
          </div>
            {/* Render file dropdown menu if selected */}
            {isSelected && (
              // this keeps track of how far left the dropdown is from the item
              <div className="ml-10">
                <FolderDropdown isOpen={isOpen} setIsOpen={setIsOpen} />
              </div>
            )}
        </div>
        {/* Render folder contents */}
        <Collapsible isopen={isOpen}>
          {children}
        </Collapsible>
      </StyledFolder>
    </div>
  );
};

// Tree component
const Tree = ({ children }: any) => {
  return <StyledTree>{children}</StyledTree>;
};

// Root component to render file tree
const Root = ({ data, selection }: any) => {

  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault(); // prevent the default behavior when right clicked
      }}
    >
      {/* Map over file tree data and render file or folder components */}
      {data && data.map((item: any, index: number) => {

        const {id,name,contents}: RootValues = item;

        if (item.type === "file") {
          return (
            <Tree.File key={index} id={id} name={name} selection={selection} contents={contents} />
          );
        } else if (item.type === "folder") {
          return (
            <Tree.Folder key={index} id={id} name={name} selection={selection}>
              <Root data={contents} selection={selection} />
            </Tree.Folder>
          );
        }

        // cut off folder if no match is found
        return null;
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

  return (
    <div className="z-10">
      {/* Render file tree if files exist */}
      <div>
        <div className="pl-5 flex items-center"
          onClick={()=>{
            // deselect any item and open new item modal
            selection?.setSelectedID([0,'']);
            newItemToggle?.setNewIsOpen(true);
          }}>
            Create New
            <div className="pl-2">
              <img src="/plus-circle-svgrepo-com.svg" alt="New Item" width={15} height={15} />
            </div>
        </div>
        
        {files && (
          <Tree>
            <Tree.Root data={files.state.files} selection={selection} />
          </Tree>
        )}
      </div>

      {/* Render empty files component if no files exist */}
      {!files && (
        <div
          onContextMenu={(e) => {
            e.preventDefault(); // prevent the default behaviour when right clicked
          }}
        >
          <EmptyFiles />
        </div>
      )}
    </div>
  );
};