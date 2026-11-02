# Feedback

## Escopo
Front-End, Back-End, Banco de Dados

## Contexto
Precisamos impementação o fluxo permitindo as pessoas logadas (autenticadas) adicionar novas avaliações aos produtos

## Requisitos funcionais
1. Caso a pessoa não esteja logada precisamos mostrar um bloco exigindo a autenticação
2. Caso ela esteja logada podemos mostrar o formulário e permitir novas avalaições
   1. Cada avaliação deve conter uma nova de 1-5 + comentário
3. Nova tabela `products_feedbacks`
   1. `id`: nanoid
   2. `score`: int
   3. `comment`: text
   4. `created_at`: timestamp
   5. `created_by` nanoid
   6. `product_id`: nanoid
4. A paginad e detalhes deve listar todos os comentários existentes para o produto e deppis renderizar o form para adicionar novos

## Requisitos não funcionais
- UI/UX: Boa experiência de uso através de uma interface bonita, elegante, moderna
- Performance: O processo de criação de conta precisa ser rápido

## Você deve
- Criar um endpoint novo para adicionar comentários
- Criar uma nova pagina de detalhes `/products/id`

## Você não deve
- Implementar qualquer outra funcionalidade que não esteja relacionada com sign-up (criação de contas).
- Não vamos realizar nenhum envio de email no momento, apenas processar a requisição, salvar no banco dados e tornar um sucesso.

## Tecnologias (Stack)
React.js, Next.js, React-Hook-Form, Shadcn, Tailwild, Supabase, TRCP, Bunjs.

## Critérios de aceitação
- Pagina de detalhes do produto mostrando as informações do produto + avaliaçÕes + formulário para nova avaliação

## Resultado
Pessoas conseguem ver os produtos de forma publica, sem autenticação mas não conseguem adicionar novos comentários
