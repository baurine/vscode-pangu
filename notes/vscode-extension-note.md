# 如何实现一个给中英文间加空格的 VS Code 扩展

介绍实现一个 VS Code 扩展的过程，举一反三，通过这个例子，你也可以很轻松地写出其它类似的扩展。

![](https://raw.githubusercontent.com/baurine/vscode-pangu/master/images/demo-1.gif)

[GitHub 项目地址](https://github.com/baurine/vscode-pangu)

## References

- [Example - Hello World](https://code.visualstudio.com/docs/extensions/example-hello-world)
- [Visual Studio Code Extensions: Editing the Document](http://www.chrisstead.com/archives/1082/visual-studio-code-extensions-editing-the-document/)
- [pangu](https://github.com/vinta/pangu.js)
- [text-autospace.js](https://github.com/zizhengwu/text-autospace.js)
- [vscode-alignment](https://github.com/annsk/vscode-alignment)

## Note

跟很多人一样，有种强迫症，看见中英文间不加空格的排版，就浑身不舒服，非要把它改过来。做笔记的时候经常要修改从网上拷贝来的内容，空格是手动一个个加的，烦了，后来就想，总该有个插件能帮我们做这件事吧，于是 google "vscode 插件 中英文 空格"，没搜到有价值的内容，google "中英文 空格"，找到了 V2EX 上 [中英混排手动挡 --「为什么我就是能这样娴熟地加上空格呢？」](https://www.v2ex.com/t/151607) 这篇文章，继而知道了 [pangu](https://github.com/vinta/pangu.js) 这个项目，这是一个可以给半角和全角字符间自动加空格的 JavaScript 实现，这不正是我想要的吗，但在它的介绍页面上，各种基于它的编辑器插件都有了，唯独缺了我大 VS Code，于是想，不行咱就自己撸一个呗，又不是多难的事，核心实现都有了，不就是调一个方法的事吗？

(后话：要是我一开始就知道搜索 "pangu" 这个关键字，我也就不造这个轮子了，等我写完代码，往 VS Code Marketplace 一上传，再一搜 "vscode-pangu"，结果就发现了一个相同的实现：[halfcrazy/vscode-pangu](https://github.com/halfcrazy/vscode-pangu)，失敬失敬！)

pangu 这个库提供了一个核心方法来转换字符串 (内部的具体实现是通过正则匹配来做的)，如下所示：

    const refinedText = pangu.spacing(originText)

    // 示例
    const refinedText = pangu.spacing("这是一个VS Code扩展")
    // refinedText: "这是一个 VS Code 扩展"

因此插件要做的事情就很简单了，获取当前编辑器内的所有文本，调用此方法，得到加了空格后的文本，替换原来的文本即可。所以关键在于，如何获取编辑器的文本，如何替换。毫无疑问，这些需要 VS Code 的 extension API 来完成。

[VS Code extension API Document](https://code.visualstudio.com/docs/extensionAPI/vscode-api)，这里，我要吐槽一下它的文档，我是第一次见把所有 API 塞在一个页面里的，API 的介绍也过于简洁。

VS Code 自带一个清除多余的行尾空格的命令，按下 `cmd + shift + p`，在弹出的命令窗口中输入 `trim`，选中 `Trim Trailing Whitespace` 并回车执行。

![](https://raw.githubusercontent.com/baurine/vscode-pangu/master/images/vscode-trim.png)

我们想实现的这个插件和这个命令是类似的，按下 `cmd + shift + p`，在弹出的命令窗口中输入类似 `add space` 执行，只不过我们不是要清除多余空格，而是加空格，但本质是一样的，修改编辑器中的文本。

VS Code extension 文档提供了一个 [Hello World 范例](https://code.visualstudio.com/docs/extensions/example-hello-world)，很庆幸的是，这个范例正好是我们所需要的。这个范例是这样工作的，在命令窗口中输入 `Hello World`，会弹出一个提示窗，代码是这样的：

    // extension.js
    function activate(context) {
        let disposable = vscode.commands.registerCommand('extension.sayHello', function () {
            // The code you place here will be executed every time your command is executed

            // Display a message box to the user
            vscode.window.showInformationMessage('Hello World!');
        });
        context.subscriptions.push(disposable);
    }

其它的我们都可以不需要理解，只需要把 `vscode.window.showInformationMessage('Hello World!');` 这行代码替换成我们自己的逻辑，即获取文本，加空格，替换原来的文本，这个插件就基本完成了。

首先来看怎么获取文本。在 [Hello World 范例](https://code.visualstudio.com/docs/extensions/example-hello-world) 这篇文章中，我们能简单了解到以下几种对象：

- Window 对象 - 表示当前 VS Code 的整个窗口，用 `vscode.window` 得到这个 Window 对象。
- TextEditor 对象 - VS Code 的整个窗口中可能打开了多个 tab，每一个 tab 就是一个 TextEditor 对象，但我们只需要那个当前激活的 tab，我们用 `window.activeTextEditor` 属性来取得当前工作中的 tab，即 TextEditor 对象。
- TextDocument 对象 - 每个 TextEditor 中都有一个文档，这个文档就是 TextDocument 对象，我们用 `editor.document` 属性来取得 TextEditor 对象中的 TextDocument 对象。TextDocument 对象有一个 `getText()` 方法来取得其中的所有文本。

最终，我们通过

    const originText = vscode.window.activeTextEditor.document.getText()

取得当前正在编辑的文档的所有文本。

既然拿到了原始文本，处理就很好办了 (此处忽略了通过 npm 安装 pangu 的过程)：

    const refinedText = pangu.spacing(originText)

接着，我们就该用新文本替换旧文本了，想着既然有 `document.getText()` 方法，就该有一个配套的 `document.setText(string)` 方法吧，三行代码搞定插件，简单粗暴：

    vscode.window.activeTextEditor.document.setText(refinedText)

结果 too young too simple, sometime naive! TextDocument 居然没有这样的方法，也没有类似的方法，困惑了，到底是怎么才能操作原来的文本呢？

找到网上为数不多的一篇介绍如何使用插件编辑文档的文章 - [Visual Studio Code Extensions: Editing the Document](http://www.chrisstead.com/archives/1082/visual-studio-code-extensions-editing-the-document/)，在这篇文章中，逐渐了解到 VS Code 插件编辑文本内容的核心思想。

这个思想体现在一种对象上 - **TextEdit** 对象 (注意，不是 TextEditor)。一个 TextEdit 对象就表示对文本的一次操作。

对文本的操作无外乎三种：增加，删除，替换，但其实归结起来，增加和删除，也算是替换操作。增加，用新的字符串，替换空字符串；删除，用空字符串替换原来的字符串。

对于要换替换的对象，既原来的字符串，我们要知道它在文档中所处的位置，这个位置包括起始位置和结束位置，每个位置都应该包括它所在的行号和所在行内的编号，这两个位置组成了一个区间。

VS Code 用 Position 对象来表征文档内一个字符所在的位置，它有两个属性：

- line - 行号
- character - 所在行内的编号

一个起始 Position 和一个结尾 Position，两个 Position 组成了 Range 对象，这个 Range 对象就代表了一串连续的字符。

这样，我们有了要替换的对象，又有新的字符串，我们就可以定义出一个 TextEdit 对象来表示这样一次替换操作。

    const aTextReplace = new vscode.TextEdit(range, newText)

比如，我们要把第 2 行第 3 个字符，到第 5 行第 6 个字符，删除掉，即用空字符串替换它，代码如下：

    const start = new vscode.Position(2, 3)
    const end = new vscode.Position(5, 6)
    const range = new vscode.Range(start, end)
    const aTextDel = new vscode.TextEdit(range, '')

上面前三行代码可以简化成

    const range = new vscode.Range(2, 3, 5, 6)

第四行代码 TextEdit 对象可以用 `TextEdit.delete(range)` 静态方法生成：

    const aTextDel = vscode.TextEdit.delete(range)

Range 和 TextEdit，我认为是操作文本的核心概念，理解它这两个对象，其它的也就没什么难的了。

但是，到目前为止，TextEdit 还只是定义了一个将被应用的操作，但还没有真正地被应用到文本上，那怎么来把这个操作真正执行呢。

这里又涉及到一个新的对象 - WorkspaceEdit 对象。WorkspaceEdit 可以理解成 TextEdit 的容器。TextEdit 只是对文本的一次操作，如果我们需要对这个文本同时进行多次操作，比如全局替换，我们就要定义多个 TextEdit 对象，并把这些对象放到一个数组里，再把这个数组放到 WorkspaceEdit 对象中。

更强大的在于，WorkspaceEdit 支持对多个文档同时进行多次操作，因此，每个 TextEdit 数组必然需要对应一个文档对象，WorkspaceEdit 使用 uri 来表征一个文档，uri 可以从 `document.uri` 属性获得。

我们前面得到了 document 对象，我们又定义了一些 TextEdit 对象，我们把它放到 WorkspaceEdit 对象中：

    let textEdits = []
    textEdits.push(aTextDel)
    // push more TextEdit
    // textEdits.push(...)

    let workspaceEdit = new vscode.WorkspaceEdit()
    workspaceEdit.set(document.uri, textEdits)

最后，我们终于可以真正地执行这些操作了，使用 `vscode.workspace.applyEdit()` 方法来使这些操作生效：

    vscode.workspace.applyEdit(workspaceEdit)

来看看我们这个插件是如何实现的：

    const editor = vscode.window.activeTextEditor
    if (!editor) {
        return  // No open text editor
    }

    const document = editor.document
    const lineCount = document.lineCount

    let textEdits = []
    for (let i=0; i<lineCount; i++) {
        const textLine = document.lineAt(i)
        const oriTrimText = textLine.text.trimRight()

        if (oriTrimText.length === 0) {
            textEdits.push(new vscode.TextEdit(textLine.range, ''))
        } else {
            const panguText = pangu.spacing(oriTrimText)
            textEdits.push(new vscode.TextEdit(textLine.range, panguText))
        }
    }
    let workspaceEdit = new vscode.WorkspaceEdit()
    workspaceEdit.set(document.uri, textEdits)
    vscode.workspace.applyEdit(workspaceEdit)

因为做了一些额外的操作 - 删除多余的尾部空格，所以代码稍微多了一些，但整体逻辑是非常简单的，就是遍历每一行，通过 `document.lineAt(i)` 拿到每一行对象，每一行都是一个 TextLine 对象，这个对象里有这一行所有文本的内容，和它们的 Range。如果是空行，则生成用空白文本替换原来内容的 TextEdit 对象，否则，生成用加空格后的文本替换原来文本的 TextEdit 对象。把这些 TextEdit 对象以数组的形式放到 WorkspaceEdit 对象中，最后执行这个对象中的所有操作。

WorkspaceEdit 的设计目标是同时对多个文档进行多次操作，如果我们只是想对当前文档进行编辑，用 WorkspaceEdit 有点杀鸡用牛刀的感觉，从上面也可以看出，包裹的层数太多了。

如果只对当前 tab 即 TextEditor 对象进行文本编辑，我们可以使用 TextEditor 对象的 `edit()` 方法，代码是类似的，只不过不用显式的生成 TextEdit 对象。看代码就明白了：

    editor.edit(builder => {
        for (let i=0; i<lineCount; i++) {
            const textLine = document.lineAt(i)
            const oriTrimText = textLine.text.trimRight()

            if (oriTrimText.length === 0) {
                builder.replace(textLine.range, '')
                // 等同于
                // builder.delete(textLine.range)
            } else {
                const panguText = pangu.spacing(oriTrimText)
                builder.replace(textLine.range, panguText)
            }
        }
    })

`builder.repalce(textLine.range, panguText)` 就相当于执行了一个 `TextEdit(textLine.range, panguText)` 对象。相比之下，代码比上面简洁了一些。

这里要注意，不要把循环写在 `editor.edit()` 外面，我一开始就是这么做的，导致只有第一次编辑生效 - [Extension API TextEditorEdit.replace only works on primary selection?](https://github.com/Microsoft/vscode/issues/5886)。

另外，还有一个比较常见的对象 Selection，它继承自 Range 对象，所以也是表示一个区间，它表示在 tab 中用光标选中的区域，可以通过 `editor.selection` 获得。

最后，做一下总结，VS Code extension 中对文本的操作主要使用以下对象和属性、方法：

- Window
  - activeTextEditor
- TextEditor
  - document
  - selection
  - edit()
- TextDocument
  - uri
  - lineCount
  - lineAt()
  - getText()
- WorkspaceEdit
- TextEdit
- Range
- Selection
- Position
