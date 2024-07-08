'use client'

import { useUser } from '@auth0/nextjs-auth0/client';
import React, { useState, createContext, useEffect, useContext, useReducer } from 'react';

// Create context for file tree, selected file, and rename toggle
const FileTreeContext = createContext({});
const SelectedIDContext = createContext({selectedID: [0,''], setSelectedID: (e:[number,string]) => {e}});
const SelectedEditIDContext = createContext({selectedEditID: [0,''], setSelectedEditID: (e:[number,string]) => {e}});
const RenameToggleContext = createContext({renameIsOpen: false, setRenameIsOpen: (e:boolean) => {e}});
const NewItemToggleContext = createContext({newIsOpen: false, setNewIsOpen: (e:boolean) => {e}});
const IndexSortContext = createContext({indexSort: false, setIndexSort: (e:boolean)=> {e}});
const NotificationToggleContext = createContext({notifyToggle: false, setNotifyToggle: (e:boolean)=> {e}});
const NotificationContentContext = createContext({notifyContent:['',''], setNotifyContent: (e:[string,string]) => {e}});

interface State {
    files: any;
    start_count?: number;
};

interface Action {
    type: 'get_files' | 'insert_file' | 'rename_file' | 'delete_file' | 'sort_index' | 'save_file';
    selectID?: number;
    payload?: any;
    count?: number;
};

function reducer(state: State, action: Action): State {

    function rename_file(state: State, action: Action) {
        return (state.files).map((item: any) => {
            if (item.type === "file") {
                if (item.id === action.payload.id) {
                    return {...item, name: action.payload.newName};
                }
            } else if (item.type === "folder") {
                return {...item, content: rename_file({files: item.content}, action)};
            }
            return item;
        });
    }

    function save_file(state: State, action: Action) {
        return (state.files).map((item: any) => {
            if (item.type === "file") {
                if (item.id === action.payload.id) {
                    return {id: item.id, type: "file", name: item.name, content: action.payload.content};
                }
            } else if (item.type === "folder") {
                return {type: "folder", name: item.name, content: save_file({files: item.content}, action)};
            }
            return item;
        });
    }

    function sort_index(state: State, action: Action): State {
        // Initialize count with the action count or 0
        action.count = action.count ?? 0;

        // Initialize count with the action count or 0
        action.count = action.count ?? 0;

        const alphabetizeFiles = (files: any[]): any[] =>{
            // create sorted list of items in current directory
            const sorted_dir = (files: any) => files.sort(function(a:any, b: any) {
                return a.name.localeCompare(b.name);
            });

            // sort the current directory
            const sorted_root: any = sorted_dir(files);

            return sorted_root.map((item: any) => {
                // dig through directory of item if folder
                if (item.type == 'folder') {
                    return {...item, content: alphabetizeFiles(item.content)};
                }

                // return item if file
                return item;
            })
        }
    
        // Function to sort files and update IDs
        function sortFiles(files: any[], action: Action): any[] {
            return files.map((item: any) => {
                if (item.type === 'file') {
                    action.count! += 1; // Increment count for files

                    // update editor of new id
                    action.payload.editorID ?
                        action.payload.editorID[0] == item.id ? (
                            action.payload.setEditorID([action.count,action.payload.editorID[1]])
                        ): 0: 0;

                    // update selection of new id
                    action.payload.selectID ?
                        action.payload.selectID[0] == item.id ? (
                            action.payload.setSelectID([action.count,action.payload.selectID[1]])
                        ):0 :0;

                    const updatedFile = { ...item, id: action.count }; // Update file with new ID
                    return updatedFile;
                } else if (item.type === 'folder') {
                    const currentCount = action.count! + 1; // Store current count for folder ID (otherwise folder ID will increment with files)
                    action.count! += 1;
                    const sortedContent = sortFiles([...item.content], action); // Recursively sort folder contents
                    return {
                        ...item,
                        id: currentCount,
                        content: sortedContent
                    };
                }
            });
        };
    
        // Return alphabetized files with sorted indexes
        return { files: sortFiles(alphabetizeFiles(state.files), action) };
    }    

    function delete_file(state: State, action: Action) {
        return state.files.map((item: any) => {
            if (item.type === "file") {
                // delete file
                return (item.id === action.payload.id) ? false : item;
            } else if (item.type === "folder") {

                if (item.id == action.payload.id) {
                    // delete entire folder
                    return (item.id === action.payload.id) ? false : item;
                } else {
                    // continue to drill through folder
                    return {
                        ...item,
                        content: delete_file({files: item.content}, action)
                    };
                }
            }

            // return file as normal (not intended for deletion)
            return item;
        }).filter(Boolean);
    }

    function create_file(state: State, action: Action) {

        function updateFolderContent(files: any[], index: number, payload: any): any[] {
            return files.map((item: any) => {
                if (item.type === 'folder') {
                    if (item.id == index) {
                        const updatedFolder = {...item, content:[...item.content, payload]};
                        return updatedFolder;
                    } else {
                        const updatedContent = updateFolderContent(item.content, index, payload);
                        return { ...item, content: updatedContent };
                    }
                }
                return item;
            });
        }

        // if no selection then insert at bottom of root
        if (action.selectID == 0) {
            return [...state.files, action.payload];
        }
        // else dig through filetree until selected folder is found
        else {
            return updateFolderContent(state.files, action.selectID!, action.payload);
        }
    }
    
    switch (action.type) {
        default:
            return state;
        case 'get_files':
            return {files: action.payload};
        case 'save_file':
            return {files: save_file(state, action)};
        case 'insert_file':
            return {files: create_file(state, action)};
        case 'rename_file':
            return {files: rename_file(state, action)};
        case 'delete_file':
            return {files: delete_file(state, action)};
        case 'sort_index':
            return sort_index(state, {...action, count: 0});
    }
}

const UIProvider = ({ children }: any) => {
    const [state, dispatch] = useReducer(reducer, { files: [] });
    const [selectedID, setSelectedID] = useState<[number, string]>([0,'']);
    const [selectedEditID, setSelectedEditID] = useState<[number, string]>([0, '']);
    const [renameIsOpen, setRenameIsOpen] = useState<boolean>(false);
    const [newIsOpen, setNewIsOpen] = useState<boolean>(false);
    const [indexSort, setIndexSort] = useState<boolean>(false);
    const [notifyToggle, setNotifyToggle] = useState<boolean>(false);
    const [notifyContent, setNotifyContent] = useState(['','']);
    const { user } = useUser();

    // grabs data from database
    const getData = async () => {
        const response = await fetch("/api/db", { method: 'GET' });
        if (response.ok) {
            const result = await response.json();
            dispatch({
                type: "get_files",
                selectID: 0,
                payload: JSON.parse(result)
            });
        } else {
            console.error("Error fetching data");
        }
    }
    
    useEffect(() => {
        // grab data from database if user is logged in
        if (user) {
            getData().catch(e => console.error("Error fetching data:", e));
        // grab dummy data if no user
        } else {
            dispatch({
                type: "get_files",
                selectID: 0,
                payload: [
                    { id: 0, name: "New File.md", type: "file", content: "This is dummy text." },
                    { id: 0, name: "New Folder", type: "folder", content: [
                        { id: 0, name: "New File 2.md", type: "file", content: "This is dummy text." },
                    ]},
                ]
            })
        }

        setIndexSort(true);
    }, [user])
    
    // sort files alphabetically and then sorts index
    useEffect(() => {
        if (indexSort == true) {
            dispatch({
                type: 'sort_index',
                payload:{EditorID:selectedEditID,setEditorID:setSelectedEditID,selectID:selectedID,setSelectID:setSelectedID}
            });
            setIndexSort(false);
        }
    }, [indexSort]);

    return (
        <FileTreeContext.Provider value={{state, dispatch}}>
            <SelectedIDContext.Provider value={{selectedID, setSelectedID}}>
                <SelectedEditIDContext.Provider value={{selectedEditID, setSelectedEditID}}>
                    <RenameToggleContext.Provider value={{renameIsOpen, setRenameIsOpen}}>
                        <NewItemToggleContext.Provider value={{newIsOpen, setNewIsOpen}}>
                            <IndexSortContext.Provider value={{indexSort, setIndexSort}}>
                                <NotificationToggleContext.Provider value={{notifyToggle,setNotifyToggle}}>
                                    <NotificationContentContext.Provider value={{notifyContent,setNotifyContent}}>
                                        {children}
                                    </NotificationContentContext.Provider>
                                </NotificationToggleContext.Provider>
                            </IndexSortContext.Provider>
                        </NewItemToggleContext.Provider>
                    </RenameToggleContext.Provider>
                </SelectedEditIDContext.Provider>
            </SelectedIDContext.Provider>
        </FileTreeContext.Provider>
    );
};

export function useFileTreeContext() { return useContext(FileTreeContext) };
export function useSelectedIDContext() { return useContext(SelectedIDContext) };
export function useSelectedEditContext() { return useContext(SelectedEditIDContext) };
export function useRenameToggleContext() { return useContext(RenameToggleContext) };
export function useNewItemToggleContext() { return useContext(NewItemToggleContext) };
export function useSortIndexContext() { return useContext(IndexSortContext) };
export function useNotifyToggleContext() { return useContext(NotificationToggleContext) };
export function useNotifyContentContext() { return useContext(NotificationContentContext)};

export default UIProvider;