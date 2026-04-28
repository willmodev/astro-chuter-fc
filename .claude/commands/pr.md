---
description: "Crea un Pull Request en GitHub con estructura consistente en español"
allowed-tools: ["Bash(git *)", "mcp__plugin_github_github__create_pull_request"]
---

Actúa como un Senior Developer. Analiza los commits y el diff entre la rama actual y main/master, luego crea un Pull Request en GitHub usando el plugin MCP de GitHub.

## Proceso
1. Ejecuta `git log main..HEAD --oneline` para ver los commits incluidos.
2. Ejecuta `git diff main..HEAD --stat` para ver los archivos afectados.
3. Si la rama no tiene remote aún, ejecuta `git push -u origin HEAD`.
4. Genera el título del PR siguiendo el mismo formato de commits: `<emoji> <type>(<scope>): <subject>`
5. Genera el cuerpo del PR con esta estructura exacta:

---

## ¿Qué cambia?
(Descripción breve y clara del cambio)

## ¿Por qué?
(Contexto o motivación: bug, mejora, nueva feature)

## Cambios principales
- (lista de cambios relevantes extraídos del diff)

## Notas adicionales
(Decisiones técnicas, deuda pendiente, o vacío si no aplica)

---

## Reglas
- Todo en español.
- El título debe ser conciso (máx 70 chars).
- NO agregues el footer de co-autoría de Claude.
- Crea el PR usando la herramienta `mcp__plugin_github_github__create_pull_request` (NO uses `gh` CLI).
- El repositorio es `willmodev/dev-brain-app` y la base siempre es `main`.