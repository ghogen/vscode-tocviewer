import { /*ExtensionContext,*/ EventEmitter, TreeItem, Event, /*window,*/ TreeItemCollapsibleState, Uri,/* commands, workspace,*/ TextDocumentContentProvider, CancellationToken, ProviderResult, TreeView } from 'vscode';
import * as vscode from 'vscode';
import fs = require('fs');
import { TreeDataProvider } from 'vscode';

export class TocNode {

    tocTitle: string;
    resource: vscode.Uri | undefined;
    isParent: boolean;
    children: Array<TocNode> | undefined;
    parentNode: TocNode | undefined;
    nextSibling: TocNode | undefined;

    constructor(title?: string, uri? : vscode.Uri) {
        this.tocTitle = title ? title : "";
        this.resource = uri;
        this.isParent = false;
        this.children = undefined;
        this.parentNode = undefined;
        this.nextSibling = undefined;
    }
}

export class TocModel {

    // nodes contains a map from the referenced unique file path to TOC node.
    private nodes: Map<string, TocNode> = new Map<string, TocNode>();
    private rootNode: TocNode;
    private openedToc : Boolean;

	constructor(readonly tocFile?: vscode.Uri) {
        // Create the root node
        this.rootNode = new TocNode();
        this.nodes.set("", this.rootNode);
        this.openedToc = false;

        if (tocFile)
        {
            this.openToc(tocFile);
            this.openedToc = true;
        }
    }
   
    public openToc(tocFile: vscode.Uri) : TocModel
    {
        // Only run once.
        if (this.openedToc) {
            return this;
        }
        // Load the toc file from the specified path
        var buf = fs.readFileSync(tocFile.fsPath);

        // parse it into a tree data structure
        var lines = buf.toString().split("\n");
        var lineNumber = 0;
        var nestingLevel = 0;
        var currentNode : TocNode = this.rootNode;

        do
        {
            // skip blank lines
            if (lines[lineNumber] === "") {
                continue;
            }

            var hashCount = 0;
            while (lines[lineNumber].charAt(hashCount) === '#') {
                hashCount++;
            }

            if (hashCount === 0)
            {
                continue;
            }

            // Check if this will be the root node
            if (nestingLevel === 0)
            {
                if (hashCount !== 1)
                {
                    // error: single node must be at the top.
                }
                else {
                    // Initialize the node, with the old (empty) rootNode as the parent
                    var newNode : TocNode = this.makeSingleNode(lines[lineNumber].substr(hashCount), this.rootNode);
                    currentNode = newNode;
                }
            }
            else {
                if (nestingLevel === hashCount - 1)
                {
                    // Add the first child node
                    newNode = this.makeSingleNode(lines[lineNumber].substr(hashCount), currentNode);
                    currentNode = newNode;

                }
                else if (nestingLevel === hashCount)
                {
                    // Add a sibling node
                    newNode = this.makeSingleNode(lines[lineNumber].substr(hashCount), currentNode.parentNode);
                    currentNode = newNode;
                }
                else if (nestingLevel === hashCount + 1)
                {
                    // Pop up a level and add a sibling node to the parent node
                    newNode = this.makeSingleNode(lines[lineNumber].substr(hashCount), currentNode.parentNode ? currentNode.parentNode.parentNode : undefined);
                    currentNode = newNode;
                }
                else if (nestingLevel === hashCount + 2)
                {
                    // Pop up a level and add a sibling node to the parent node
                    newNode = this.makeSingleNode(lines[lineNumber].substr(hashCount), currentNode.parentNode ? currentNode.parentNode.parentNode ? currentNode.parentNode.parentNode.parentNode : undefined : undefined);
                    currentNode = newNode;
                }
                else if (nestingLevel === hashCount + 3)
                {
                    // Pop up a level and add a sibling node to the parent node - terrible hack, sorry everyone, need to do a recursive version.
                    newNode = this.makeSingleNode(lines[lineNumber].substr(hashCount), currentNode.parentNode ? currentNode.parentNode.parentNode ? currentNode.parentNode.parentNode.parentNode ? currentNode.parentNode.parentNode.parentNode.parentNode : undefined : undefined : undefined);
                    currentNode = newNode;
                }
                else {
                    vscode.window.showErrorMessage("Unsupported level of nesting in TOC.")
                }
            }
            nestingLevel = hashCount;
            
        } while (++lineNumber < lines.length);
        return this;
    }
    
    private makeSingleNode(textLine: string, parent? : TocNode) : TocNode {
        // parse the string as a bare title (a parent without a link)
        // or as a reference to a topic
        // Find first bracket. If not found, assume bare title.
        var newNode : TocNode;
        let firstBracket = textLine.indexOf("[");
        if (firstBracket === -1) {
            // Not found [], must be a regular node, without a link.
            newNode = new TocNode(textLine);

        }
        else {
            // Parse a Markdown link
            // TODO: get basePath from somewhere.
            var basePath = "C:/Users/ghogen/azure-docs/articles/dev-spaces/";
            var closingBracket = textLine.indexOf("]");
            var titleString : string = textLine.substr(firstBracket + 1, closingBracket - 2);
            textLine = textLine.substr(closingBracket + 1); // get remaining part of the string
            var firstParen = textLine.indexOf("(");
            var closingParen = textLine.indexOf(")");
            var linkText : string = textLine.substr(firstParen + 1, closingParen - 1);
            linkText = basePath + linkText;
            newNode = new TocNode(titleString, vscode.Uri.file(linkText));
            this.nodes.set(linkText, newNode);
        }
        if (parent) {
            if (parent.children) {
                // Add the new node to the children list of the parent node.
                parent.children.push(newNode);
            }
            else {
                // Create a parent node array and add the new node.
                parent.children = new Array<TocNode>();
                parent.children.push(newNode);
                parent.isParent = true;
            }
            // Set the parentNode of the current node to the parent
            newNode.parentNode = parent;
        }
        return newNode;
    }

	public connect(tocUri : vscode.Uri): Thenable<TocModel> {
		return new Promise((tocModel, e) => {
            // Using the given tocFile
            // Try to open it
            // If it fails, error out
            // If it succeeds, load it.
            //Not sure what the template parameter should be here.
            if (this.openToc(tocUri)) {
                tocModel(this);
            }
            else {
                e("Failed to open TOC at path " + tocUri.fsPath);
            }
		});
	}

	public get roots(): Thenable<TocNode[]> {
        if (this.tocFile) {
            return this.connect(this.tocFile).then(toc => {
                return new Promise((c, e) => {
                    // generate the list of the root nodes at the top level
                    // Open the file specified by "uri"
                    if (toc.rootNode.children) {
                        c(toc.rootNode.children);
                    }
                    else {
                        e("The root node is empty.");
                    }
                });
            });
        } 
        else {
            return new Promise((c, e) => {
                e("No TOC loaded.");
            });
        }
	}

	public getChildren(node: TocNode): Thenable<TocNode[]> {
        return new Promise((tocNodes, e) => {
            // given the node get its children
            if (node.children)
            {
                tocNodes(node.children);
            }
            else {
                e("There are no children for the node " + node.tocTitle);
            }
        });
	}

	public getContent(resource: Uri): Thenable<string> {
        return new Promise((content, e) => {
            // Get the content (markdown file contents) for this node
            fs.readFile(resource.fsPath, (err, data) => {
                if (err) {
                    e(err);
                }
                else {
                    content(data.toString());
                }
            });
        });
    }
    
    public getNode(resource: Uri): TocNode | undefined {
        return this.nodes.get(resource.fsPath);
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
			label: element.tocTitle,
			collapsibleState: element.isParent ? TreeItemCollapsibleState.Collapsed : void 0,
			command: element.isParent ? void 0 : {
				command: 'tocExplorer.openResource', 
				arguments: [element.resource],
				title: 'Open TOC Resource'
			}
		};
	}

	public getChildren(element?: TocNode): TocNode[] | Thenable<TocNode[]> {
		return element ? this.model.getChildren(element) : this.model.roots;
	}

	public getParent(element: TocNode): TocNode | undefined {
            return element.parentNode;
	}

	public provideTextDocumentContent(uri: Uri, token: CancellationToken): ProviderResult<string> {
		return this.model.getContent(uri).then(content => content);
	}
}

export class TocExplorer {

    private tocViewer: TreeView<TocNode>;
    // So in principle we should support separate TOCs
    // private tocModels : TocModel[];
    private tocModel : TocModel;

	constructor(context: vscode.ExtensionContext) {
        process.stdout.write("Test message\n");
		this.tocModel = new TocModel(vscode.Uri.file("C:/Users/ghogen/azure-docs/articles/dev-spaces/toc.md")); 
		const treeDataProvider = new TocTreeDataProvider(this.tocModel);
		context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider('toc', treeDataProvider));

		this.tocViewer = vscode.window.createTreeView('tocExplorer', { treeDataProvider });

		vscode.commands.registerCommand('tocExplorer.refresh', () => treeDataProvider.refresh());
		vscode.commands.registerCommand('tocExplorer.openResource', resource => this.openResource(resource));
		vscode.commands.registerCommand('tocExplorer.revealResource', () => this.reveal());
	}

	private openResource(resource: vscode.Uri): void {
		vscode.window.showTextDocument(resource);
	}

	private reveal(): Thenable<void> | undefined {
		const node = this.getNode();
		if (node) {
			return this.tocViewer.reveal(node);
		}
		return undefined;
	}

	private getNode(): TocNode | undefined {
		if (vscode.window.activeTextEditor) {
            // If this is an open file, we need to get the TOC node info from it.
            // This is a question of finding a TOC when a given file is open.
            // We can get the file system uri for this file
            // and find the TOC.md file associated with it. 
            // and the node within that TOC that corresponds to this topic.
            // I think we have to use the TocModel's map data structure to get this
            var node = this.tocModel.getNode(vscode.window.activeTextEditor.document.uri);
            return node;
            }
		return undefined;
	}
}