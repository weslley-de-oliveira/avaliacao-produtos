# Sign-Up (Criação de Conta)

## Escopo

Front-end, Back-end, Banco de Dados

## Contexto

Precisamos implementar o fluxo de criação de contas na plataforma, onde as pessoas precisarão fornecer:

- Nome
- Sobrenome
- Email
- Senha
- Confirmação de Senha

## Requisitos funcionais

1. Precisamos adicionar validação de formulário ma camada de cliente
   1.1. Caso o formulário esteja válido podemos enviar a requisição para a API
2. Os campos nome e sobrenome devem ser separados
3. Precisamos criar uma nova conta no banco de dados na tabela de `accounts`
   3.1. `id`: nanoid (gerado com `nanoid` na camada de API)
   3.2. `first_name`: text
   3.3. `last_name`: text
   3.4. `created_at`: timestamp
   3.5. `updated_at`: timestamp
   3.6. `active`: boolean
   3.7. `email`: text
   3.8. `password`: text (hash bcrypt, que já embute o salt gerado pelo bcryptjs)
4. A requisição deve ser um `POST` para `/api/v1/sign-up` e receber os dados como JSON no `body`
5. Caso tudo dê certo retornar `201` ou erros de acordo com a validação:
   5.1. `400`: Má formatação de dados

## Requisitos não funcionais

1. Segurança: Precisamos salvar as senhas de forma segura no banco de dados
   1.1. Precisamos receber os dados de forma segura usando HTTPS (para prevenir network sniff)
   1.2.
2. UI/UX: Boa experiência do uso de uma interface bonita, elegante, moderna e responsiva
3. Performance: O processo de criação de conta precisa ser rápido

## Você deve

1. Criar base do projeto com um endpoint inicial para criação de conta
2. Criar a base do projeto com uma página inicial para a interface de criação de conta
3. Configurar as bibliotecas base

## Você não deve

1. Implementar qualquer outra funcionalidade que não esteja relacionada com sign-up (criação de contas)
2. Não vamos realizar nenhum envio de email no momento, apenas processar a requisição, salvar no banco de dados e retornar um sucesso

## Tecnologias (Stacks)

React.js, Nextjs, React-Hook-Form, Shadcn, TailwindCSS, Supabase, TRCP, Bunjs

## Critérios de aceitação

1. Temos uma página para criar uma nova conta em `/auth/sign-up`
2. A página contém um formulário com validação
3. A plataforma consegue se comunicar com a API para enviar os dados e receber uma resposta
4. Estamos informando possíveis erros
   4.1. Mostrar um alert em vermelho no formulário
5. Estamos informando o secusso da criação de contas:
   5.1. Navegador para `/auth/sign-up/success`

## Resultados

Pessoas conseguem criar uma nova conta na plataforma
