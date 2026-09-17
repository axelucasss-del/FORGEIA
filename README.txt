FORGEAI — VERSÃO ESTÁTICA

Arquivos:
- index.html
- styles.css
- app.js

Como usar:
1. Extraia o ZIP.
2. Abra index.html diretamente no navegador.
3. Não é necessário instalar Node, servidor ou dependências.
4. Seus dados ficam salvos no localStorage do navegador.

Funcionalidades:
- Cadastro de perfil
- Geração local de ficha de 12 semanas
- Treinos A/B/C/D/E/F conforme frequência
- Progressão por recomendação de carga
- Registro de séries
- Histórico
- Peso corporal
- PRs
- Exportação/importação JSON
- Exclusão de dados
- Layout responsivo

Sobre a Groq:
Esta edição foi deliberadamente feita para funcionar abrindo o index.html diretamente.
Uma chamada direta à Groq exigiria colocar a API key no navegador, o que exporia o segredo.
Para IA Groq real em produção, use um pequeno backend/proxy seguro. A interface pode ser conectada a ele depois sem mudar a estrutura visual.

Personalização: o formulário agora solicita Sexo (Homem/Mulher) e mostra essa informação na ficha ativa.

Prioridade por perfil: Homem = membros superiores; Mulher = posterior de coxa/glúteos. Essa prioridade reorganiza a seleção e distribuição dos exercícios sem substituir o objetivo principal escolhido.
