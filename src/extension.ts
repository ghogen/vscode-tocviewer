'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { TocExplorer } from './tocExplorer.textDocumentContentProvider'



// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    let alreadyOpenedFirstMarkdown = false;

    let markdown_preview_command_id = "";

    let close_other_editor_command_id = "";

    close_other_editor_command_id = "workbench.action.closeEditorsInOtherGroups";

    markdown_preview_command_id = "markdown.showPreview";

    function openMarkdownPreview() {

        vscode.commands.executeCommand(close_other_editor_command_id)
    
        .then(() => vscode.commands.executeCommand(markdown_preview_command_id))
    
        .then(() => {}, (e) => console.error(e));
    
    }

    function previewFirstMarkdown() {

        if (alreadyOpenedFirstMarkdown) {

	        return;

	    }

        let editor = vscode.window.activeTextEditor;

        if (editor) {

            let doc = editor.document;

            if (doc && doc.languageId === "markdown") {

                openMarkdownPreview();

                alreadyOpenedFirstMarkdown = true;

            }

        }
    }





 

	new TocExplorer(context);

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "tocviewer" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.tocViewer', () => {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        vscode.window.showInformationMessage('TOC Viewer activated.');
    });

    if (vscode.window.activeTextEditor) {

        previewFirstMarkdown();

    } else {

        vscode.window.onDidChangeActiveTextEditor(()=>{

            previewFirstMarkdown();

        });

    }

    context.subscriptions.push(disposable);
}




// this method is called when your extension is deactivated
export function deactivate() {
}