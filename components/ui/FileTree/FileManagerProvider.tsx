'use client'

import React, { useState, createContext, useContext } from 'react';
import FileManager from '@/components/ui/FileTree/FileManager';

// this sets the data for filemanager
const FilemanagerContext = createContext({selectedFile: [''], setSelectedFile: (e:string[]) => {e}});

// this sets the toggle for the filemanager
const FilemanagerToggleContext = createContext({isOpen: false, setIsOpen: (e:boolean) => {e}});

const FileManagerProvider = ({children}: any) => {

    const [selectedFile, setSelectedFile] = useState<string[]>(["",""]);
    const [isOpen, setIsOpen] = useState<boolean>(false);

    return (
        <FilemanagerContext.Provider value={{selectedFile,setSelectedFile}}>
            <FilemanagerToggleContext.Provider value={{isOpen,setIsOpen}}>
                {isOpen && (<FileManager />)}
                {children}
            </FilemanagerToggleContext.Provider>
        </FilemanagerContext.Provider>
    )
}

export function useFilemanagerToggleContext() { return useContext(FilemanagerToggleContext) };
export function useFileManagerContext() { return useContext(FilemanagerContext) };
export default FileManagerProvider;