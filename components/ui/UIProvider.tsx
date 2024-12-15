"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import React, {
  useState,
  createContext,
  useEffect,
  useContext,
  useReducer,
  useRef,
  useCallback,
} from "react";
import { Node, Edge } from "@/types";
import {
  Action,
  KnowledgeGraphAction,
  FileTreeState,
  SelectedIDState,
  SelectedEditIDState,
  RenameToggleState,
  NewItemToggleState,
  DeleteToggleState,
  IndexSortState,
  NotificationContentState,
  NotificationToggleState,
  KnowledgeGraphState,
  FileLocationState,
  State,
  FileTreeObject,
  GraphData,
} from "@/types";
import { getRandomValues, randomInt } from "crypto";

// Add these helper functions at the top of UIProvider.tsx, after your interfaces
function dispatchCombined(
  fileDispatch: React.Dispatch<Action>,
  graphDispatch: React.Dispatch<KnowledgeGraphAction>,
  fileAction: Action,
  graphAction: KnowledgeGraphAction
) {
  fileDispatch(fileAction);
  graphDispatch(graphAction);
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
const KnowledgeGraphContext = createContext<KnowledgeGraphState>({
  nodes: { nodes: [], edges: [] },
});
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

      return {
        ...state,
        files: newFiles,
      };
    } catch (error) {
      console.error("Error in delete_file:", error);
      return state;
    }
  }

  /** This reindexes the filetree's files and folders. This is the most important function. */
  function sort_index(state: State, action: Action): State {
    // Initialize count with the action count or 0
    action.count = action.count ?? 0;
    action.fileFound = false;

    /** This alphabetizes the filetrees in their folder before reindexing begins */
    const alphabetizeFiles = (files: FileTreeObject[]): FileTreeObject[] => {
      if (!Array.isArray(files)) {
        console.warn("Invalid files array in alphabetizeFiles:", files);
        return [];
      }

      /** create sorted list of items in current directory */
      const sorted_dir = (files: FileTreeObject[]) =>
        files
          .filter((file): file is FileTreeObject => {
            // Filter out invalid items
            if (!file || typeof file !== "object") {
              console.warn("Invalid file object:", file);
              return false;
            }

            // Handle nested newFileData structure
            if ("newFileData" in file) {
              const newFileData = (file as any).newFileData;
              return (
                newFileData &&
                typeof newFileData === "object" &&
                "name" in newFileData &&
                "type" in newFileData
              );
            }

            // Handle regular file objects
            return (
              "name" in file &&
              "type" in file &&
              typeof file.name === "string" &&
              typeof file.type === "string"
            );
          })
          .map((file) => {
            // If it's a nested newFileData structure, extract it
            if ("newFileData" in file) {
              const newFileData = (file as any).newFileData;
              return {
                id: newFileData.id || Date.now(),
                type: newFileData.type,
                name: newFileData.name,
                contents: newFileData.contents || "",
                edges: newFileData.edges || [],
              } as FileTreeObject;
            }
            return file;
          })
          .sort((a: FileTreeObject, b: FileTreeObject) => {
            return a.name.localeCompare(b.name);
          });

      /** sort the current directory */
      const sorted_root = sorted_dir(files);

      return sorted_root.map((item: FileTreeObject) => {
        // dig through directory of item if item is folder
        if (item.type === "folder" && Array.isArray(item.contents)) {
          return {
            ...item,
            contents: alphabetizeFiles(item.contents as FileTreeObject[]),
          };
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

    /** This sorts through the alphabetized files and assigns them an incremental index number */ /** This sorts through the alphabetized files and assigns them an incremental index number */
    function sortFiles(
      files: FileTreeObject[],
      action: Action
    ): FileTreeObject[] {
      if (!Array.isArray(files)) {
        console.warn("Invalid files array in sortFiles:", files);
        return [];
      }

      // This sets the context for the sort function
      const editorID = action.payload?.editorID;
      const setEditorID = action.payload?.setEditorID!;
      const selectID = action.payload?.selectID;
      const setSelectID = action.payload?.setSelectID!;
      const setFileLocation = action.payload?.setSelectFileLocation!;

      // map through the tree using recursion on folders. Returns indexed filetree
      const fileMap: FileTreeObject[] = files.map((item: FileTreeObject) => {
        if (item.type === "file") {
          // Increment count for files
          action.count! += 1;
          const currentCount = action.count!;

          // Update editor
          if (editorID && editorID[0] === item.id) {
            setEditorID([currentCount, editorID[1], editorID[2]]);
          }

          // Update filetree selection
          if (selectID && selectID[0] === item.id) {
            setSelectID([currentCount, selectID[1], selectID[2]]);
          }

          /** Update file with new ID */
          return {
            ...item,
            id: currentCount,
            index: currentCount,
          } as FileTreeObject;
        } else if (item.type === "folder") {
          // Store current count for folder ID
          action.count! += 1;
          const currentCount = action.count!;

          /** Recursively sort folder contents */
          const sortedContent = sortFiles(
            Array.isArray(item.contents)
              ? (item.contents as FileTreeObject[])
              : [],
            action
          );

          return {
            ...item,
            id: currentCount,
            index: currentCount,
            contents: sortedContent,
          } as FileTreeObject;
        }

        // Default case - should never happen but satisfies TypeScript
        return {
          ...item,
          id: action.count! + 1,
          index: action.count! + 1,
        } as FileTreeObject;
      });

      // update file location
      if (editorID && editorID[0] !== -1) {
        setFileLocation(getFilePath(fileMap, editorID[0]));
      }

      return fileMap;
    }

    try {
      // Ensure we have a valid files array before processing
      if (!Array.isArray(state.files)) {
        console.warn("Invalid state.files:", state.files);
        return { files: [] };
      }

      // Return alphabetized files with sorted indexes
      const sortedFiles = sortFiles(alphabetizeFiles(state.files), action);
      return { files: sortedFiles };
    } catch (error) {
      console.error("Error in sort_index:", error);
      return state;
    }

    // Return alphabetized files with sorted indexes
    return { files: sortFiles(alphabetizeFiles(state.files), action) };
  }

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

function knowledgeGraphReducer(
  state: KnowledgeGraphState,
  action: KnowledgeGraphAction
): KnowledgeGraphState {
  function get_nodes(data: FileTreeObject[]): GraphData {
    function getNodeState(data: FileTreeObject[]): GraphData {
      if (!data || !Array.isArray(data)) {
        return { nodes: [], edges: [] };
      }

      const nodes: Node[] = [];
      const edges: Edge[] = [];

      try {
        data.forEach((item: FileTreeObject) => {
          if (!item || typeof item !== "object") {
            console.warn("Invalid item in data:", item);
            return;
          }

          if (item.type === "file" && item.id != undefined) {
            nodes.push({
              id: item.id?.toString(),
              label: item.name,
              // Add random coordinates if none exist
              x: Math.random() * 10 - 5, // Random value between -5 and 5
              y: Math.random() * 10 - 5,
              z: Math.random() * 10 - 5,
            });
            if (item.edges && Array.isArray(item.edges)) {
              edges.push(...item.edges);
            }
          } else if (
            item.type === "folder" &&
            item.contents &&
            Array.isArray(item.contents)
          ) {
            const folderResults = getNodeState(
              item.contents as FileTreeObject[]
            );
            nodes.push(...folderResults.nodes);
            edges.push(...folderResults.edges);
          }
        });
      } catch (error) {
        console.error("Error processing nodes:", error);
        return { nodes: [], edges: [] };
      }

      return { nodes, edges };
    }

    const { nodes, edges } = getNodeState(data);
    return { nodes, edges };
  }

  switch (action.type) {
    case "get_nodes":
      const newNodes = get_nodes(action.payload);
      console.log("New nodes generated:", newNodes);
      return {
        nodes: newNodes,
      };

    case "insert_node":
      console.log("Inserting new node:", action.payload);
      return {
        nodes: {
          nodes: [...state.nodes.nodes, action.payload],
          edges: [...state.nodes.edges],
        },
      };

    case "insert_edge":
      return {
        nodes: {
          nodes: [...state.nodes.nodes],
          edges: [...state.nodes.edges, action.payload],
        },
      };
    case "delete_node":
      return {
        nodes: {
          nodes: state.nodes.nodes.filter(
            (node) => node.id !== action.payload.id
          ),
          edges: state.nodes.edges.filter(
            (edge) =>
              edge.source !== action.payload.id &&
              edge.target !== action.payload.id
          ),
        },
      };
    case "delete_edge":
      return {
        nodes: {
          nodes: [...state.nodes.nodes],
          edges: state.nodes.edges.filter(
            (edge) =>
              edge.source !== action.payload.source ||
              edge.target !== action.payload.target
          ),
        },
      };
    default:
      return state;
  }
}

// This is the main UIProvider component
const UIProvider = ({ children }: any) => {
  /** This stores the state of the reducer function */
  const [state, dispatch] = useReducer(reducer, { files: [] });
  /** This stores the state of the file location */
  const [fileLocation, setFileLocation] = useState<string[]>([""]);
  /** This stores the state of the knowledge graph nodes */
  const [nodes, setNodes] = useState<GraphData>({ nodes: [], edges: [] });
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

  const [graphState, graphDispatch] = useReducer(knowledgeGraphReducer, {
    nodes: { nodes: [], edges: [] },
  });

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

      // reset toggle to off
      setIndexSort(false);
    }
  }, [indexSort]);

  // Modify the effect that updates the graph
  useEffect(() => {
    if (state.files.length > 0) {
      console.log("Updating graph state with files:", state.files); // Debug log
      graphDispatch({
        type: "get_nodes",
        payload: state.files,
      });
    }
  }, [state.files]);

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
                        value={{
                          nodes: graphState.nodes,
                          dispatch: graphDispatch,
                        }}
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

export function useCombinedOperations() {
  const { dispatch: fileDispatch } = useFileTreeContext();
  const { dispatch: graphDispatch } = useKnowledgeGraphContext();
  const { selectedID } = useSelectedIDContext();

  const handleAddFile = useCallback(
    (fileData: Partial<FileTreeObject>) => {
      // Make fileData partial to allow incomplete objects
      // Generate a unique ID
      const newId = Date.now();
      const selectedFolderId = selectedID[0] || -1;

      // Create a complete FileTreeObject
      const completeFileData: FileTreeObject = {
        id: newId,
        index: newId,
        type: fileData.type || "file",
        name: fileData.name || "New File.md",
        contents: fileData.contents || "",
        edges: fileData.edges || [],
      };

      // File Tree Operation
      const fileAction: Action = {
        type: "insert_file",
        selectID: selectedFolderId,
        payload: completeFileData,
      };

      // Knowledge Graph Operation
      const graphAction: KnowledgeGraphAction = {
        type: "insert_node",
        payload: {
          id: newId.toString(),
          label: completeFileData.name,
          x: Math.random() * 10 - 5,
          y: Math.random() * 10 - 5,
          z: Math.random() * 10 - 5,
        },
      };

      dispatchCombined(fileDispatch, graphDispatch!, fileAction, graphAction);
    },
    [fileDispatch, graphDispatch]
  );

  const handleDeleteFile = useCallback(
    (id: number) => {
      // File Tree Operation
      const fileAction: Action = {
        type: "delete_file",
        payload: { id },
      };

      // Knowledge Graph Operation
      const graphAction: KnowledgeGraphAction = {
        type: "delete_node",
        payload: { id: id.toString() },
      };

      dispatchCombined(fileDispatch, graphDispatch!, fileAction, graphAction);
    },
    [fileDispatch, graphDispatch]
  );

  const handleAddEdge = useCallback(
    (source: string, target: string) => {
      const graphAction: KnowledgeGraphAction = {
        type: "insert_edge",
        payload: { source, target },
      };

      graphDispatch!(graphAction);
    },
    [graphDispatch]
  );

  return { handleAddFile, handleDeleteFile, handleAddEdge };
}

export default UIProvider;
