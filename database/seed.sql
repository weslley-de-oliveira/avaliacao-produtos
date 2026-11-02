-- Produtos de exemplo para a home.
-- IDs fixos e `on conflict do nothing` tornam o seed idempotente.
-- As datas são espaçadas de propósito para exercitar a paginação por cursor
-- (created_at desc, id desc).

insert into products (id, name, description, image_url, external_link, score, created_at, updated_at)
values
  (
    'seed-fone-aurora',
    'Fone Aurora',
    'Fone sem fio com cancelamento de ruído e bateria para o dia inteiro.',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
    'https://exemplo.com/produtos/fone-aurora',
    false,
    '2026-10-29 09:00:00+00',
    '2026-10-29 09:00:00+00'
  ),
  (
    'seed-camera-lume',
    'Câmera Lume',
    'Câmera compacta com sensor grande e vídeo estável na mão.',
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
    'https://exemplo.com/produtos/camera-lume',
    false,
    '2026-10-28 14:30:00+00',
    '2026-10-28 14:30:00+00'
  ),
  (
    'seed-relogio-pulso',
    'Relógio Pulso',
    'Relógio analógico com caixa fina, vidro resistente e pulseira de tecido.',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80',
    'https://exemplo.com/produtos/relogio-pulso',
    false,
    '2026-10-27 11:15:00+00',
    '2026-10-27 11:15:00+00'
  ),
  (
    'seed-tenis-orbita',
    'Tênis Órbita',
    'Tênis de corrida leve, com entressola macia e cabedal respirável.',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
    'https://exemplo.com/produtos/tenis-orbita',
    false,
    '2026-10-26 16:45:00+00',
    '2026-10-26 16:45:00+00'
  ),
  (
    'seed-cafeteira-bruma',
    'Cafeteira Bruma',
    'Cafeteira de filtro com jarra térmica e desligamento automático.',
    'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=1200&q=80',
    'https://exemplo.com/produtos/cafeteira-bruma',
    false,
    '2026-10-25 08:20:00+00',
    '2026-10-25 08:20:00+00'
  ),
  (
    'seed-teclado-tato',
    'Teclado Tato',
    'Teclado mecânico compacto com switches silenciosos e iluminação discreta.',
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=80',
    'https://exemplo.com/produtos/teclado-tato',
    false,
    '2026-10-24 19:05:00+00',
    '2026-10-24 19:05:00+00'
  ),
  (
    'seed-mochila-rotina',
    'Mochila Rotina',
    'Mochila urbana com compartimento para notebook e tecido resistente à chuva.',
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=80',
    'https://exemplo.com/produtos/mochila-rotina',
    false,
    '2026-10-23 10:40:00+00',
    '2026-10-23 10:40:00+00'
  ),
  (
    'seed-luminaria-foco',
    'Luminária Foco',
    'Luminária de mesa articulável com luz quente regulável e base estável.',
    'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=80',
    'https://exemplo.com/produtos/luminaria-foco',
    false,
    '2026-10-22 13:10:00+00',
    '2026-10-22 13:10:00+00'
  ),
  (
    'seed-caixa-som-onda',
    'Caixa de Som Onda',
    'Caixa portátil à prova de respingos, com som amplo e pareamento rápido.',
    'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1200&q=80',
    'https://exemplo.com/produtos/caixa-som-onda',
    false,
    '2026-10-21 17:55:00+00',
    '2026-10-21 17:55:00+00'
  ),
  (
    'seed-cadeira-espera',
    'Cadeira Espera',
    'Cadeira de trabalho com apoio lombar ajustável e assento de tecido.',
    'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=1200&q=80',
    'https://exemplo.com/produtos/cadeira-espera',
    false,
    '2026-10-20 09:35:00+00',
    '2026-10-20 09:35:00+00'
  )
on conflict (id) do nothing;
