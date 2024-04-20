'use client'

// Import necessary hooks and components
import React, { useState } from "react";
import styledComponents from "styled-components";
import { AiOutlineFile, AiOutlineFolder } from "react-icons/ai";
import { DiJavascript1, DiCss3Full, DiHtml5, DiReact, DiMarkdown } from "react-icons/di";
import { useFileTreeContext, useSelectedItemContext, useNewItemToggleContext } from "@/components/ui/FileTree/FileTreeProvider";
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
const File = ({ name, selection, contents }:{ name:string, selection:any, contents:string }) => {

  // Extract file extension
  let ext = name.split(".")[1];

  // Function to handle file selection
  const handleSelection = () => { selection?.setSelectedItem([name,contents]); };

  // Check if file is selected
  const isSelected: boolean = (selection?.selectedItem[0]==name) ? true : false;

  // Render file component
  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault(); // prevent the default behaviour when right clicked
      }}
    >
      <StyledFile>
        <div className="flex items-center">
          {/* Render file icon */}
          {FILE_ICONS[ext] || <AiOutlineFile />}
          {/* Render file name */}
          <span
            className={`${isSelected ? 'text-purple-500' : 'text-black'}`}
            onClick={handleSelection}
          >
            {name}
          </span>
          {/* Render file dropdown menu if selected */}
          {isSelected && (
            <div className="pl-20">
              <FileDropdown/>
            </div>
            )}
        </div>
      </StyledFile>
    </div>
  );
};

// Folder component
const Folder = ({ name, selection, children }: any) => {
  const [isOpen, setIsOpen] = useState<boolean | number>(+false);

  // Function to handle file selection
  const handleSelection = () => { selection?.setSelectedItem([name]); };

  // Check if file is selected
  const isSelected: boolean = (selection?.selectedItem==name) ? true : false;

  // Render folder component
  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault(); // prevent the default behaviour when right clicked
      }}
    >
      <StyledFolder>
        <div className="flex items-center">
          {/* Render folder icon and name */}
          <div className="folder--label" onClick={handleSelection}>
            <AiOutlineFolder />
            <span>{name}</span>
          </div>
            {/* Render file dropdown menu if selected */}
            {isSelected && (
              <div className="pl-20 justify-end">
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
    <div>
      {/* Map over file tree data and render file or folder components */}
      {data && data.map((item: any, index: number) => {
        if (item.type=="file") {
          return (
            <div key={index}>
              <Tree.File name={item.name} selection={selection} contents={item.text}/>
            </div>
          )
        } else if (item.type=="folder") {
          return (
            <div key={index}>
              <Tree.Folder name={item.name} selection={selection}>
                <Root data={item.content} selection={selection} />
              </Tree.Folder>
            </div>
          )
        }
      })}
    </div>
  )
};

// Attach components to Tree component
Tree.File = File;
Tree.Folder = Folder;
Tree.Root = Root;

//** This is the container that provides the FileTree logic */
export default function FileTreeSidebar() {

  // Get file tree context, selected file context, and file manager context
  const files: any = useFileTreeContext();
  const selection = useSelectedItemContext();
  const newItemtoggle = useNewItemToggleContext();

  // Render file tree sidebar
  return (
    <div>
      {/* Render file tree if files exist */}
      {files && (
        <div>
          <div className="pl-5 flex items-center"
            onClick={()=>{
              // deselect any item and open new item modal
              selection?.setSelectedItem(["root",""]);
              newItemtoggle?.setNewIsOpen(true);
            }}>
              Create New
              <div className="pl-2">
                <img src="/plus-circle-svgrepo-com.svg" alt="New Item" width={15} height={15} />
              </div>
          </div>
          <Tree>
            <Tree.Root data={files.state.files} selection={selection} />
          </Tree>
        </div>
      )}

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