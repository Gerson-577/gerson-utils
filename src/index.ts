import { defineExtension } from 'reactive-vscode'
import { commands, window } from 'vscode'
import { insertConsoleLog } from './utils/insertConsoleLog'

const { activate, deactivate } = defineExtension(() => {
  window.showInformationMessage('Gerson Utils extension activated!')

  // 注册命令：插入复制变量的 console.log
  commands.registerCommand('gerson-utils.insertConsoleLog', insertConsoleLog)
})

export { activate, deactivate }
