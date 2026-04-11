import { defineExtension } from 'reactive-vscode'
import { window } from 'vscode'

const { activate, deactivate } = defineExtension(() => {
  window.showInformationMessage('Gerson Utils extension activated!')
})

export { activate, deactivate }
