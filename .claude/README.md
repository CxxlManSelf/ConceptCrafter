# ConceptCrafter 專案

本專案使用 ConceptMap 規範，詳細規範已移至全局知識庫。

## 📍 全局規範位置
`~/.claude/ConceptMap/`

## 📚 規範文件
- **操作指南**：`~/.claude/ConceptMap/CLAUDE-PROJECTS-INSTRUCTIONS.md`
- **技術規範**：`~/.claude/ConceptMap/map-file-specification.md`
- **完整知識**：`~/.claude/ConceptMap/CLAUDE_PROJECTS_KNOWLEDGE.md`
- **Favicon 指南**：`~/.claude/ConceptMap/FAVICON-GUIDE-FOR-CLAUDE.md`

## 🖼️ 資源檔案
- **預設圖標**：`~/.claude/ConceptMap/concept-crafter_icon.png`
- **模板**：`~/.claude/ConceptMap/templates/`
- **範例**：`~/.claude/ConceptMap/examples/`

## 🎯 快速指令

### Claude Code CLI
直接使用觸發詞即可：
```
生成 map 圖
建立概念圖
```

### Claude Projects（網頁版）
由於 Claude Projects 無法讀取全局配置，請使用以下方式之一：

**方式 1：使用符號連結（推薦）**
```bash
# Linux/Mac
ln -s ~/.claude/ConceptMap .claude

# Windows（需管理員權限）
New-Item -ItemType SymbolicLink -Path ".claude" -Target "$env:USERPROFILE\.claude\ConceptMap"
```

**方式 2：複製規範到專案**
```bash
# 複製全局規範到專案（需要時才執行）
cp -r ~/.claude/ConceptMap/* .claude/
```

**方式 3：直接引用**
在對話中告知 Claude Projects：
```
請參考 ~/.claude/ConceptMap/ 中的規範來生成 map 圖
```

## ⚙️ 說明
- 全局規範統一管理，方便維護
- Claude Code CLI 會自動讀取全局配置
- Claude Projects 需要專案內有規範副本或手動引用
- 修改規範只需更新 `~/.claude/ConceptMap/` 即可
