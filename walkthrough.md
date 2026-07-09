# Walkthrough: Filtros de Escala Personalizáveis, Controle de Férias Histórico e Correção de Seeding

Corrigimos os problemas de perfis excluídos que reapareciam após o login, implementamos a opção de excluir perfis do fluxo da escala (ex: RH) e refinamos a exibição das férias e do dashboard.

---

## Modificações Realizadas

1. **Suporte para Equipe Recursos Humanos (RH) e Ocultação do Campo de Escala**:
   - **Novo Tipo de Equipe**: Adicionamos a opção "Recursos Humanos (RH)" na seleção de **Equipe Operacional** ao criar ou editar colaboradores.
   - **Ocultação Inteligente do Campo "Participa da Escala?"**:
     - Quando o administrador seleciona a equipe "Recursos Humanos (RH)", o campo "Participa da Escala?" é **automaticamente ocultado** da tela e seu valor interno é forçado para `'fora'` (fora das escalas).
     - Se o administrador selecionar uma equipe operacional (N1 ou Torre), o campo volta a ficar visível e redefinido para a participação padrão.
     - Este comportamento inteligente também é mantido na edição de perfis antigos e nos resets do formulário.

2. **Dashboard Totalmente Responsivo**:
   - **Remoção de Denominador Estático**: Removemos o divisor estático `/ 19` que estava embutido no card de "Colaboradores Ativos".
   - A métrica agora exibe dinamicamente a contagem real e atualizada de perfis registrados na base de dados (ex: "1 Ativos", "5 Ativos", etc.), de forma limpa e flexível.

3. **Correção do Bug de Reaparecimento de Perfis (Seeding Único)**:
   - **Causa**: Quando o banco de dados do Supabase tinha apenas 1 usuário (o Administrador após exclusões), o sistema interpretava como um banco de dados novo e fazia o upload automático do seed completo com os 19 colaboradores padrão novamente.
   - **Solução**: Implementamos um flag de persistência local de uma única via (`ufinet_db_seeded`). Uma vez que o banco de dados local ou na nuvem foi inicializado uma vez, o seed é bloqueado permanentemente e exclusões voluntárias nunca mais serão sobrescritas por logins subsequentes.

4. **Opção de Exclusão de Escala ("Participa da Escala?")**:
   - Atualizamos o formulário de criação/edição de perfis na aba **Gerenciar Perfis** e o banco de dados.
   - Agora, ao gerenciar um colaborador, o administrador pode escolher entre:
     - **Sim (Escala Turnos NOC)**: O operador é escalado na rotação do NOC.
     - **Sim (Escala Sobreaviso)**: O operador entra para os turnos de plantão/sobreaviso.
     - **Não (Apenas Perfil / RH / Admin)**: O perfil é salvo para fins de acesso ou RH, mas é totalmente omitido das duas grades operacionais e de seus cálculos de métricas correspondentes.

5. **Filtro de Exibição de Férias (Aprovadas e Ativas/Passadas)**:
   - Refinamos o renderizador de férias na tabela **Controle de Férias** e na lista de **Alertas Importantes** do Dashboard.
   - Agora, a interface exibe apenas:
     - Solicitações de férias **pendentes de aprovação** (para que o Coordenador ainda possa tomar ações).
     - Férias **aprovadas que já se iniciaram ou já passaram** em relação à data corrente (por exemplo, período de férias atualmente ativo ou já concluído).
     - Férias futuras aprovadas ficam ocultas da lista histórica até que chegue o dia do seu início.
