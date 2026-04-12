import { commands, env, window } from 'vscode'

export async function insertConsoleLog() {
  try {
    // 获取当前编辑器
    const editor = window.activeTextEditor
    if (!editor) {
      window.showErrorMessage('No active editor found')
      return
    }

    // 从剪贴板获取复制的变量名
    const clipboardText = await env.clipboard.readText()
    if (!clipboardText || clipboardText.trim() === '') {
      window.showErrorMessage('No text found in clipboard')
      return
    }

    // 清理剪贴板内容，去除首尾空白
    const variableName = clipboardText.trim()

    // 构建 console.log 语句
    const consoleLogStatement = `console.log("🚀 22 ~ ${variableName}:", ${variableName})\n`

    // 在当前光标位置插入 console.log 语句
    await editor.edit((editBuilder) => {
      editBuilder.insert(editor.selection.active, consoleLogStatement)
    })

    // 格式化插入的代码（如果启用了格式化）
    await commands.executeCommand('editor.action.formatDocument')
  }
  catch (error) {
    console.error('Error inserting console.log:', error)
    window.showErrorMessage('Failed to insert console.log statement')
  }
}
