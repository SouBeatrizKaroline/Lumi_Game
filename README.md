# Lumi & the Lost Stars

Um jogo web 2D cozy de plataforma e exploração em uma floresta mágica. Lumi é uma gatinha preta/chumbo, de olhos dourados, capa azul e pingente de estrela. Cada fragmento recuperado devolve luz e vida ao cenário.

![Referência visual de Lumi & the Lost Stars](reference-lumi-concept.png)

> A imagem acima é a direção visual do projeto: paleta azul-noturna e dourada, expressão carismática, cogumelos luminosos, riacho, ponte, clareira e Árvore Ancestral.

O jogo também incorpora arte ilustrada criada a partir dessa direção, com cenários e sprites animados em `forest-art.png` e `lumi-spritesheet.png`.

## Jogar

Abra `index.html` em um navegador ou sirva a pasta com qualquer servidor estático. Não há dependências nem build obrigatório.

- **A/D** ou **←/→**: mover
- **Espaço**, **W** ou **↑**: pular
- **R**: voltar ao último checkpoint
- No celular: use os botões na tela

## Mecânicas do MVP

- 20 estrelas principais + 3 estrelas secretas.
- Personagem e cenário redesenhados com formas detalhadas no canvas, expressão, cauda e lenço animados, brilho, partículas e parallax.
- Arte estilizada com azul noturno, roxo, dourado e silhuetas de floresta, seguindo a prancha conceitual.
- Pulo com coyote time, jump buffer, aceleração e desaceleração.
- Colisão consistente com topo, laterais e parte inferior das plataformas, subpassos contra atravessamentos e rota contínua até o final.
- Animação de corrida, salto e aterrissagem para Lumi, com cauda, olhos, lenço e pingente animados.
- Cenário com camadas de parallax, céu em evolução, água animada, cogumelos, lanternas, partículas e brilho das estrelas.
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
| `forest-art.png` | Fundo ilustrado da floresta mágica |
| `lumi-spritesheet.png` | Lumi em oito poses para animação |

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
