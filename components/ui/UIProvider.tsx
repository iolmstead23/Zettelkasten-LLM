"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import React, {
  useState,
  createContext,
  useEffect,
  useContext,
  useReducer,
} from "react";

interface State {
  files: FileTreeObject[];
}

interface Edge {
  a: string;
  b: string;
}

interface Node {
  edgelist: Object[] | Edge;
}

interface Action {
  type:
    | "get_files"
    | "insert_file"
    | "rename_file"
    | "delete_file"
    | "sort_index"
    | "save_file";
  selectID?: number;
  payload?: any;
  count?: number;
  fileFound?: boolean;
}

interface FileTreeState {
  state: State;
  dispatch: React.Dispatch<Action>;
}

interface FileTreeObject {
  id: number;
  type: string;
  name: string;
  contents: FileTreeObject[] | string;
}

interface SelectedIDState {
  selectedID: [number, string];
  setSelectedID: (e: [number, string]) => void;
}

interface SelectedEditIDState {
  selectedEditID: [number, Object, string]; // Add content as the fourth element
  setSelectedEditID: (e: [number, Object, string]) => void;
}

interface RenameToggleState {
  renameIsOpen: boolean;
  setRenameIsOpen: (e: boolean) => void;
}

interface NewItemToggleState {
  newIsOpen: boolean;
  setNewIsOpen: (e: boolean) => void;
}

interface DeleteToggleState {
  deleteIsOpen: boolean;
  setDeleteIsOpen: (e: boolean) => void;
}

interface IndexSortState {
  indexSort: boolean;
  setIndexSort: (e: boolean) => void;
}

interface NotificationToggleState {
  notifyToggle: boolean;
  setNotifyToggle: (e: boolean) => void;
}

interface NotificationContentState {
  notifyContent: [string, string];
  setNotifyContent: (e: [string, string]) => void;
}

interface KnowledgeGraphState {
  nodes: Node[];
  setNodes: (e: Node[]) => void;
}

interface FileLocationState {
  fileLocation: string[];
  setFileLocation: (e: string[]) => void;
}

// Create context for file tree, selected file, and rename toggle
const FileTreeContext = createContext<FileTreeState | undefined>(undefined);
const SelectedIDContext = createContext<SelectedIDState | undefined>(undefined);
const SelectedEditIDContext = createContext<SelectedEditIDState | undefined>(
  undefined
);
const RenameToggleContext = createContext<RenameToggleState | undefined>(
  undefined
);
const NewItemToggleContext = createContext<NewItemToggleState | undefined>(
  undefined
);
const DeleteToggleContext = createContext<DeleteToggleState | undefined>(
  undefined
);
const IndexSortContext = createContext<IndexSortState | undefined>(undefined);
const NotificationToggleContext = createContext<
  NotificationToggleState | undefined
>(undefined);
const NotificationContentContext = createContext<
  NotificationContentState | undefined
>(undefined);
const KnowledgeGraphContext = createContext<KnowledgeGraphState | undefined>(
  undefined
);
const FileLocationContext = createContext<FileLocationState | undefined>(
  undefined
);

/** This reducer function is responsible for managing the filetree state */
function reducer(state: State, action: Action): State {
  /** This renames file and folders */
  function rename_file(state: State, action: Action): any {
    const id: number = action.payload?.id!;
    const newName: string = action.payload?.newName!;

    return state.files.map((item: any) => {
      // if we have located the selected file
      if (item.id == id) {
        // return new filename with extension
        if (item.type == "file") {
          return { ...item, name: newName };
        }
        // return new foldername without extension
        else if (item.type == "folder") {
          return { ...item, name: newName.split(".")[0] };
        }
      } else {
        // return item without changes
        if (item.type == "file") {
          return item;
        }
        // dig through folder
        else if (item.type == "folder") {
          return {
            ...item,
            contents: rename_file({ files: item.contents }, action),
          };
        }
      }

      return item;
    });
  }

  /** This creates both files and folders */
  function create_file(state: State, action: Action) {
    function updateFolderContent(
      files: any[],
      index: number,
      payload: any
    ): any[] {
      return files.map((item: any) => {
        if (item.type === "folder") {
          if (item.id == index) {
            const updatedFolder = {
              ...item,
              contents: [...item.contents, payload],
            };
            return updatedFolder;
          } else {
            const updatedContent = updateFolderContent(
              item.contents,
              index,
              payload
            );
            return { ...item, contents: updatedContent };
          }
        }
        return item;
      });
    }

    // if no selection then insert at bottom of root
    if (action.selectID == -1) {
      return [...state.files, action.payload];
    }
    // else dig through filetree until selected folder is found
    else {
      return updateFolderContent(state.files, action.selectID!, action.payload);
    }
  }

  function save_file(state: State, action: Action): any {
    // Helper function to filter out empty children
    function filterEmptyChildren(contents: Object): Object {
      if (typeof contents === "object" && contents !== null) {
        const filteredContents: any = {};
        for (const [key, value] of Object.entries(contents)) {
          if (value.type === "folder") {
            value.contents = filterEmptyChildren(value.contents);
            // Only include the folder if it has non-empty contents
            if (Object.keys(value.contents).length > 0) {
              filteredContents[key] = value;
            }
          } else {
            filteredContents[key] = value;
          }
        }
        return [filteredContents];
      }
      return contents;
    }

    const updatedFiles = state.files.map((item: FileTreeObject) => {
      if (item.type === "file" && item.id === action.payload?.id) {
        return {
          ...item,
          contents: filterEmptyChildren(action.payload?.contents),
        };
      } else if (item.type === "folder") {
        return {
          ...item,
          contents: save_file(
            { files: item.contents as FileTreeObject[] },
            action
          ).files,
        };
      }
      return item;
    });

    return { ...state, files: updatedFiles };
  }

  /** This deletes files and folders (id,setEditor) */
  function delete_file(state: State, action: Action): any {
    // Set the ID of the file or folder to be deleted
    const itemID: number = action.payload?.id;
    // Set the ID of the editor
    const editorID = action.payload?.editorID;
    // Used to reset the editor if the file being edited is deleted
    const setEditorID: (e: [number, string, string]) => {
      e: [number, string, string];
    } = action.payload?.setEditor;
    // Used to reset the editor if the file being edited is deleted
    const editorContents = action.payload?.editorContents;
    // Used to reset the FileLocation widget if the file being edited is deleted
    const setFileLocation = action.payload?.setSelectFileLocation;

    // check if file being edited is inside of a folder marked for deleting
    const checkEditor = (folders: FileTreeObject[]) => {
      folders.forEach((item: FileTreeObject) => {
        if (item.type === "file" && item.id === editorID[0]) {
          // Reset editor if the file being edited is inside a folder marked for deletion
          setEditorID([-1, "", ""]);
          setFileLocation([""]);
          editorContents.setEditorState(
            editorContents.parseEditorState(
              JSON.stringify({
                root: {
                  children: [
                    {
                      children: [
                        {
                          detail: 0,
                          format: 0,
                          mode: "normal",
                          style: "",
                          text: "File deleted...",
                          type: "text",
                          version: 1,
                        },
                      ],
                      direction: "ltr",
                      format: "",
                      indent: 0,
                      type: "paragraph",
                      version: 1,
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "root",
                  version: 1,
                },
              })
            )
          );
        } else if (item.type === "folder") {
          checkEditor(item.contents as FileTreeObject[]);
        }
      });
    };

    // Helper function to recursively filter out files/folders
    function filterItems(items: FileTreeObject[]): FileTreeObject[] {
      if (!Array.isArray(items)) {
        console.error("filterItems received non-array:", items);
        return [];
      }

      return items
        .map((item: FileTreeObject) => {
          // If this is a folder, process its contents
          if (item.type === "folder") {
            // Create new folder with filtered contents
            const filteredContents = filterItems(
              item.contents as FileTreeObject[]
            );
            return {
              ...item,
              contents: filteredContents,
            };
          }
          return item;
        })
        .filter((item: FileTreeObject) => {
          // After processing folders, filter out the item to be deleted
          return item.id !== action.payload?.id;
        });
    }

    try {
      if (!Array.isArray(state.files)) {
        console.error("State.files is not an array:", state.files);
        return state;
      }

      const newFiles = filterItems(state.files);
      console.log("Delete operation:", {
        originalState: state.files,
        deletedId: action.payload?.id,
        newState: newFiles,
      });

      return {
        ...state,
        files: newFiles,
      };
    } catch (error) {
      console.error("Error in delete_file:", error);
      return state;
    }

    // Make sure we're working with an array
    if (!Array.isArray(state.files)) {
      // console.error("State.files is not an array:", state.files);
      return state;
    }

    // Return new state with filtered files
    return {
      ...state,
      files: filterItems(state.files),
    };
  }

  /** This reindexes the filetree's files and folders. This is the most important function. */
  function sort_index(state: State, action: Action): State {
    // Initialize count with the action count or 0
    action.count = action.count ?? 0;
    action.fileFound = false;

    /** This alphabetizes the filetrees in their folder before reindexing begins */
    const alphabetizeFiles = (files: any[]): any[] => {
      /** create sorted list of items in current directory */
      const sorted_dir = (files: any) =>
        files.sort(function (a: any, b: any) {
          return a.name.localeCompare(b.name);
        });

      /** sort the current directory */
      const sorted_root: any = sorted_dir(files);

      return sorted_root.map((item: any) => {
        // dig through directory of item if item is folder
        if (item.type == "folder") {
          return { ...item, contents: alphabetizeFiles(item.contents) };
        }

        // return item if file
        return item;
      });
    };

    //** This keeps track of the folder directory of the file being edited */
    function getFilePath(
      fileTreeObjects: FileTreeObject[],
      selectedId: number
    ): string[] {
      let fileFound = false;
      let filePath: string[] = [];
      /** loop through filetree and create an array of folders (this can be reduced later) */
      const mapFileTree = (objects: FileTreeObject[]): string[] => {
        function mapFolders(objects: FileTreeObject[]): string[] {
          objects.forEach((obj: FileTreeObject): any => {
            if (!fileFound) {
              if (obj.type === "file") {
                if (obj.id === selectedId && !fileFound) {
                  fileFound = true;
                }
              } else {
                filePath = [...filePath, obj.name];
                const folderContent: FileTreeObject[] = [
                  ...(obj.contents as FileTreeObject[]),
                ];
                mapFolders(folderContent);
                if (!fileFound) {
                  filePath.pop();
                }
              }
            } else {
              return;
            }
          });
          return filePath;
        }
        return mapFolders(objects);
      };
      return mapFileTree(fileTreeObjects);
    }

    /** This sorts through the alphabetized files and assigns them an incremental index number */
    function sortFiles(
      files: FileTreeObject[],
      action: Action
    ): FileTreeObject[] {
      // This sets the context for the sort function
      const editorID = action.payload?.editorID;
      const setEditorID = action.payload?.setEditorID!;
      const selectID = action.payload?.selectID;
      const setSelectID = action.payload?.setSelectID!;
      const setFileLocation = action.payload?.setSelectFileLocation!;

      let fileMap: any[] = [];

      // map through the tree using recursion on folders. Returns indexed filetree
      fileMap = files.map((item: FileTreeObject) => {
        if (item.type === "file") {
          // Increment count for files
          action.count! += 1;

          // Update editor
          if (editorID && editorID[0] == item.id) {
            setEditorID([action.count!, editorID[1], editorID[2]]);
          }

          // Update filetree selection
          if (selectID && selectID[0] == item.id) {
            setSelectID([action.count as number, selectID[1], selectID[2]]);
          }

          /** Update file with new ID */
          const updatedFile = { ...item, id: action.count };
          return updatedFile;
        } else if (item.type === "folder") {
          // Store current count for folder ID. We +1 count for files AND folders
          action.count! += 1;
          const currentCount = action.count!;
          /** Recursively sort folder contents */
          const sortedContent = sortFiles(
            [...(item.contents as FileTreeObject[])],
            action
          );

          return {
            ...item,
            id: currentCount,
            contents: sortedContent,
          };
        }
      });

      // update file location
      setFileLocation(getFilePath(fileMap, editorID[0]));

      return fileMap;
    }

    // Return alphabetized files with sorted indexes
    return { files: sortFiles(alphabetizeFiles(state.files), action) };
  }

  /** This adds an edge linking together two nodes */
  function link_edge(state: State, action: Action) {}

  // This is the main switch statement for the reducer function
  switch (action.type) {
    default:
      return state;
    case "get_files":
      return { files: action.payload };
    case "save_file":
      return save_file(state, action);
    case "insert_file":
      return { files: create_file(state, action) };
    case "rename_file":
      return { files: rename_file(state, action) };
    case "delete_file":
      return delete_file(state, action);
    case "sort_index":
      return sort_index(state, { ...action, count: 0 });
  }
}

// This is the main UIProvider component
const UIProvider = ({ children }: any) => {
  /** This stores the state of the reducer function */
  const [state, dispatch] = useReducer(reducer, { files: [] });
  /** This stores the state of the file location */
  const [fileLocation, setFileLocation] = useState<string[]>([""]);
  /** This stores the state of the knowledge graph nodes */
  const [nodes, setNodes] = useState<Node[]>([]);
  /** This stores the state of the filetree selection */
  const [selectedID, setSelectedID] = useState<[number, string]>([-1, ""]);
  /** This stores the state of the editors most recently saved file (This is used to change which file to edit) */
  const [selectedEditID, setSelectedEditID] = useState<
    [number, Object, string]
  >([-1, {}, ""]);
  /** This stores the toggle state of the Rename Dialog */
  const [renameIsOpen, setRenameIsOpen] = useState<boolean>(false);
  /** This stores the toggle state of the Create Dialog */
  const [newIsOpen, setNewIsOpen] = useState<boolean>(false);
  /** This stores the toggle state of the Delete Dialog */
  const [deleteIsOpen, setDeleteIsOpen] = useState<boolean>(false);
  /** This stores the toggle state of the reducer's index sort (This is ran after every time the filetree is edited) */
  const [indexSort, setIndexSort] = useState<boolean>(false);
  /** This stores the toggle state of the Notification Box */
  const [notifyToggle, setNotifyToggle] = useState<boolean>(false);
  /** This stores the content state of the Notification Box */
  const [notifyContent, setNotifyContent] = useState<[string, string]>([
    "",
    "",
  ]);
  /** This gets the User data */
  const { user } = useUser();

  /** This is the initial configuration for the Lexical text editor */
  const initialConfig = {
    namespace: "lexical-editor",
    theme: {
      root: "p-4 min-h-[72.5vh] focus:outline-none outline-none",
      link: "cursor-pointer",
      text: {
        bold: "font-semibold",
        underline: "underline",
        italic: "italic",
        strikethrough: "line-through",
        underlineStrikethrough: "underlined-line-through",
      },
    },
    onError: (error: any) => {
      console.log(error);
    },
  };

  /* This is the format that Lexical needs to use */
  const fileContents: Object = {
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text: "Hello, this is the initial state of the editor.",
              type: "text",
              version: 1,
            },
          ],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1,
        },
      ],
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  };

  /** grabs data from database */
  const getData = async () => {
    const response = await fetch("/api/db", { method: "GET" });
    if (response.ok) {
      const result = await response.json();
      dispatch({
        type: "get_files",
        selectID: 0,
        payload: JSON.parse(result),
      });
    } else {
      // console.error("Error fetching data");
    }
  };

  /** generates an array of nodes to plot on the knowledge graph. This is called when filetree is reindexed */ // In UIProvider.tsx
  function getNodes(data: FileTreeObject[]): Node[] {
    let count: number = 0;

    function getNodeState(data: any): any[] {
      // Add validation
      if (!data || !Array.isArray(data)) {
        // console.error("Invalid data structure in getNodeState:", data);
        return [];
      }

      let files: any[] = [];

      try {
        data.forEach((item: any) => {
          // Make sure item is valid
          if (!item || typeof item !== "object") {
            // console.warn("Invalid item in data:", item);
            return;
          }

          // increment by 1 regardless of item
          count += 1;

          if (item.type === "file") {
            files.push({
              id: String(count),
              text: item.name,
              myicon: "el-icon-star-on",
            });
          } else if (item.type === "folder" && Array.isArray(item.contents)) {
            // Make sure contents is an array before recursing
            files.push(...getNodeState(item.contents));
          }
        });
      } catch (error) {
        // console.error("Error processing nodes:", error);
        return [];
      }

      return files;
    }

    // Add validation for initial data
    if (!Array.isArray(data)) {
      // console.error("getNodes received invalid data:", data);
      return [];
    }

    try {
      return getNodeState(data);
    } catch (error) {
      // console.error("Error in getNodes:", error);
      return [];
    }
  }

  // If user state changes then change the filetree state
  useEffect(() => {
    // grab data from database if user is logged in
    if (user) {
      getData().catch((e) => console.error("Error fetching data:", e));
      // grab dummy data if no user
    } else {
      dispatch({
        type: "get_files",
        selectID: 0,
        payload: [
          {
            id: 0,
            type: "file",
            name: "New File.md",
            contents: [fileContents],
          },
        ],
      });
    }

    // Initial sort
    setIndexSort(true);
  }, [user]);

  // triggers on indexSort toggle change
  useEffect(() => {
    if (indexSort == true) {
      // Tells the reducer function that the filetree needs to be resorted
      dispatch({
        type: "sort_index",
        payload: {
          editorID: selectedEditID,
          setEditorID: setSelectedEditID,
          selectID: selectedID,
          setSelectID: setSelectedID,
          selectFileLocation: fileLocation,
          setSelectFileLocation: setFileLocation,
        },
      });

      // initial rendering of nodes
      setNodes(getNodes(state.files));

      // reset toggle to off
      setIndexSort(false);
    }
  }, [indexSort]);

  // This is the main return statement for the UIProvider component
  return (
    <FileTreeContext.Provider value={{ state, dispatch }}>
      <SelectedIDContext.Provider value={{ selectedID, setSelectedID }}>
        <SelectedEditIDContext.Provider
          value={{ selectedEditID, setSelectedEditID }}
        >
          <RenameToggleContext.Provider
            value={{ renameIsOpen, setRenameIsOpen }}
          >
            <NewItemToggleContext.Provider value={{ newIsOpen, setNewIsOpen }}>
              <DeleteToggleContext.Provider
                value={{ deleteIsOpen, setDeleteIsOpen }}
              >
                <IndexSortContext.Provider value={{ indexSort, setIndexSort }}>
                  <NotificationToggleContext.Provider
                    value={{ notifyToggle, setNotifyToggle }}
                  >
                    <NotificationContentContext.Provider
                      value={{ notifyContent, setNotifyContent }}
                    >
                      <KnowledgeGraphContext.Provider
                        value={{ nodes, setNodes }}
                      >
                        <FileLocationContext.Provider
                          value={{ fileLocation, setFileLocation }}
                        >
                          <LexicalComposer initialConfig={initialConfig}>
                            {children}
                          </LexicalComposer>
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

/** This lets other child components edit and change filetree state */
export function useFileTreeContext() {
  const context = useContext(FileTreeContext);
  if (context === undefined) {
    throw new Error(
      "useFileTreeContext must be used within a FileTreeContextProvider"
    );
  }
  return context;
}

/** This lets other child components change the filetree selection */
export function useSelectedIDContext() {
  const context = useContext(SelectedIDContext);
  if (context === undefined) {
    throw new Error(
      "useSelectedIDContext must be used within a SelectedIDContextProvider"
    );
  }
  return context;
}

/** This lets other child components change the editor selection */
export function useSelectedEditContext() {
  const context = useContext(SelectedEditIDContext);
  if (context === undefined) {
    throw new Error(
      "useSelectedEditContext must be used within a SelectedEditIDContextProvider"
    );
  }
  return context;
}

/** This lets other child components toggle the rename dialog on and off */
export function useRenameToggleContext() {
  const context = useContext(RenameToggleContext);
  if (context === undefined) {
    throw new Error(
      "useRenameToggleContext must be used within a RenameToggleContextProvider"
    );
  }
  return context;
}

/** This lets other child components toggle the create dialog on and off */
export function useNewItemToggleContext() {
  const context = useContext(NewItemToggleContext);
  if (context === undefined) {
    throw new Error(
      "useNewItemToggleContext must be used within a NewItemToggleContextProvider"
    );
  }
  return context;
}

/** This lets other child components toggle the delete dialog on and off */
export function useDeleteToggleContext() {
  const context = useContext(DeleteToggleContext);
  if (context === undefined) {
    throw new Error(
      "useDeleteToggleContext must be used within a DeleteToggleContextProvider"
    );
  }
  return context;
}

/** This lets other child components trigger an index sort */
export function useSortIndexContext() {
  const context = useContext(IndexSortContext);
  if (context === undefined) {
    throw new Error(
      "useSortIndexContext must be used within a IndexSortContextProvider"
    );
  }
  return context;
}

/** This lets other child components toggle notification box on and off */
export function useNotifyToggleContext() {
  const context = useContext(NotificationToggleContext);
  if (context === undefined) {
    throw new Error(
      "useNotifyToggleContext must be used within a NotificationToggleContextProvider"
    );
  }
  return context;
}

/** This lets other child components provide the notification box content */
export function useNotifyContentContext() {
  const context = useContext(NotificationContentContext);
  if (context === undefined) {
    throw new Error(
      "useNotifyContentContext must be used within a NotificationContentContextProvider"
    );
  }
  return context;
}

/** This lets other child components manage the Knowledge Graph state */
export function useKnowledgeGraphContext() {
  const context = useContext(KnowledgeGraphContext);
  if (context === undefined) {
    throw new Error(
      "useKnowledgeGraphContext must be used within a KnowledgeGraphContextProvider"
    );
  }
  return context;
}

/** This lets other child components to set the edited files subdirectory folder */
export function useFileLocationContext() {
  const context = useContext(FileLocationContext);
  if (context === undefined) {
    throw new Error(
      "useFileLocationContext must be used within a FileLocationContextProvider"
    );
  }
  return context;
}

export default UIProvider;
