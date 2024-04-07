'use client'

import { useUser } from '@auth0/nextjs-auth0/client';
import React, { useState, createContext, useEffect, useContext } from 'react';

const FileTreeContext = createContext({});
const SelectedFileContext = createContext({selectedFile: [''], setSelectedFile: (e:string[]) => {e}});

const FileTreeProvider = ({ children }: any) => {

    const [files, setFiles] = useState<any>('');
    const [selectedFile, setSelectedFile] = useState<any[]>(["",""]);
    const { user } = useUser()
    
    // on user dependency change fetch files
    useEffect(() => {

        if (user) {

            const getData = async () => {
                const response = await fetch("/api/db", { method: 'GET' })
                
                if (response.ok) {
                    // set the file state to database response
                    return await response.json()
                    .then((result)=>{
                        setFiles(JSON.parse(result));
                    })
                } else { return "Error" }
            }

            try {
                // get data if user logged in
                getData()
            } catch (e) {
                console.error("Invalid JSON:", e)
            }
        }
    },[user])

    return (
        <FileTreeContext.Provider value={files}>
            <SelectedFileContext.Provider value={{selectedFile, setSelectedFile}}>
                {children}
            </SelectedFileContext.Provider>
        </FileTreeContext.Provider>
    );
};

export function useFileTreeContext() { return useContext(FileTreeContext) };
export function useSelectedFileContext() { return useContext(SelectedFileContext) };
export default FileTreeProvider;