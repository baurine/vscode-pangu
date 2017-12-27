// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const pangu = require('pangu');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "vscode-pangu" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.addSpace', function () {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        // vscode.window.showInformationMessage('Hello World!');

        const editor = vscode.window.activeTextEditor
        if (!editor) {
            return  // No open text editor
        }

        const document = editor.document
        const selection = editor.selection
        const selectedText = document.getText(selection)

        // just spacing selected text if has
        if (selectedText) {
            const panguText = pangu.spacing(selectedText)
            editor.edit(builder => {
                builder.replace(selection, panguText)
            })
            return
        }

        const lineCount = document.lineCount

        // spacing all text
        // solution 1 - editor.edit()
        editor.edit(builder => {
            for (let i=0; i<lineCount; i++) {
                const textLine = document.lineAt(i)
                const oriTrimText = textLine.text.trimRight()

                if (oriTrimText.length === 0) {
                    builder.replace(textLine.range, '')
                } else {
                    const panguText = pangu.spacing(oriTrimText)
                    builder.replace(textLine.range, panguText)
                }
            }
        })

        // solution 2 - vscode.workspace.applyEdit(vscode.WorkspaceEdit)
        // let textEdits = []
        // for (let i=0; i<lineCount; i++) {
        //     const textLine = document.lineAt(i)
        //     const oriTrimText = textLine.text.trimRight()

        //     if (oriTrimText.length === 0) {
        //         textEdits.push(new vscode.TextEdit(textLine.range, ''))
        //     } else {
        //         const panguText = pangu.spacing(oriTrimText)
        //         textEdits.push(new vscode.TextEdit(textLine.range, panguText))
        //     }
        // }
        // let workspaceEdit = new vscode.WorkspaceEdit()
        // workspaceEdit.set(document.uri, textEdits)
        // vscode.workspace.applyEdit(workspaceEdit)
    });

    context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;