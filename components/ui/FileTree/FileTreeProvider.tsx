'use client'

// Import necessary hooks and components
import { useUser } from '@auth0/nextjs-auth0/client';
import React, { useState, createContext, useEffect, useContext, useReducer } from 'react';

// Create context for file tree, selected file, and rename toggle
const FileTreeContext = createContext({});
const SelectedItemContext = createContext({selectedItem: [''], setSelectedItem: (e:string[]) => {e}});
const SelectedEditContext = createContext({selectedEdit: [''], setSelectedEdit: (e:string[]) => {e}});
const RenameToggleContext = createContext({renameIsOpen: false, setRenameIsOpen: (e:boolean) => {e}});
const NewItemToggleContext = createContext({newIsOpen: false, setNewIsOpen: (e:boolean) => {e}});

// Define types for state and action
interface State {
    files: any;
};

interface Action {
    type: 'get_files' | 'insert_file' | 'rename_file' | 'delete_file';
    location?: string;
    payload: any;
};

// Reducer function to manage state changes
function reducer(state: State, action: Action): State {

    // TODO: Enable renaming and deletion of folders

    // Define function to rename file
    function rename_file(state: State, action: Action) {
        // Map over files array and check for file type
        return (state.files).map(
            (item: any)=>{
                if (item.type==="file") {
                    // If file type, check if current name matches selected name
                    if (item.name===action.payload.currentName) {
                        // If match, return updated file object with new name
                        return {"type":"file", "name":action.payload.newName, "text":item.text};
                    }
                } else if (item.type==="folder") {
                    // If folder type, recursively call rename_file function to update folder content
                    return {"type":"folder", "name":item.name, "content":rename_file({files:item.content}, action)};
                }
                // Return original item if no match
                return item;
            }
        );
    };

    // Define function to delete file
    function delete_file(state: State, action: Action) {
        return state.files.map(
            (item: any) => {
                if (item.type === "file") {
                    // Keep the item if its name doesn't match the selected name
                    return (item.name === action.payload.name) ? false : item;
                } else if (item.type === "folder") {
                    // Use recursion to perform the same operation for the folder contents
                    return {
                        ...item,
                        content: delete_file({ files: item.content }, action) // Update folder content
                    };
                }
                // return all other items
                return item;
            }
        ).filter(Boolean); // Filter out false values
    }

    function create_file(state: State, action: Action) {
        if (action?.location) {
            if (action.location === "root") {
                // Push the payload to the root level
                return [...state.files, action.payload];
            } else {
                // Recursively find the target folder and update its content starting from the top of the root
                return updateFolderContent(state.files, action.location, action.payload);
            }
        }

        // Helper function to recursively update folder content
        function updateFolderContent(files: any[], location: string, payload: any): any[] {
            return files.map((item: any) => {
                if (item.type === 'folder' && item.name === location) {
                    // Clone the folder and update its content by pushing the payload
                    const updatedFolder = { ...item, content: [...(item.content || ['']), payload] };
                    return updatedFolder;
                } else if (item.type === 'folder') {
                    // Recursively search within subfolders
                    const updatedContent = updateFolderContent(item.content, location, payload);
                    return { ...item, content: updatedContent };
                }
                // Return the original item if it's not a folder
                return item;
            });
        }
    };
    
    // Switch statement to handle different action types
    switch (action.type) {
        default:
            return state;
        case 'get_files':
            // Return updated state with fetched files
            return {files: action.payload};
        case 'insert_file':
            // Insert new file into file tree
            return {files: create_file(state,action)};
        case 'rename_file':
            // Rename file in file tree
            return {files: rename_file(state,action)};
        case 'delete_file':
            // Delete file from file tree
            return {files: delete_file(state, action)};
    };
};

// FileTreeProvider component to manage file tree context
const FileTreeProvider = ({ children }: any) => {

    // Initialize state and dispatch function using useReducer hook
    const [state, dispatch] = useReducer(reducer, {files:null});
    const [selectedItem, setSelectedItem] = useState<string[]>(["root",""]);
    const [selectedEdit, setSelectedEdit] = useState<string[]>(["",""]);
    const [renameIsOpen, setRenameIsOpen] = useState<boolean>(false);
    const [newIsOpen, setNewIsOpen] = useState<boolean>(false);
    const { user } = useUser();

    const getData = async () => {
        const response = await fetch("/api/db", { method: 'GET' });
        
        if (response.ok) {
            // Dispatch action to update state with fetched files
            return await response.json()
            .then((result: any)=>{
                dispatch({type:"get_files", payload: JSON.parse(result)});
            })
        } else { return "Error" }
    }
    
    // Fetch files from database on user login
    useEffect(() => {

        if (user) {
            try {
                // Fetch data if user logged in
                getData();
            } catch (e) {
                // Return an error
                console.error("Invalid JSON:", e);
            }
        }
    },[user]);

    // Provide context values to children components
    return (
        <FileTreeContext.Provider value={{state,dispatch}}>
            <SelectedItemContext.Provider value={{selectedItem, setSelectedItem}}>
                <SelectedEditContext.Provider value={{selectedEdit,  setSelectedEdit}}>
                    <RenameToggleContext.Provider value={{renameIsOpen, setRenameIsOpen}}>
                        <NewItemToggleContext.Provider value={{newIsOpen, setNewIsOpen}}>
                            {children}
                        </NewItemToggleContext.Provider>
                    </RenameToggleContext.Provider>
                </SelectedEditContext.Provider>
            </SelectedItemContext.Provider>
        </FileTreeContext.Provider>
    );
};

/** Custom hook that allows FileTree access */
export function useFileTreeContext() { return useContext(FileTreeContext) };

/** Custom hook that allows selected file access */
export function useSelectedItemContext() { return useContext(SelectedItemContext) };

/** Custom hook that allows selected file to be edited */
export function useSelectedEditContext() { return useContext(SelectedEditContext) };

/** Custom hook that keeps track of toggling open Rename Modal */
export function useRenameToggleContext() { return useContext(RenameToggleContext) };

/** Custom hook that keeps track of toggling open New Item Modal */
export function useNewItemToggleContext() { return useContext(NewItemToggleContext)};

/** Export FileTree as prop */
export default FileTreeProvider;