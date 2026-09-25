# Lumi & the Lost Stars

Um jogo web 2D cozy de plataforma e exploração em uma floresta mágica. Lumi é uma gatinha preta/chumbo, de olhos dourados, capa azul e pingente de estrela. Cada fragmento recuperado devolve luz e vida ao cenário.

![Referência visual de Lumi & the Lost Stars](reference-lumi-concept.png)

> A imagem acima é a direção visual do projeto: paleta azul-noturna e dourada, expressão carismática, cogumelos luminosos, riacho, ponte, clareira e Árvore Ancestral. O MVP usa formas desenhadas no canvas para permanecer leve e jogável; a arte final pode substituir esses elementos progressivamente.

## Jogar

Abra `index.html` em um navegador ou sirva a pasta com qualquer servidor estático. Não há dependências nem build obrigatório.

- **A/D** ou **←/→**: mover
- **Espaço**, **W** ou **↑**: pular
- **R**: voltar ao último checkpoint
- No celular: use os botões na tela

## Mecânicas do MVP

- 20 estrelas principais + 3 estrelas secretas.
- Pulo com coyote time, jump buffer, aceleração e desaceleração.
- Plataformas, riacho, ponte, cogumelos luminosos, parallax e partículas.
- Checkpoints e respawn sem Game Over.
- A floresta muda em 0%, 25%, 50%, 75% e 100% das estrelas principais.
- Clareira e Árvore Ancestral no final.
- Sequência final: **“The forest remembers its light.”**
- Interface minimalista, controles touch, alto contraste e status acessível.

## Estrutura

| Arquivo | Função |
| --- | --- |
| `index.html` | Estrutura da página, HUD e controles |
| `style.css` | Layout responsivo e identidade visual |
| `game.js` | Loop do jogo, física, colisões, coleta e desenho |

## Roadmap

1. Expandir o mapa com novas rotas e áreas secretas.
2. Adicionar áudio ambiente e feedback sonoro opcional.
3. Evoluir os sprites desenhados em canvas para arte final baseada na imagem conceitual.
4. Adicionar salvamento local de progresso e mais opções de acessibilidade.
5. Publicar automaticamente no GitHub Pages.

## Deploy

O workflow em `.github/workflows/pages.yml` publica automaticamente a raiz do projeto no GitHub Pages a cada push em `main`, sem dependências de build.

## Licença

MIT. Projeto criado como um MVP autoral e aberto para evolução.
