# Home

## Escopo
Front-End, Back-End, Banco de Dados

## Contexto
Precisamos impementação o fluxo para listagem de produtos

## Requisitos funcionais
1. A home deve listar todos os produtos de forma paginada com infinite lading (scrolling)
   1. Cada produto deve mostrar o titulo, imagem e uma descrição simples
2. Precisamos criar uma nova conta no banco de dados na tabela de `products`
   1. `id`: nanoid (gerado com `nanoid` na camada de API)
   2. `name`: text
   3. `description`: text (opcional)
   4. `created_at`: timestamp
   5. `updated_at`: timestamp
   6. `score`: boolean
   7. `external_link`: text
3. A requisição deve ser um `GET` para `/api/v1/products`
4. Caso tudo dê certo retornar `200` ou array vazio
5. Ao cliar no nome de um produto devemos navegar para os detalhes do mesmo (iremos construir essa pagina em breve)

## Requisitos não funcionais
- UI/UX: Boa experiência de uso através de uma interface bonita, elegante, moderna
- Performance: O processo de criação de conta precisa ser rápido

## Você deve
- Criar um endpoint novo para listar todos os produtos
- Enriquecer a home existente ou criar uma nova pagina
- Criar a tabela no banco de dados
- Criar uma nova migration do Supabase
- Crier um endpoint para manualmente inserir novos produtos (POST `/products` com name, external_link e imagem)

## Você não deve
- Implementar qualquer outra funcionalidade que não esteja relacionada com sign-up (criação de contas).
- Não vamos realizar nenhum envio de email no momento, apenas processar a requisição, salvar no banco dados e tornar um sucesso.

## Tecnologias (Stack)
React.js, Next.js, React-Hook-Form, Shadcn, Tailwild, Supabase, TRCP, Bunjs.

## Critérios de aceitação
- Pagina home listando todos os produtos existentes

## Resultado
Pessoas conseguem ver os produtos de forma publica, sem autenticação.
