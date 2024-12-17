import { EditorState } from "lexical";

declare module "@/types" {
  export interface Node {
    id: string;
    label: string;
    x?: number;
    y?: number;
    z?: number;
  }

  export interface Edge {
    source: string;
    target: string;
  }

  export interface GraphData {
    edges: Edge[];
    nodes: Node[];
  }

  export interface GraphState {
    data: [
      {
        type: string;
        mode: string;
        hoverinfo: string;
        line: {
          color: string;
          width: number;
        };
        x: number[];
        y: number[];
        z: number[];
      },
      {
        type: string;
        mode: string;
        hoverinfo: string;
        marker: {
          color: number[];
          line: {
            color: string;
            width: number;
          };
          size: number;
          symbol: string;
        };
        text: string[];
        x: number[];
        y: number[];
        z: number[];
      }
    ];
    layout: {
      height: number;
      width: number;
      hovermode: string;
      margin: {
        t: number;
      };
      scene: {
        xaxis: any;
        yaxis: any;
        zaxis: any;
      };
      showlegend: boolean;
      title: {
        text: string;
      };
    };
  }

  export interface Action {
    type:
      | "get_files"
      | "insert_file"
      | "rename_file"
      | "delete_file"
      | "sort_index"
      | "save_file";
    selectIndex?: number;
    payload?: any;
    count?: number;
    fileFound?: boolean;
  }

  export interface KnowledgeGraphAction {
    type:
      | "get_nodes"
      | "get_edges"
      | "insert_node"
      | "insert_edge"
      | "delete_node"
      | "delete_edge"
      | "save_graph";
    payload?: any;
  }

  export interface State {
    files: FileTreeObject[];
  }

  export interface KnowledgeGraphState {
    nodes: GraphData;
    dispatch?: React.Dispatch<KnowledgeGraphAction>;
  }

  export interface FileTreeObject {
    id: number;
    index: number;
    type: string;
    name: string;
    edges?: Edge[];
    contents: FileTreeObject[] | string;
  }

  export interface FileTreeState {
    state: State;
    dispatch: React.Dispatch<Action>;
  }

  export interface SelectedIndexState {
    selectedIndex: [number, string];
    setSelectedIndex: (e: [number, string]) => void;
  }

  export interface SelectedEditIndexType {
    index: number;
    contents: any;
    name: string;
  }

  export interface SelectedEditIndexContextType {
    selectedEditIndex: SelectedEditIndexType;
    setSelectedEditIndex: Dispatch<SetStateAction<SelectedEditIndexType>>;
  }

  export interface RenameToggleState {
    renameIsOpen: boolean;
    setRenameIsOpen: (e: boolean) => void;
  }

  export interface NewItemToggleState {
    newIsOpen: boolean;
    setNewIsOpen: (e: boolean) => void;
  }

  export interface DeleteToggleState {
    deleteIsOpen: boolean;
    setDeleteIsOpen: (e: boolean) => void;
  }

  export interface IndexSortState {
    indexSort: boolean;
    setIndexSort: (e: boolean) => void;
  }

  export interface NotificationToggleState {
    notifyToggle: boolean;
    setNotifyToggle: (e: boolean) => void;
  }

  export interface NotificationContentState {
    notifyContent: [string, string];
    setNotifyContent: (e: [string, string]) => void;
  }

  export interface FileLocationState {
    fileLocation: string[];
    setFileLocation: (e: string[]) => void;
  }

  export interface SerializedEdgeNode extends SerializedTextNode {
    type: "edge";
    id: string;
    text: string;
  }
}
