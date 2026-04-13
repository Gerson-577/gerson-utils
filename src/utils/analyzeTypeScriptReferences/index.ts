import type { Uri } from 'vscode'
import * as ts from 'typescript'
import { commands, env, window, workspace } from 'vscode'

interface ReferenceNode {
  name: string
  kind: string
  file: string
  line: number
  column: number
  references: ReferenceNode[]
}

async function analyzeTypeScriptReferences() {
  return;
  try {
    // 获取当前编辑器
    const editor = window.activeTextEditor
    if (!editor) {
      window.showErrorMessage('No active editor found')
      return
    }

    // 获取当前选中的文本（变量名）
    const selection = editor.selection
    const variableName = editor.document.getText(selection).trim()

    if (!variableName) {
      window.showErrorMessage('Please select a variable name to analyze')
      return
    }

    // 显示进度信息
    window.showInformationMessage(`Analyzing references for variable: ${variableName}`)

    // 分析引用关系
    const references = await findReferences(variableName, editor.document.uri)

    // 构建引用树
    const referenceTree = buildReferenceTree(references)

    // 显示结果
    displayReferenceTree(referenceTree, variableName)
  }
  catch (error) {
    console.error('Error analyzing TypeScript references:', error)
    window.showErrorMessage('Failed to analyze TypeScript references')
  }
}

async function findReferences(variableName: string, startUri: Uri): Promise<Array<{ fileName: string, line: number, column: number, kind: string }>> {
  const program = getTypeScriptProgram()
  if (!program) {
    throw new Error('Failed to create TypeScript program')
  }
  console.log("🚀 22 ~ startUri.fsPath:", startUri.fsPath)

  // 尝试获取当前文件的源文件，支持不同的扩展名
  let sourceFile = program.getSourceFile(startUri.fsPath)

  // 如果找不到，尝试添加 .ts 扩展名
  if (!sourceFile) {
    sourceFile = program.getSourceFile(`${startUri.fsPath}.ts`)
  }

  // 如果找不到，尝试添加 .tsx 扩展名
  if (!sourceFile) {
    sourceFile = program.getSourceFile(`${startUri.fsPath}.tsx`)
  }

  // 如果找不到，尝试添加 .vue 扩展名
  if (!sourceFile) {
    sourceFile = program.getSourceFile(`${startUri.fsPath}.vue`)
  }
  console.log("🚀 22 ~ sourceFile:", sourceFile)

  if (!sourceFile) {
    // 尝试获取所有源文件，看看是否有匹配的
    const sourceFiles = program.getSourceFiles()
    const matchingFile = sourceFiles.find((file) => {
      return file.fileName === startUri.fsPath
        || file.fileName === `${startUri.fsPath}.ts`
        || file.fileName === `${startUri.fsPath}.tsx`
        || file.fileName === `${startUri.fsPath}.vue`
    })

    if (matchingFile) {
      sourceFile = matchingFile
    }
  }

  if (!sourceFile) {
    throw new Error(`Failed to get source file: ${startUri.fsPath}`)
  }

  // 查找变量声明
  let targetSymbol: ts.Symbol | undefined
  let targetNode: ts.Node | undefined

  function findTargetNode(node: ts.Node) {
    if (!node)
      return

    if (ts.isIdentifier(node) && node.escapedText === variableName) {
      const symbol = (program as ts.Program).getTypeChecker().getSymbolAtLocation(node)
      if (symbol) {
        targetSymbol = symbol
        targetNode = node
      }
    }
    ts.forEachChild(node, findTargetNode)
  }

  findTargetNode(sourceFile)

  if (!targetSymbol || !targetNode) {
    throw new Error(`Variable ${variableName} not found`)
  }

  // 查找所有引用
  const references: Array<{ fileName: string, line: number, column: number, kind: string }> = [];

  // 遍历所有源文件
  (program as ts.Program).getSourceFiles().forEach((file: ts.SourceFile) => {
    if (file.isDeclarationFile)
      return

    function findReferencesInFile(node: ts.Node) {
      if (!node)
        return

      if (ts.isIdentifier(node) && node.escapedText === variableName) {
        const symbol = (program as ts.Program).getTypeChecker().getSymbolAtLocation(node)
        if (symbol && symbol === targetSymbol) {
          const lineAndChar = file.getLineAndCharacterOfPosition(node.getStart())
          references.push({
            fileName: file.fileName,
            line: lineAndChar.line + 1,
            column: lineAndChar.character + 1,
            kind: ts.SyntaxKind[node.parent.kind],
          })
        }
      }
      ts.forEachChild(node, findReferencesInFile)
    }

    findReferencesInFile(file)
  })

  return references
}

function getTypeScriptProgram(): ts.Program | undefined {
  const workspaceFolder = workspace.workspaceFolders?.[0]
  if (!workspaceFolder) {
    return undefined
  }

  const configFile = ts.findConfigFile(
    workspaceFolder.uri.fsPath,
    ts.sys.fileExists,
    'tsconfig.json',
  )

  if (!configFile) {
    return undefined
  }

  const configFileText = ts.sys.readFile(configFile)
  if (!configFileText) {
    return undefined
  }

  const parsedConfig = ts.parseJsonConfigFileContent(
    ts.parseJsonText(configFile, configFileText),
    ts.sys,
    workspaceFolder.uri.fsPath,
  )

  // 查找额外的 TypeScript 文件（Vue、TSX 等）
  const additionalFiles = findAdditionalTypeScriptFiles(workspaceFolder.uri.fsPath)
  const allFileNames = [...parsedConfig.fileNames, ...additionalFiles]

  const program = ts.createProgram({
    rootNames: allFileNames,
    options: parsedConfig.options,
  })

  return program
}

function findAdditionalTypeScriptFiles(rootPath: string): string[] {
  const additionalFiles: string[] = []

  // 递归查找 Vue 文件
  function findVueFiles(dir: string) {
    try {
      const items = fs.readdirSync(dir)
      for (const item of items) {
        const fullPath = path.join(dir, item)
        const stat = fs.statSync(fullPath)
        if (stat.isDirectory()) {
          // 跳过 node_modules 和隐藏目录
          if (item !== 'node_modules' && !item.startsWith('.')) {
            findVueFiles(fullPath)
          }
        } else if (item.endsWith('.vue')) {
          additionalFiles.push(fullPath)
        }
      }
    } catch (error) {
      console.error('Error reading directory:', dir, error)
    }
  }

  findVueFiles(rootPath)

  return additionalFiles
}

function buildReferenceTree(references: Array<{ fileName: string, line: number, column: number, kind: string }>): ReferenceNode[] {
  const nodes: ReferenceNode[] = []

  references.forEach((reference) => {
    const node: ReferenceNode = {
      name: 'reference',
      kind: reference.kind,
      file: reference.fileName,
      line: reference.line,
      column: reference.column,
      references: [],
    }

    nodes.push(node)
  })

  return nodes
}

function displayReferenceTree(references: ReferenceNode[], variableName: string) {
  if (references.length === 0) {
    window.showInformationMessage(`No references found for variable: ${variableName}`)
    return
  }

  const message = `Found ${references.length} references for variable: ${variableName}\n\n${references.map((ref, index) => {
    return `${index + 1}. ${ref.kind}\n   File: ${ref.file}\n   Line: ${ref.line}, Column: ${ref.column}`
  }).join('\n\n')}`

  window.showInformationMessage(message, 'Copy to Clipboard').then((action) => {
    if (action === 'Copy to Clipboard') {
      env.clipboard.writeText(message)
    }
  })
}

export default analyzeTypeScriptReferences
