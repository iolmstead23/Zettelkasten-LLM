"use client";

import { Suspense } from "react";
import FileTreeSidebar from "@/components/ui/FileTree/FileTreeSidebar";
import {
  useDeleteToggleContext,
  useNewItemToggleContext,
  useNotifyToggleContext,
  useRenameToggleContext,
  useSelectedEditContext,
  useSelectedIndexContext,
} from "@/components/ui/UIProvider";
import RenameFile from "@/components/ui/FileTree/RenameFileDialog";
import NewItem from "@/components/ui/FileTree/NewItemDialog";
import Notification from "@/components/ui/Notification";
import FileInfoDisplay from "@/components/ui//FileInfoDisplay";
import EditorFileOptions from "@/components/ui/EditorFileOptions";
import DeleteItem from "@/components/ui/FileTree/DeleteConfirmDialog";
import EditorComponent from "@/components/editor/EditorComponent";
import Link from "next/link";

const coverScreen = () => {
  return (
    <div className="w-full h-[80vh] flex items-left border border-gray-200 rounded-lg bg-white">
      <p className="p-10 leading-loose">
        Welcome to your new Zettelkasten System. I am glad you are here. <br />
        To begin select a note labeled with .md by clicking on it. <br />
        Then click on the Menu dropdown marked with a down arrow and select Edit
        <br />
        <br />
        File Options will appear on the top of the editor.
        <br />
        Make sure to save all of your work.{" "}
        <span className="text-lg font-bold:">
          !! Linked Edges won't work unless they are saved first!!
        </span>
        <br />
        You can create new files and also create folders to store your notes
        <br />
        <br />
        Please enjoy!
        <br />
        <br />
        Developed by Ian Olmstead.{" "}
        <Link
          href="https://github.com/iolmstead23/Zettelkasten-LLM"
          className="font-bold text-lg text-purple-600"
        >
          Link to my project repo
        </Link>
      </p>
    </div>
  );
};

/** This is the main Dashboard component */
export default function Dashboard() {
  /** This lets us turn the rename dialog on and off */
  const renameToggle = useRenameToggleContext();
  /** This lets us turn the delete dialog on and off */
  const deleteToggle = useDeleteToggleContext();
  /** This lets us turn the new item dialog on and off */
  const newItemToggle = useNewItemToggleContext();
  /** This keeps track of which item is selected on the file tree */
  const selectedInfo = useSelectedIndexContext();
  /** This allows us to trigger a notification */
  const notifyToggle = useNotifyToggleContext();

  const { selectedEditIndex } = useSelectedEditContext();
  const selectedIndex = selectedEditIndex?.index;

  return (
    <main className="xl:pl-72 max-h-full">
      {renameToggle.renameIsOpen === true && (
        <div>
          <RenameFile
            id={selectedInfo.selectedIndex[0] as number}
            name={selectedInfo.selectedIndex[1] as string}
          />
        </div>
      )}
      {newItemToggle.newIsOpen === true && (
        <div>
          <NewItem />
        </div>
      )}
      {deleteToggle.deleteIsOpen === true && (
        <div>
          <DeleteItem id={selectedInfo.selectedIndex[0] as number} />
        </div>
      )}
      {notifyToggle.notifyToggle == true && (
        <div>
          <Notification />
        </div>
      )}
      <div className="px-4 py-10 sm:px-6 lg:px-8 lg:py-6">
        {/* Main area */}
        <div className="lg:pl-20">
          {selectedIndex != -1 ? (
            <Suspense fallback={<p className="text-center">Loading...</p>}>
              <div className="my-2">
                <div className="relative items-center flex">
                  <EditorFileOptions />
                </div>
              </div>
              <div className="pt-5">
                <div className="border-2 border-slate-300 rounded-md overflow-y-auto">
                  <div className="h-[69vh] overflow-hidden hover:overflow-y-scroll shadow-md sticky">
                    <EditorComponent />
                  </div>
                </div>
                <div className="relative pt-5">
                  <FileInfoDisplay />
                </div>
              </div>
            </Suspense>
          ) : (
            coverScreen()
          )}
          <aside
            className="absolute w-72 bottom-0 left-20 top-16 hidden overflow-y-auto border-r border-gray-200 px-4 py-6 sm:px-6 lg:px-8 xl:block"
            onContextMenu={(e) => {
              // prevent the default behavior when right clicked
              e.preventDefault();
            }}
          >
            <FileTreeSidebar />
          </aside>
        </div>
      </div>
    </main>
  );
}
