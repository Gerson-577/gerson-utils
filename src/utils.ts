
import { defineLogger } from 'reactive-vscode'
import { displayName } from './generated/meta'

export const logger = defineLogger(displayName)

/**
 * 将文本内容写入到指定工作区文件夹的dist目录下的a.json文件中
 * @param workspaceFolder - 工作区文件夹
 * @param configFileText - 要写入的文本内容
 */
export async function writeConfigToDist(workspaceFolder: { uri: { fsPath: string } }, configFileText: string,): Promise<void> {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const distPath = path.join(workspaceFolder.uri.fsPath, 'dist')
    if (!fs.existsSync(distPath)) {
        fs.mkdirSync(distPath, { recursive: true })
    }
    fs.writeFileSync(path.join(distPath, 'a.json'), configFileText)
}
