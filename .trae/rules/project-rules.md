
项目结构规范：

1. 工具函数组织
   - 每个工具函数应在 `src/utils/` 目录下创建独立的子文件夹
   - 每个子文件夹内包含 `index.ts` 作为入口文件
   - 工具函数按功能模块划分，保持高内聚低耦合

2. 主入口职责
   - `src/index.ts` 仅负责：
     - 注册 VS Code 命令
     - 激活/停用扩展
     - 导入并调用工具函数
   - 禁止在入口文件中编写具体业务逻辑

3. 模块导出规范
   - 工具函数使用默认导出（default exports）
   - 入口文件通过默认导入所需函数

4. 目录示例
   ```
   src/
   ├── index.ts          # 扩展入口，仅注册命令
   └── utils/
       ├── formatDate/   # 日期格式化工具
       │   └── index.ts
       ├── parseConfig/  # 配置解析工具
       │   └── index.ts
       └── validateInput/# 输入验证工具
           └── index.ts
   ```
