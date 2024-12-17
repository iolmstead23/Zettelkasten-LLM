"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import React, {
  useState,
  createContext,
  useEffect,
  useContext,
  useReducer,
  useCallback,
} from "react";
import {
  Node,
  Edge,
  SelectedEditIndexType,
  SelectedEditIndexContextType,
} from "@/types";
import {
  Action,
  KnowledgeGraphAction,
  FileTreeState,
  SelectedIndexState,
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
import { EdgeNode } from "../editor/EdgeNode";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode } from "@lexical/code";
import { TableNode, TableCellNode, TableRowNode } from "@lexical/table";
import { AutoLinkNode } from "@lexical/link";

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

const selectedIndexContext = createContext<SelectedIndexState | undefined>(
  undefined
);

const SelectedEditIndexContext = createContext<
  SelectedEditIndexContextType | undefined
>(undefined);

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

const SaveContext = createContext<
  | {
      saveFile: () => Promise<void>;
    }
  | undefined
>(undefined);

/** This reducer function is responsible for managing the file tree state */
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
      const defaultContent = {
        root: {
          children: [
            {
              children: [
                {
                  detail: 0,
                  format: 0,
                  mode: "normal",
                  style: "",
                  text: "",
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

      if (action.payload && !action.payload.contents) {
        action.payload.contents = defaultContent;
      }

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
    if (action.selectIndex == -1) {
      return [...state.files, action.payload];
    }
    // else dig through filetree until selected folder is found
    else {
      return updateFolderContent(
        state.files,
        action.selectIndex!,
        action.payload
      );
    }
  }

  function save_file(state: State, action: Action): any {
    const updatedFiles = state.files.map((item: FileTreeObject) => {
      if (item.type === "file" && item.id === action.payload?.index) {
        // Ensure edges are properly merged and saved
        const currentEdges = item.edges || [];
        const newEdges = action.payload.edges || [];

        // Merge edges, ensuring no duplicates and maintaining both source and target info
        const mergedEdges = [
          ...currentEdges,
          ...newEdges.filter(
            (newEdge: any) =>
              !currentEdges.some(
                (existingEdge) =>
                  existingEdge.source === newEdge.source &&
                  existingEdge.target === newEdge.target
              )
          ),
        ];

        // Create a deep copy of contents to preserve custom node attributes
        const deepCopyContents = JSON.parse(JSON.stringify(action.payload.contents || item.contents));

        return {
          ...item,
          contents: deepCopyContents, // Use deep copy to preserve all node attributes
          edges: mergedEdges,
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
    const itemIndex: number = action.payload?.id;
    // Set the ID of the editor
    const editorIndex = action.payload?.editorIndex?.[0];
    // Used to reset the editor if the file being edited is deleted
    const setEditorIndex = action.payload?.setEditor;
    // Used to reset the FileLocation widget if the file being edited is deleted
    const setFileLocation = action.payload?.setSelectFileLocation;

    // Helper function that resets editor if deleted
    const checkEditor = (folders: FileTreeObject[]) => {
      folders.forEach((item: FileTreeObject) => {
        if (item.type === "file" && item.id === editorIndex[0]) {
          // Reset editor if the file being edited is inside a folder marked for deletion
          setEditorIndex([-1, "", ""]);
          setFileLocation([""]);
        } else if (item.type === "folder") {
          checkEditor(item.contents as FileTreeObject[]);
        }
      });
    };

    // Helper function to check if a folder contains the file being edited
    function checkFolderContents(item: FileTreeObject): boolean {
      if (item.type === "file") {
        return item.id === editorIndex;
      } else if (item.type === "folder") {
        const contents = item.contents as FileTreeObject[];
        return contents.some((child) => checkFolderContents(child));
      }
      return false;
    }

    try {
      // First check if the item being deleted is the file being edited
      if (editorIndex === itemIndex) {
        setEditorIndex([-1, "", ""]);
        setFileLocation([""]);
      }
      // Then check if it's a folder containing the edited file
      else if (Array.isArray(state.files)) {
        const itemToDelete = state.files.find((item) => item.id === itemIndex);
        if (itemToDelete && itemToDelete.type === "folder") {
          if (checkFolderContents(itemToDelete)) {
            setEditorIndex([-1, "", ""]);
            setFileLocation([""]);
          }
        }
      }

      // Helper function to recursively filter out files/folders
      const filterItems = (items: FileTreeObject[]): FileTreeObject[] => {
        return items
          .map((item: FileTreeObject) => {
            if (item.type === "folder") {
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
            return item.id !== action.payload?.id;
          });
      };

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

  /** This reindexes the file tree files and folders. This is the most important function. */
  function sort_index(state: State, action: Action): State {
    // Initialize count with the action count or 0
    action.count = action.count ?? 0;
    action.fileFound = false;

    /** This alphabetizes the filetrees in their folder before reindexing begins */
    const alphabetizeFiles = (files: FileTreeObject[]): FileTreeObject[] => {
      /** create sorted list of items in current directory */
      const sorted_dir = (files: FileTreeObject[]) =>
        files
          .filter((file): file is FileTreeObject => {
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
      selectedIndex: number
    ): string[] {
      let fileFound = false;
      let filePath: string[] = [];
      /** loop through filetree and create an array of folders (this can be reduced later) */
      const mapFileTree = (objects: FileTreeObject[]): string[] => {
        function mapFolders(objects: FileTreeObject[]): string[] {
          objects.forEach((obj: FileTreeObject): any => {
            if (!fileFound) {
              if (obj.type === "file") {
                if (obj.id === selectedIndex && !fileFound) {
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
      // This sets the context for the sort function
      const editorIndex = action.payload?.editorIndex;
      const setEditorIndex = action.payload?.setEditorIndex!;
      const selectIndex = action.payload?.selectIndex;
      const setSelectIndex = action.payload?.setSelectIndex!;
      const setFileLocation = action.payload?.setSelectFileLocation!;

      // map through the tree using recursion on folders. Returns indexed filetree
      const fileMap: FileTreeObject[] = files.map((item: FileTreeObject) => {
        if (item.type === "file") {
          // Increment count for files
          action.count! += 1;
          const currentCount = action.count!;

          // Update editor
          if (editorIndex && editorIndex[0] === item.index) {
            setEditorIndex([currentCount, editorIndex[1], editorIndex[2]]);
          }

          // Update filetree selection
          if (selectIndex && selectIndex[0] === item.index) {
            setSelectIndex([currentCount, selectIndex[1], selectIndex[2]]);
          }

          /** Update file with new ID */
          return {
            ...item,
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
      if (editorIndex && editorIndex[0] !== -1) {
        setFileLocation(getFilePath(fileMap, editorIndex[0]));
      }

      return fileMap;
    }

    try {
      // Return alphabetized files with sorted indexes
      const sortedFiles = sortFiles(alphabetizeFiles(state.files), action);
      return { files: sortedFiles };
    } catch (error) {
      console.error("Error in sort_index:", error);
      return state;
    }
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
      const processedEdges = new Set<string>();

      try {
        data.forEach((item: FileTreeObject) => {
          if (item.type === "file" && item.id != undefined) {
            const nodeId = item.id?.toString() || Date.now().toString();
            nodes.push({
              id: nodeId,
              label: item.name!,
              x: Math.random() * 10 - 5,
              y: Math.random() * 10 - 5,
              z: Math.random() * 10 - 5,
            });

            // Process edges
            if (item.edges && Array.isArray(item.edges)) {
              item.edges.forEach((edge) => {
                const edgeKey = `${edge.source}-${edge.target}`;
                const reverseEdgeKey = `${edge.target}-${edge.source}`;

                // Only add edge if we haven't processed it or its reverse
                if (
                  !processedEdges.has(edgeKey) &&
                  !processedEdges.has(reverseEdgeKey)
                ) {
                  edges.push({
                    source: edge.source.toString(),
                    target: edge.target.toString(),
                  });
                  processedEdges.add(edgeKey);
                }
              });
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

  function insert_edge() {
    const newState = {
      nodes: {
        nodes: [...state.nodes.nodes],
        edges: [...state.nodes.edges, action.payload],
      },
    };

    return newState;
  }

  switch (action.type) {
    case "get_nodes":
      const newNodes = get_nodes(action.payload);
      return {
        nodes: newNodes,
      };

    case "insert_node":
      return {
        nodes: {
          nodes: [...state.nodes.nodes, action.payload],
          edges: [...state.nodes.edges],
        },
      };

    case "insert_edge":
      return insert_edge();
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
  const [graphState, graphDispatch] = useReducer(knowledgeGraphReducer, {
    nodes: { nodes: [], edges: [] },
  });
  /** This stores the state of the file tree selection */
  const [selectedIndex, setSelectedIndex] = useState<[number, string]>([
    -1,
    "",
  ]);

  /** This stores the state of the editors most recently saved file (This is used to change which file to edit) */
  const [selectedEditIndex, setSelectedEditIndex] =
    useState<SelectedEditIndexType>({ index: -1, contents: {}, name: "" });
  /** This stores the toggle state of the Rename Dialog */
  const [renameIsOpen, setRenameIsOpen] = useState<boolean>(false);
  /** This stores the toggle state of the Create Dialog */
  const [newIsOpen, setNewIsOpen] = useState<boolean>(false);
  /** This stores the toggle state of the Delete Dialog */
  const [deleteIsOpen, setDeleteIsOpen] = useState<boolean>(false);
  /** This stores the toggle state of the reducer's index sort (This is ran after every time the file tree is edited) */
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
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      EdgeNode,
      AutoLinkNode,
    ],
    onerror: (error: any) => console.error(error),
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
      const parsedData = JSON.parse(result);

      // Ensure each file has proper content structure
      const processedData = parsedData.map((file: FileTreeObject) => {
        if (
          file.type === "file" &&
          (!file.contents || Object.keys(file.contents).length === 0)
        ) {
          return {
            ...file,
            contents: fileContents, // Use the default Lexical structure
          };
        }
        return file;
      });

      dispatch({
        type: "get_files",
        selectIndex: 0,
        payload: processedData,
      });
    } else {
      console.error("Error fetching data");
    }
  };

  const saveFile = useCallback(async () => {
    try {
      if (selectedEditIndex.index === -1) return;

      await dispatch({
        type: "save_file",
        payload: {
          index: selectedEditIndex.index,
          contents: selectedEditIndex.contents,
        },
      });

      setNotifyContent(["success", "Save success!"]);
    } catch (error) {
      setNotifyContent(["error", "Save failed"]);
    } finally {
      setNotifyToggle(true);
    }
  }, [selectedEditIndex, dispatch, setNotifyContent, setNotifyToggle]);

  // Ensure each file has proper content structure
  useEffect(() => {
    // grab data from database if user is logged in
    if (user) {
      getData().catch((e) => console.error("Error fetching data:", e));
    } else {
      // Create initial file with proper structure
      const initialFile = {
        index: 0,
        id: Date.now(), // Ensure unique ID
        type: "file",
        name: "New File.md",
        contents: fileContents,
        edges: [],
      };

      // Update file tree
      dispatch({
        type: "get_files",
        selectIndex: 0,
        payload: [initialFile],
      });

      // Update knowledge graph
      graphDispatch({
        type: "get_nodes",
        payload: [initialFile],
      });
    }

    // Initial sort
    setIndexSort(true);
  }, [user]);

  // triggers on indexSort toggle change
  useEffect(() => {
    if (indexSort == true) {
      // Tells the reducer function that the file tree needs to be resorted
      dispatch({
        type: "sort_index",
        payload: {
          editorIndex: selectedEditIndex,
          setEditorIndex: setSelectedEditIndex,
          selectIndex: selectedIndex,
          setSelectIndex: setSelectedIndex,
          selectFileLocation: fileLocation,
          setSelectFileLocation: setFileLocation,
        },
      });

      // reset toggle to off
      setIndexSort(false);
    }
  }, [indexSort]);

  // Updated the graph when new changes are made
  useEffect(() => {
    if (state.files.length > 0) {
      graphDispatch({
        type: "get_nodes",
        payload: state.files,
      });
    }
  }, [state.files]);

  return (
    <FileTreeContext.Provider value={{ state, dispatch }}>
      <selectedIndexContext.Provider
        value={{ selectedIndex, setSelectedIndex }}
      >
        <SelectedEditIndexContext.Provider
          value={{ selectedEditIndex, setSelectedEditIndex }}
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
                            <SaveContext.Provider value={{ saveFile }}>
                              {children}
                            </SaveContext.Provider>
                          </LexicalComposer>
                        </FileLocationContext.Provider>
                      </KnowledgeGraphContext.Provider>
                    </NotificationContentContext.Provider>
                  </NotificationToggleContext.Provider>
                </IndexSortContext.Provider>
              </DeleteToggleContext.Provider>
            </NewItemToggleContext.Provider>
          </RenameToggleContext.Provider>
        </SelectedEditIndexContext.Provider>
      </selectedIndexContext.Provider>
    </FileTreeContext.Provider>
  );
};

/** This lets other child components edit and change file tree state */
export function useFileTreeContext() {
  const context = useContext(FileTreeContext);
  if (context === undefined) {
    throw new Error(
      "useFileTreeContext must be used within a FileTreeContextProvider"
    );
  }
  return context;
}

/** This lets other child components change the file tree selection */
export function useSelectedIndexContext() {
  const context = useContext(selectedIndexContext);
  if (context === undefined) {
    throw new Error(
      "useSelectedIndexContext must be used within a selectedIndexContextProvider"
    );
  }
  return context;
}

/** This lets other child components change the editor selection */
export function useSelectedEditContext() {
  const context = useContext(SelectedEditIndexContext);
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
  const { selectedIndex } = useSelectedIndexContext();
  const { state } = useFileTreeContext();

  const handleAddFile = useCallback(
    (fileData: Partial<FileTreeObject>) => {
      // Unique identifier to link graph nodes and file tree files together
      const newId = Date.now();
      const selectedFolderIndex = selectedIndex[0] || -1;

      // Create a complete FileTreeObject
      const completeFileData: FileTreeObject = {
        index: 0,
        id: newId,
        type: fileData.type || "file",
        name: fileData.name || "New File.md",
        contents:
          fileData.type === "file"
            ? fileData.contents || "" // Provide default empty string if undefined
            : [], // Empty array for non-file types
        edges: fileData.edges || [],
      };

      // File Tree Operation
      const fileAction: Action = {
        type: "insert_file",
        selectIndex: selectedFolderIndex,
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
    [fileDispatch, graphDispatch, selectedIndex]
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
      // Retrieve the current file tree
      const currentFiles = state.files; // Assuming you have access to state here

      // Find the source and target files
      const findFile = (
        files: FileTreeObject[],
        id: string
      ): FileTreeObject | null => {
        for (const file of files) {
          if (file.type === "file" && file.id.toString() === id) {
            return file;
          }
          if (file.type === "folder" && Array.isArray(file.contents)) {
            const foundInFolder = findFile(file.contents, id);
            if (foundInFolder) return foundInFolder;
          }
        }
        return null;
      };

      const sourceFile = findFile(currentFiles, source);
      const targetFile = findFile(currentFiles, target);

      if (!sourceFile || !targetFile) {
        console.error("Source or target file not found");
        return;
      }

      // Prepare edges, ensuring no duplicates
      const newEdge = { source, target };
      const updateEdges = (file: FileTreeObject) => {
        const currentEdges = file.edges || [];
        const edgeExists = currentEdges.some(
          (edge) =>
            (edge.source === source && edge.target === target) ||
            (edge.source === target && edge.target === source)
        );

        if (!edgeExists) {
          currentEdges.push(newEdge);
        }

        return currentEdges;
      };

      // Update source note's edges
      const updatedSourceEdges = updateEdges(sourceFile);
      sourceFile.edges = updatedSourceEdges;

      // Update target note's edges
      const updatedTargetEdges = updateEdges(targetFile);
      targetFile.edges = updatedTargetEdges;

      // Dispatch save actions for both files
      console.log("Adding edge:", {
        sourceId: source,
        targetId: target,
        sourceFile: sourceFile,
        targetFile: targetFile,
      });

      // Dispatch save actions
      fileDispatch({
        type: "save_file",
        payload: {
          index: parseInt(source),
          edges: updatedSourceEdges,
          contents: sourceFile.contents,
        },
      });

      fileDispatch({
        type: "save_file",
        payload: {
          index: parseInt(target),
          edges: updatedTargetEdges,
          contents: targetFile.contents,
        },
      });
    },
    [fileDispatch, graphDispatch, state.files]
  );

  return { handleAddFile, handleDeleteFile, handleAddEdge };
}

export function useSaveContext() {
  const context = useContext(SaveContext);
  if (context === undefined) {
    throw new Error("useSaveContext must be used within a SaveContextProvider");
  }
  return context;
}

export default UIProvider;
