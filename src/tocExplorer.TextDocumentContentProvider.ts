import { ExtensionContext, EventEmitter, TreeItem, Event, window, TreeItemCollapsibleState, Uri, commands, workspace, TextDocumentContentProvider, CancellationToken, ProviderResult, TreeView } from 'vscode';
import * as vscode from 'vscode';
import { TreeDataProvider } from 'vscode';

interface IEntry {
	name: string;
	type: string;
}

export interface TocNode {

    tocTitle: string;
    resource: vscode.Uri;
	isParent: boolean;
}

export class TocModel {

	private nodes: Map<string, TocNode> = new Map<string, TocNode>();

	constructor(readonly tocFile: vscode.Uri) {
        // Load the toc file from the specified path
        // parse it into a tree data structure
	}

	public connect(): Thenable<TocModel> {
		return new Promise((c, e) => {
            // Using the given tocFile
            // Try to open it
            // If it fails, error out
            // If it succeeds, load it.
            //Not sure what the template parameter should be here.
		});
	}

	public get roots(): Thenable<TocNode[]> {
		return this.connect().then(toc => {
			return new Promise((c, e) => {
                // generate the list of the root nodes at the top level
                // Open the file specified by "uri"
			});
		});
	}

	public getChildren(node: TocNode): Thenable<TocNode[]> {
		return this.connect().then(toc => {
			return new Promise((c, e) => {
				// given the node get its children
			});
		});
	}

	public getContent(resource: Uri): Thenable<string> {
		return this.connect().then(toc => {
			return new Promise((c, e) => {
				// Get the content for this node
			});
		});
	}
}

export class TocTreeDataProvider implements TreeDataProvider<TocNode>, TextDocumentContentProvider {

	private _onDidChangeTreeData: EventEmitter<any> = new EventEmitter<any>();
	readonly onDidChangeTreeData: Event<any> = this._onDidChangeTreeData.event;

	constructor(private readonly model: TocModel) { }

	public refresh(): any {
		this._onDidChangeTreeData.fire();
	}


	public getTreeItem(element: TocNode): TreeItem {
		return {
			resourceUri: element.resource,
			collapsibleState: element.isParent ? TreeItemCollapsibleState.Collapsed : void 0,
			command: element.isParent ? void 0 : {
				command: 'tocExplorer.openTocResource', // TODO: need to create this command
				arguments: [element.resource],
				title: 'Open TOC Resource'
			}
		};
	}

	public getChildren(element?: TocNode): TocNode[] | Thenable<TocNode[]> {
		return element ? this.model.getChildren(element) : this.model.roots;
	}

	public getParent(element: TocNode): TocNode {
        // TODO get parent node
	}

	public provideTextDocumentContent(uri: Uri, token: CancellationToken): ProviderResult<string> {
		return this.model.getContent(uri).then(content => content);
	}
}

export class TocExplorer {

	private tocViewer: TreeView<TocNode>;

	constructor(context: vscode.ExtensionContext) {
		const tocModel = new TocModel(uri); // TODO: how do we get this URI
		const treeDataProvider = new TocTreeDataProvider(tocModel);
		context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider('toc', treeDataProvider));

		this.tocViewer = vscode.window.createTreeView('tocExplorer', { treeDataProvider });

		vscode.commands.registerCommand('tocExplorer.refresh', () => treeDataProvider.refresh());
		vscode.commands.registerCommand('tocExplorer.openResource', resource => this.openResource(resource));
		vscode.commands.registerCommand('tocExplorer.revealResource', () => this.reveal());
	}

	private openResource(resource: vscode.Uri): void {
		vscode.window.showTextDocument(resource);
	}

	private reveal(): Thenable<void> {
		const node = this.getNode();
		if (node) {
			return this.tocViewer.reveal(node);
		}
		return null;
	}

	private getNode(): TocNode {
		if (vscode.window.activeTextEditor) {
			if (vscode.window.activeTextEditor.document.uri.scheme === 'toc') {
				return { tocTitle: "TODO get toc title", resource: vscode.window.activeTextEditor.document.uri, isParent: false };
			}
		}
		return null;
	}
}