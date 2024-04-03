import React, { useEffect, useState } from "react"
import styledComponents from "styled-components"
import { AiOutlineFile, AiOutlineFolder } from "react-icons/ai"
import { DiJavascript1, DiCss3Full, DiHtml5, DiReact, DiMarkdown } from "react-icons/di"
import Files from "@/components/ui/Files";

interface FILE_ICONS {
  js: React.JSX.Element;
  css: React.JSX.Element;
  html: React.JSX.Element;
  jsx: React.JSX.Element;
}

interface CollapsableComponent {
  isopen: boolean | number;
  children: any;
}

const FILE_ICONS: Record<any, any> = {
  js: <DiJavascript1 />,
  css: <DiCss3Full />,
  html: <DiHtml5 />,
  jsx: <DiReact />,
  md: <DiMarkdown />,
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
  const [isOpen, setIsOpen] = useState<boolean | number>(+false);

  const handleToggle = (e: any) => {
    e.preventDefault();
    setIsOpen(+!isOpen);
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

const Root = ({ data }: any) => {
  return (
    <>
      {data && data.map((item: any, index: number) => {
        if (item.type=="file") {
          return (
            <div key={index}>
              <Tree.File name={item.name} />
            </div>
          )
        } else if (item.type=="folder") {
          return (
            <div key={index}>
              <Tree.Folder name={item.name}>
                <Root data={item.content} />
              </Tree.Folder>
            </div>
          )
        }
      })}
    </>
  )
}

Tree.File = File;
Tree.Folder = Folder;
Tree.Root = Root;

export default function FileTreeSidebar() {

  const [files, setFiles] = useState<any>("");

  useEffect(() => {

    try {

      const getData = async () => {
        const response = await fetch("/api/db", { method: 'GET' })
        
        if (response.ok) {
          return await response.json().then((result)=>{setFiles(JSON.parse(result))})
        } else { return "Error" }
      }

      // getUserID()
      getData()
    } catch (e) {
      console.error("Invalid JSON:", e)
    }
  }, [])
  
  if (files.length>0)  {
    return (
      <>
      <Tree>
        <Tree.Root data={files} />
      </Tree>
    </>
    )
  } else {
    return <Files />
  }
  
}