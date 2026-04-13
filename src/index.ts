import { defineExtension } from 'reactive-vscode'
import { commands, window } from 'vscode'
// import analyzeTypeScriptReferences from './utils/analyzeTypeScriptReferences'
import insertConsoleLog from './utils/insertConsoleLog'

const { activate, deactivate } = defineExtension(() => {
  // 注册命令：插入复制变量的 console.log
  commands.registerCommand('gerson-utils.insertConsoleLog', insertConsoleLog)
  // 注册命令：分析 TypeScript 引用关系
  // commands.registerCommand('gerson-utils.analyzeTypeScriptReferences', analyzeTypeScriptReferences)
})

export { activate, deactivate }
