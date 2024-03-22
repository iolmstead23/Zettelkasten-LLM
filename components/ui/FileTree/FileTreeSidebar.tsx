import React, { useState } from "react";
import styledComponents from "styled-components";
import { AiOutlineFile, AiOutlineFolder } from "react-icons/ai";
import { DiJavascript1, DiCss3Full, DiHtml5, DiReact } from "react-icons/di";

type FILE_ICONS = {
  js: React.JSX.Element;
  css: React.JSX.Element;
  html: React.JSX.Element;
  jsx: React.JSX.Element;
}

interface CollapsableComponent {
  isopen: boolean;
  children: any;
}

const FILE_ICONS: Record<any, any> = {
  js: <DiJavascript1 />,
  css: <DiCss3Full />,
  html: <DiHtml5 />,
  jsx: <DiReact />
};

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
const Collapsible: React.FC<CollapsableComponent> = styledComponents.div`
  height: ${p => (p.isopen ? "0" : "auto")};
  overflow: hidden;
`;

const File = ({ name }: any) => {
  let ext = name.split(".")[1];

  return (
    <StyledFile>
      {/* render the extension or fallback to generic file icon  */}
      {FILE_ICONS[ext] || <AiOutlineFile />}
      <span>{name}</span>
    </StyledFile>
  );
};

const Folder = ({ name, children }: any) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (e: any) => {
    e.preventDefault();
    setIsOpen(!isOpen);
  };

  return (
    <StyledFolder>
      <div className="folder--label" onClick={handleToggle}>
        <AiOutlineFolder />
        <span>{name}</span>
      </div>
      <Collapsible isopen={isOpen}>{children}</Collapsible>
    </StyledFolder>
  );
};

const Tree = ({ children }: any) => {
  return <StyledTree>{children}</StyledTree>;
};

Tree.File = File;
Tree.Folder = Folder;

export default function FileTreeSidebar() {
  return (
    <div>
      <Tree>
        <Tree.Folder name="src">
          <Tree.Folder name="Components">
            <Tree.File name="Modal.js" />
            <Tree.File name="Modal.css" />
          </Tree.Folder>
          <Tree.File name="index.js" />
          <Tree.File name="index.html" />
        </Tree.Folder>
        <Tree.File name="package.json" />
      </Tree>
    </div>
  );
}