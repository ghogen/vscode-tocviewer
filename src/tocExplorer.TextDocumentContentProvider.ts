import { /*ExtensionContext,*/ EventEmitter, TreeItem, Event, /*window,*/ TreeItemCollapsibleState, Uri,/* commands, workspace,*/ TextDocumentContentProvider, CancellationToken, ProviderResult, TreeView } from 'vscode';
import * as vscode from 'vscode';
import fs = require('fs');
import YAML = require("yamljs");
import { TreeDataProvider } from 'vscode';
import { Z_FIXED } from 'zlib';

export class TocNode {

    tocTitle: string;
    resource: vscode.Uri | undefined;
    isParent: boolean;
    children?: Array<TocNode> | undefined;
    parentNode: TocNode | undefined;

    constructor(title?: string, uri? : vscode.Uri) {
        this.tocTitle = title ? title : "";
        this.resource = uri;
        this.isParent = false;
    }
}

export interface TocModel {

    tocFile?: vscode.Uri | undefined;

    connect(tocUri : vscode.Uri): Thenable<TocModel>;

	roots: Thenable<TocNode[]>;

	getChildren(node: TocNode): Thenable<TocNode[]>;

	getContent(resource: Uri): Thenable<string>;
    
    getNode(resource: Uri): TocNode | undefined;
    
}

export class TocModelMd implements TocModel {

    // nodes contains a map from the referenced unique file path to TOC node.
    private nodes: Map<string, TocNode> = new Map<string, TocNode>();
    private rootNode: TocNode;
    private openedRootToc : Boolean;

	constructor(readonly rootTocFile?: vscode.Uri) {
        // Create the root node
        this.rootNode = new TocNode();
        this.nodes.set("", this.rootNode);
        this.openedRootToc = false;

        if (this.rootTocFile)
        {
            this.openToc(this.rootTocFile);
            this.openedRootToc = true;
        }
    }
   
    private openToc(tocFile: vscode.Uri, parentNode? : TocNode) : TocNode
    {
        if (! parentNode) {
            parentNode = this.rootNode;
        }

        // Only run once.
        if (this.openedRootToc) {
            return this.rootNode;
        }
        // Load the toc file from the specified path
        var buf = fs.readFileSync(tocFile.fsPath);

        // parse it into a tree data structure
        var lines = buf.toString().split("\n");
        var lineNumber = 0;
        var nestingLevel = 0;
        var currentNode : TocNode = this.rootNode;
        var topLevelNode : TocNode = this.rootNode;

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
                    var newNode : TocNode = this.makeSingleNode(lines[lineNumber].substr(hashCount), tocFile, parentNode);
                    topLevelNode = newNode;
                    currentNode = newNode;
                }
            }
            else {
                if (nestingLevel === hashCount - 1)
                {
                    // Add the first child node
                    newNode = this.makeSingleNode(lines[lineNumber].substr(hashCount), tocFile, currentNode);
                    currentNode = newNode;

                }
                else if (nestingLevel === hashCount)
                {
                    // Add a sibling node
                    newNode = this.makeSingleNode(lines[lineNumber].substr(hashCount), tocFile, currentNode.parentNode);
                    currentNode = newNode;
                }
                else if (nestingLevel === hashCount + 1)
                {
                    // Pop up a level and add a sibling node to the parent node
                    newNode = this.makeSingleNode(lines[lineNumber].substr(hashCount), tocFile, currentNode.parentNode ? currentNode.parentNode.parentNode : undefined);
                    currentNode = newNode;
                }
                else if (nestingLevel === hashCount + 2)
                {
                    // Pop up a level and add a sibling node to the parent node
                    newNode = this.makeSingleNode(lines[lineNumber].substr(hashCount), tocFile, currentNode.parentNode ? currentNode.parentNode.parentNode ? currentNode.parentNode.parentNode.parentNode : undefined : undefined);
                    currentNode = newNode;
                }
                else if (nestingLevel === hashCount + 3)
                {
                    // Pop up a level and add a sibling node to the parent node - terrible hack, sorry everyone, need to do a recursive version.
                    newNode = this.makeSingleNode(lines[lineNumber].substr(hashCount), tocFile, currentNode.parentNode ? currentNode.parentNode.parentNode ? currentNode.parentNode.parentNode.parentNode ? currentNode.parentNode.parentNode.parentNode.parentNode : undefined : undefined : undefined);
                    currentNode = newNode;
                }
                else if (nestingLevel === hashCount + 4)
                {
                    // Pop up a level and add a sibling node to the parent node - terrible hack, sorry everyone, need to do a recursive version.
                    newNode = this.makeSingleNode(lines[lineNumber].substr(hashCount), tocFile, currentNode.parentNode ? currentNode.parentNode.parentNode ? currentNode.parentNode.parentNode.parentNode ? currentNode.parentNode.parentNode.parentNode.parentNode ? currentNode.parentNode.parentNode.parentNode.parentNode.parentNode : undefined : undefined : undefined : undefined);
                    currentNode = newNode;
                }
                else if (nestingLevel === hashCount + 5)
                {
                    // Pop up a level and add a sibling node to the parent node - terrible hack, sorry everyone, need to do a recursive version.
                    newNode = this.makeSingleNode(lines[lineNumber].substr(hashCount), tocFile, currentNode.parentNode ? currentNode.parentNode.parentNode ? currentNode.parentNode.parentNode.parentNode ? currentNode.parentNode.parentNode.parentNode.parentNode ? currentNode.parentNode.parentNode.parentNode.parentNode.parentNode ? currentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode : undefined : undefined : undefined : undefined : undefined);
                    currentNode = newNode;
                }
                else if (nestingLevel === hashCount + 6)
                {
                    // Pop up a level and add a sibling node to the parent node - terrible hack, sorry everyone, need to do a recursive version.
                    newNode = this.makeSingleNode(lines[lineNumber].substr(hashCount), tocFile, currentNode.parentNode ? currentNode.parentNode.parentNode ? currentNode.parentNode.parentNode.parentNode ? currentNode.parentNode.parentNode.parentNode.parentNode ? currentNode.parentNode.parentNode.parentNode.parentNode.parentNode ? currentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode ? currentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode : undefined : undefined : undefined : undefined : undefined : undefined);
                    currentNode = newNode;
                }
                else if (nestingLevel === hashCount + 7)
                {
                    // Pop up a level and add a sibling node to the parent node - terrible hack, sorry everyone, need to do a recursive version.
                    newNode = this.makeSingleNode(lines[lineNumber].substr(hashCount), tocFile, currentNode.parentNode ? currentNode.parentNode.parentNode ? currentNode.parentNode.parentNode.parentNode ? currentNode.parentNode.parentNode.parentNode.parentNode ? currentNode.parentNode.parentNode.parentNode.parentNode.parentNode ? currentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode ? currentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode ? currentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode : undefined : undefined : undefined : undefined : undefined : undefined : undefined);
                    currentNode = newNode;
                }
                else {
                    // I believe it's the case that the online TOC supports a maximum of 8 levels of nesting.
                    vscode.window.showErrorMessage("Unsupported level of nesting in TOC.");
                }
            }
            nestingLevel = hashCount;
            
        } while (++lineNumber < lines.length);
        return topLevelNode;
    }
    
    private makeSingleNode(textLine: string, tocFile: vscode.Uri, parent? : TocNode) : TocNode {
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
            var basePath = tocFile ? tocFile.fsPath.substring(0, tocFile.fsPath.lastIndexOf("\\") + 1) : ".";
            var closingBracket = textLine.indexOf("]");
            var titleString : string = textLine.substr(firstBracket + 1, closingBracket - 2);
            textLine = textLine.substr(closingBracket + 1); // get remaining part of the string
            var firstParen = textLine.indexOf("(");
            var closingParen = textLine.indexOf(")");
            var linkText : string = textLine.substr(firstParen + 1, closingParen - 1);
            linkText = basePath + linkText;
            newNode = new TocNode(titleString, vscode.Uri.file(linkText));
            this.nodes.set(linkText, newNode);
            if (linkText.toLowerCase().includes("toc.md")) {
                var childTocNode = this.openToc(vscode.Uri.file(linkText), newNode);
            }
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

	public connect(tocUri : vscode.Uri): Thenable<TocModelMd> {
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
        if (this.rootTocFile) {
            return this.connect(this.rootTocFile).then(toc => {
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

class TocItem {

   constructor(readonly name : string, readonly href?: string, readonly expanded?: Boolean, readonly items?: TocItem[]) {}
}


export class TocModelYaml implements TocModel {
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
         }
     }
    
     private recurseNodes(tocyaml : TocItem[], parent: TocNode) : void {
        tocyaml.forEach((item, index) => {
            var uri : vscode.Uri | undefined = undefined;
            // Get URI
            if (item.href) {
                if (this.tocFile)
                {
                    var folder = this.tocFile.fsPath.substring(0, this.tocFile.fsPath.lastIndexOf("\\")+1);
                    var fullPath = folder + item.href;
                    uri = Uri.file(fullPath);
                }
            } 
            // Get TocNode
            var node : TocNode =  new TocNode(item.name, uri);
            node.parentNode = parent;
            node.parentNode.isParent = true;
            // Add to children array
            if (! node.parentNode.children) {
                node.parentNode.children = new Array<TocNode>();
                // workaround an apparent bug.
                while (node.parentNode.children.length > 0) {
                    node.parentNode.children.pop();
                }
            }
            node.parentNode.children.push(node);
            if (uri) {
                this.nodes.set(uri.fsPath, node);
            }
            if (item.items) {
                this.recurseNodes(item.items, node);
            }
        });
    }

     private openToc(tocFile: vscode.Uri) : TocModel
     {
         // Only run once.
         if (this.openedToc) {
             return this;
         }
         // Load the toc file from the specified path
         var buf = fs.readFileSync(tocFile.fsPath);
         var tocyaml : TocItem[] = YAML.load(tocFile.fsPath);
         this.recurseNodes(tocyaml, this.rootNode);
         this.openedToc = true;
         return this;
     }
 
     public connect(tocUri : vscode.Uri): Thenable<TocModelYaml> {
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

    private tocViewerOrUndefined: TreeView<TocNode> | undefined;
    // So in principle we should support separate TOCs
    // private tocModels : TocModel[];
    private tocModelOrUndefined : TocModel | undefined;
    private tocPathOrUndefined : string | undefined;
    private subscription : vscode.Disposable;
    private subscriptionOpenResource : vscode.Disposable | undefined;
    private subscriptionRefresh : vscode.Disposable | undefined;
    private subscriptionRevealResource : vscode.Disposable | undefined;
    //private subscription2 : vscode.Disposable;
    private context : vscode.ExtensionContext;

    public listener(event: vscode.TextEditor | undefined) : any{
        if (event && event.document.languageId === "markdown") {
               this.openToc(event.document);
        }
    }

    private openToc(doc : vscode.TextDocument) {
        var isYamlToc: Boolean = false;

        vscode.window.showInformationMessage("Opening TOC");
        // show TOC for that file
        var fileName : string = doc.fileName;
        // Get the path part 
        var folder : string = fileName.substring(0, fileName.lastIndexOf("\\") + 1);

        // Find a TOC at this path
        if (fs.existsSync(folder + "toc.md")) {
            this.tocPathOrUndefined = folder + "toc.md";  
            isYamlToc = false;
        }

        if (fs.existsSync(folder + "toc.yml")) {
            this.tocPathOrUndefined = folder + "toc.yml";
            isYamlToc = true;
        }

        if (this.tocPathOrUndefined) {
            var tocPath = this.tocPathOrUndefined;
            if (this.tocModelOrUndefined) {
                // Is this TOC already open?
                if (this.tocModelOrUndefined.tocFile && this.tocModelOrUndefined.tocFile.fsPath === tocPath) {
                    // TODO: activate the node for this file
                    var displayThisNode = this.tocModelOrUndefined.getNode(vscode.Uri.file(doc.fileName));
                    if (displayThisNode) {
                        if (this.tocViewerOrUndefined) {
                            this.tocViewerOrUndefined.reveal(displayThisNode);
                        }
                    }
                    return;
                }               
            }
            if (isYamlToc) {
                this.tocModelOrUndefined = new TocModelYaml(vscode.Uri.file(tocPath));
            } else {
                this.tocModelOrUndefined = new TocModelMd(vscode.Uri.file(tocPath));
            }

            var tocModel = this.tocModelOrUndefined;
            const treeDataProvider = new TocTreeDataProvider(tocModel);
            this.context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider('toc', treeDataProvider));

            this.tocViewerOrUndefined = vscode.window.createTreeView('tocExplorer', { treeDataProvider });

            if (this.subscriptionRefresh)
            {
                this.subscriptionRefresh.dispose();
            }
            if (this.subscriptionOpenResource)
            {
                this.subscriptionOpenResource.dispose();
            }
            if (this.subscriptionRevealResource)
            {
                this.subscriptionRevealResource.dispose();
            }
            this.subscriptionRefresh = vscode.commands.registerCommand('tocExplorer.refresh', () => treeDataProvider.refresh());
            this.subscriptionOpenResource = vscode.commands.registerCommand('tocExplorer.openResource', resource => this.openResource(resource));
            this.subscriptionRevealResource = vscode.commands.registerCommand('tocExplorer.revealResource', () => this.reveal());
            this.reveal();
        }
    }

	constructor(context: vscode.ExtensionContext) {
        this.context = context;
        if (vscode.window.activeTextEditor) {
            this.openToc(vscode.window.activeTextEditor.document);
        }
        // start listening
        this.subscription = vscode.window.onDidChangeActiveTextEditor(this.listener, this);
       
	}

	private openResource(resource: vscode.Uri): void {
        vscode.workspace.openTextDocument(resource).then(document => {
            this.openToc(document);
        });

        vscode.commands.executeCommand('markdown.showPreview', resource);
	}

	private reveal(): Thenable<void> | undefined {
		const node = this.getNode();
		if (node) {
            if (this.tocViewerOrUndefined) {
                return this.tocViewerOrUndefined.reveal(node);
            }
		}
		return undefined;
	}

	private getNode(): TocNode | undefined {
		if (vscode.window.activeTextEditor) {
            if (this.tocModelOrUndefined) {
                var node = this.tocModelOrUndefined.getNode(vscode.window.activeTextEditor.document.uri);
                return node;
            }
        }
		return undefined;
    }
    
    private dispose() : void
    {
        this.subscription.dispose();
        if (this.subscriptionOpenResource) {
            this.subscriptionOpenResource.dispose();
        }
        if (this.subscriptionRefresh) {
            this.subscriptionRefresh.dispose();
        }
        if (this.subscriptionRevealResource) {
            this.subscriptionRevealResource.dispose();
        }
    }
}