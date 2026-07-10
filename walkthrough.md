# Walkthrough: Criptografia de Senhas pgcrypto, Autenticação Segura via RPC e Chaves Estrangeiras

Finalizamos as melhorias estruturais recomendadas para subir a aplicação de gestão de escalas para a Web de forma segura, performática e confiável.

---

## Modificações Realizadas

1. **Criptografia de Senhas com Blowfish (`pgcrypto`)**:
   - Adicionamos a extensão `pgcrypto` no script do PostgreSQL.
   - Criamos uma trigger inteligente `trigger_hash_password` na tabela `profiles`. Ela detecta se uma senha inserida/editada não é um hash criptografado e realiza o hasheamento seguro via `crypt(password, gen_salt('bf', 8))` no servidor de banco de dados.
   - Isso garante que nenhuma senha dos colaboradores seja salva em texto limpo no banco de dados.

2. **Validação de Login via RPC no Supabase (Autenticação Segura)**:
   - Criamos a função RPC `verify_profile_login` no PostgreSQL do Supabase.
   - A lógica de autenticação do frontend foi atualizada para disparar uma requisição segura via RPC para validar as credenciais. A senha criptografada nunca é transmitida para o navegador do cliente, minimizando brechas.
   - Mantivemos fallbacks locais no `localStorage` caso o sistema esteja offline.

3. **Chaves Estrangeiras e Integridade Referencial**:
   - Ajustamos as tabelas `shifts` (escalas NOC) e `sobreaviso` para referenciar a coluna `username` da tabela `profiles` com `ON DELETE CASCADE ON UPDATE CASCADE`.
   - Isso garante que, se um perfil for excluído, todos os seus turnos de escala e históricos sejam apagados em cascata automaticamente pelo banco de dados PostgreSQL.

4. **Migração do LocalStorage Automatizada**:
   - Implementamos uma rotina de migração no frontend (`initDatabase`) que converte automaticamente as chaves antigas de escalas baseadas em nomes de exibição (ex: `Ericles Sousa|2026|7|10`) para o formato único e imutável baseado no username (ex: `ericles.sousa|2026|7|10`), prevenindo perdas de dados salvos de testes anteriores dos usuários.
