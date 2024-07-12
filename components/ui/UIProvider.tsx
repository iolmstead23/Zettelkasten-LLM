'use client'

import { useUser } from '@auth0/nextjs-auth0/client';
import React, { useState, createContext, useEffect, useContext, useReducer, use } from 'react';

// Create context for file tree, selected file, and rename toggle
const FileTreeContext = createContext({});
const SelectedIDContext = createContext({selectedID: [0,''], setSelectedID: (e:[number,string]) => {e}});
const SelectedEditIDContext = createContext({selectedEditID: [0,'',''], setSelectedEditID: (e:[number,string,string]) => {e}});
const RenameToggleContext = createContext({renameIsOpen: false, setRenameIsOpen: (e:boolean) => {e}});
const NewItemToggleContext = createContext({newIsOpen: false, setNewIsOpen: (e:boolean) => {e}});
const DeleteToggleContext = createContext({deleteIsOpen: false, setDeleteIsOpen: (e:boolean) => {e}});
const IndexSortContext = createContext({indexSort: false, setIndexSort: (e:boolean)=> {e}});
const NotificationToggleContext = createContext({notifyToggle: false, setNotifyToggle: (e:boolean)=> {e}});
const NotificationContentContext = createContext({notifyContent:['',''], setNotifyContent: (e:[string,string]) => {e}});
const KnowledgeGraphContext = createContext({nodes:[{}], setNodes: (e:Object[]) => {e}});
const FileLocationContext = createContext({fileLocation:[''], setFileLocation: (e:[string]) => {e}});

interface State {
    files: FileTreeObject[];
    start_count?: number;
};

interface Action {
    type: 'get_files' | 'insert_file' | 'rename_file' | 'delete_file' | 'sort_index' | 'save_file' | 'get_nodes';
    selectID?: number;
    payload?: any;
    count?: number;
    fileFound?: boolean;
};

interface FileTreeObject {
    id: number;
    type: string;
    name: string;
    contents: FileTreeObject[] | string;
};

function reducer(state: State, action: Action): State {

    function rename_file(state: State, action: Action): any {

        const id: number = action.payload?.id!;
        const newName: string = action.payload?.newName!;

        return (state.files).map((item: any) => {
            // if we have located the selected file
            if (item.id == id) {
                // return new filename with extension
                if (item.type == 'file') {
                    return {...item, name: newName};
                }
                // return new foldername without extension
                else if (item.type == 'folder') {
                    return {...item, name: newName.split('.')[0]};
                }
            }
            else {
                // return item without changes
                if (item.type=='file') {
                    return item;
                }
                // dig through folder
                else if (item.type=='folder') {
                    return {...item, contents: rename_file({files: item.contents}, action)};
                }
            }
            
            return item;
        });
    }

    function save_file(state: State, action: Action): any {
        return (state.files).map((item: any) => {
            if (item.type === "file") {
                if (item.id === action.payload?.id) {
                    return {id: item.id, type: "file", name: item.name, contents: action.payload?.contents};
                }
            } else if (item.type === "folder") {
                return {type: "folder", name: item.name, contents: save_file({files: item.contents}, action)};
            }
            return item;
        });
    }

    function sort_index(state: State, action: Action): State {
        // Initialize count with the action count or 0
        action.count = action.count ?? 0;
        
        action.fileFound = false;

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
                    return {...item, contents: alphabetizeFiles(item.contents)};
                }

                // return item if file
                return item;
            })
        }

        function getFilePath(
            fileTreeObjects: FileTreeObject[],
            selectedId: number
        ): string[] {
            let fileFound = false;
            let filePath: string[] = [];
            const mapFileTree = (objects: FileTreeObject[]): string[] => {
                function mapFolders(objects: FileTreeObject[]): string[] {
                    objects.forEach((obj: FileTreeObject): any => {
                        if (!fileFound) {
                            if (obj.type === 'file') {
                                if (obj.id === selectedId && !fileFound) {
                                    fileFound = true;
                                }
                            } else {
                                filePath = [...filePath, obj.name];
                                const folderContent: FileTreeObject[] = [...obj.contents as FileTreeObject[]];
                                mapFolders(folderContent);
                                if (!fileFound) { filePath.pop() };
                            }
                        } else { return; }
            
                    });
                    return filePath;
                }
                return mapFolders(objects);
            }
            return mapFileTree(fileTreeObjects);
        }
    
        function sortFiles(files: FileTreeObject[], action: Action): FileTreeObject[] {

            const editorID = action.payload?.editorID;
            const setEditorID = action.payload?.setEditorID!;
            const selectID = action.payload?.selectID;
            const setSelectID = action.payload?.setSelectID!;
            const setFileLocation = action.payload?.setSelectFileLocation!;

            let fileMap: any[] = [];
        
            fileMap = files.map((item: FileTreeObject) => {
                if (item.type === 'file') {
                    action.count! += 1; // Increment count for files
        
                    // Update editor and select IDs if they match the current item ID
                    if (editorID && editorID[0] == item.id) {
                        setEditorID([action.count!, editorID[1], editorID[2]]);
                    }
        
                    if (selectID && selectID[0] == item.id) {
                        setSelectID([action.count as number, selectID[1], selectID[2]]);
                    }
        
                    const updatedFile = { ...item, id: action.count }; // Update file with new ID
                    return updatedFile;
                } else if (item.type === 'folder') {
                    const currentCount = action.count! + 1; // Store current count for folder ID
                    action.count! += 1;
                    const sortedContent = sortFiles([...item.contents as FileTreeObject[]], action); // Recursively sort folder contents
        
                    return {
                        ...item,
                        id: currentCount,
                        contents: sortedContent
                    };
                }
            });

            // update file location
            setFileLocation(getFilePath(fileMap, editorID[0]));
        
            return fileMap;
        }
    
        // Return alphabetized files with sorted indexes
        return {files: sortFiles(alphabetizeFiles(state.files), action)};
    }

    function delete_file(state: State, action: Action) {

        const id = action.payload?.id;
        return state.files.map((item: any):any => {
            if (item.type === "file") {
                // delete file
                return (item.id === id) ? false : item;
            } else if (item.type === "folder") {

                if (item.id == id) {
                    // delete entire folder
                    return (item.id === id) ? false : item;
                } else {
                    // continue to drill through folder
                    return {
                        ...item,
                        contents: delete_file({files: item.contents}, action)
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
                        const updatedFolder = {...item, contents:[...item.contents, payload]};
                        return updatedFolder;
                    } else {
                        const updatedContent = updateFolderContent(item.contents, index, payload);
                        return { ...item, contents: updatedContent };
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
    const [selectedEditID, setSelectedEditID] = useState<[number, string, string]>([0,'','']);
    const [renameIsOpen, setRenameIsOpen] = useState<boolean>(false);
    const [newIsOpen, setNewIsOpen] = useState<boolean>(false);
    const [deleteIsOpen, setDeleteIsOpen] = useState<boolean>(false);
    const [indexSort, setIndexSort] = useState<boolean>(false);
    const [notifyToggle, setNotifyToggle] = useState<boolean>(false);
    const [notifyContent, setNotifyContent] = useState(['','']);
    const [nodes, setNodes] = useState<Object[]>([{}]);
    const [fileLocation,setFileLocation] = useState<[string]>(['']);
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

    function getNodes(data: FileTreeObject[]): any {
        let count: number = 0;
    
        function getNodeState(data: FileTreeObject[]): any[] {
            let files: any[] = [];
    
            data.forEach((item: any) => {
                // increment by 1 regardless of item
                count += 1;
    
                if (item.type === 'file') {
                    files.push({ id: String(count), text: item.name, myicon: 'el-icon-star-on' });
                } else if (item.type === 'folder') {
                    files.push(...getNodeState(item.contents));
                }
            });
    
            return files;
        }
    
        return getNodeState(data);
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
                    {id: 0, type: 'file', name: 'New File.d', contents: 'This is dummy text' },
                    {id: 1, type: 'folder', name: 'New Folder', contents: [
                        {id: 2, type: 'file', name: 'New File 2.md', contents: 'This is dummy text' },
                        {id: 3, type: 'folder', name: 'New Folder 2', contents: [
                            {id: 4, type: 'file', name: 'New File 3.md', contents: 'This is dummy text' }
                        ]}
                    ]},
                ]
            });
        }

        setIndexSort(true);
    }, [user])
    
    // sort files alphabetically and then sorts index
    useEffect(() => {
        if (indexSort == true) {

            dispatch({
                type: 'sort_index',
                payload:{
                    editorID:selectedEditID,setEditorID:setSelectedEditID,
                    selectID:selectedID,setSelectID:setSelectedID,
                    selectFileLocation:fileLocation,setSelectFileLocation:setFileLocation,
                }
            });

            // initial rendering of nodes
            setNodes(getNodes(state.files));

            // reset toggle to off
            setIndexSort(false);
        }
    }, [indexSort]);

    return (
        <FileTreeContext.Provider value={{state, dispatch}}>
            <SelectedIDContext.Provider value={{selectedID, setSelectedID}}>
                <SelectedEditIDContext.Provider value={{selectedEditID, setSelectedEditID}}>
                    <RenameToggleContext.Provider value={{renameIsOpen, setRenameIsOpen}}>
                        <NewItemToggleContext.Provider value={{newIsOpen, setNewIsOpen}}>
                            <DeleteToggleContext.Provider value={{deleteIsOpen,setDeleteIsOpen}}>
                                <IndexSortContext.Provider value={{indexSort, setIndexSort}}>
                                    <NotificationToggleContext.Provider value={{notifyToggle,setNotifyToggle}}>
                                        <NotificationContentContext.Provider value={{notifyContent,setNotifyContent}}>
                                            <KnowledgeGraphContext.Provider value={{nodes,setNodes}}>
                                                <FileLocationContext.Provider value={{fileLocation,setFileLocation}}>
                                                    {children}
                                                </FileLocationContext.Provider>
                                            </KnowledgeGraphContext.Provider>
                                        </NotificationContentContext.Provider>
                                    </NotificationToggleContext.Provider>
                                </IndexSortContext.Provider>
                            </DeleteToggleContext.Provider>
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
export function useDeleteToggleContext() { return useContext(DeleteToggleContext)};
export function useSortIndexContext() { return useContext(IndexSortContext) };
export function useNotifyToggleContext() { return useContext(NotificationToggleContext) };
export function useNotifyContentContext() { return useContext(NotificationContentContext)};
export function useKnowledgeGraphContext() { return useContext(KnowledgeGraphContext) };
export function useFileLocationContext() { return useContext(FileLocationContext) };

export default UIProvider;