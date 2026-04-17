import { commands, env, window } from 'vscode'

// 允许的变量表达式：标识符，带点访问或方括号下标（数字/字符串字面量）。
// 示例：`foo`、`obj.bar.baz`、`arr[0]`、`map['key']`、`this.value`
// 不允许：空格、分号、换行、注释、引号转义、模板字符串字符等，可防止
// 剪贴板内容被当作代码注入到用户文件中。
const SAFE_EXPRESSION_RE
  = /^[a-z_$][\w$]*(?:\.[a-z_$][\w$]*|\[(?:\d+|'[^'\\]*'|"[^"\\]*")\])*$/i

const MAX_EXPRESSION_LENGTH = 200

async function insertConsoleLog() {
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

    // 校验剪贴板内容是合法的变量表达式，防止将任意代码注入到当前文件中
    if (
      variableName.length > MAX_EXPRESSION_LENGTH
      || !SAFE_EXPRESSION_RE.test(variableName)
    ) {
      window.showErrorMessage(
        'Clipboard content is not a valid variable expression',
      )
      return
    }

    // 构建 console.log 语句。标签部分使用 JSON.stringify 安全转义，
    // 表达式部分在上方已经通过白名单校验，拼接到源码中是安全的。
    const label = JSON.stringify(`🚀 ~ ${variableName}:`)
    const consoleLogStatement = `console.log(${label}, ${variableName})\n`

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

export default insertConsoleLog
