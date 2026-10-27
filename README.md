# MeuMotor

Motor de jogos 2D (Canvas 2D + TypeScript) com editor que abre no navegador.
O motor, o editor e o compilador vivem **só na instalação global**; os projetos guardam apenas cenas, assets e código de gameplay.

## Estrutura do repositório
- `packages/engine` – o motor (Game, Scene, Input, Assets)
- `packages/editor` – interface web do editor
- `packages/cli`    – comando global `meumotor` (servidor, compilação e templates)

## Desenvolvimento
```bash
npm install          # ou: bun install
npm run build
npm run dev          # rebuild automático
npm run typecheck
cd packages/cli && npm link     # ou: bun link
```

## Usando em um jogo
```bash
meumotor init meu-jogo
cd meu-jogo
meumotor             # abre o editor; salvar um arquivo recarrega a pré-visualização
```
Projeto gerado (sem node_modules):
```
meu-jogo/
  game.json        nome, resolução, arquivo de entrada
  src/main.ts      código de gameplay (export default de uma Scene)
  assets/          imagens, áudio etc. (acesso em /assets/…)
  tsconfig.json    autocompletar no VS Code
  .meumotor/       tipos do motor, regenerados a cada execução (ignorado no git)
```
