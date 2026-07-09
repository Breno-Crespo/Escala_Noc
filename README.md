# 📅 Gestão Time Ufinet — Escala NOC & Sobreaviso

Uma aplicação de página única (SPA) moderna, reativa e totalmente integrada a banco de dados para gestão operacional de escalas de turnos NOC, equipes de sobreaviso e fluxo de aprovação de férias.

O sistema foi desenvolvido utilizando as melhores práticas de design moderno, com foco em responsividade, usabilidade e facilidade de manutenção.

---

## 🚀 Principais Funcionalidades

1. **Dashboard Operacional Dinâmico**:
   * Monitoramento de **Colaboradores Ativos** em tempo real.
   * Contagem automatizada de **Turnos em Andamento (Hoje)**, indicando a divisão exata entre equipes (N1 vs Torre de Controle).
   * Controle de **Afastamentos/Atestados (Hoje)** com identificação imediata dos colaboradores.
   * Alertas de ausências importantes e férias consolidadas ativas para o mês vigente.
   * Gráficos de barra de progresso dinâmicos que medem a cobertura e equidade da escala.

2. **Escala de Turnos NOC Reativa**:
   * Calendário horizontal e rolável cobrindo o mês completo (dias 01 a 31) com base no ano e mês selecionados.
   * Identificação de finais de semana com cores diferenciadas.
   * Edição interativa de células de turnos em tempo real com clique simples (acesso restrito a Coordenadores).
   * Filtros instantâneos por equipe (N1, Torre, Todos) e busca textual por nome do colaborador.

3. **Escala de Sobreaviso Especializada**:
   * Grid dedicado para a retaguarda operacional de sobreaviso.
   * Seleção limitada de turnos de plantão/prontidão.

4. **Controle de Férias e Fluxo de Aprovação**:
   * Painel de solicitações (exclusivo para perfil NOC) onde o analista pode pedir datas de início e término.
   * Painel de aprovação (exclusivo para o Coordenador) com ações de **Aprovar** e **Rejeitar**.
   * Filtro de segurança: exibe apenas solicitações pendentes e férias aprovadas que já iniciaram ou passaram da data, mantendo a listagem histórica e relatórios limpos.
   * Integração de férias no calendário: dias de férias aprovadas são automaticamente marcados como `FÉRIAS` (roxo) no calendário de turnos.

5. **Gerenciamento de Perfis de Acesso**:
   * CRUD completo para criação, edição e exclusão de colaboradores.
   * Permissão de escala configurável no cadastro:
     * **Sim (Escala Turnos NOC)**
     * **Sim (Escala Sobreaviso)**
     * **Não (Apenas Acesso / RH / Admin)**: Oculta o usuário das escalas (útil para cargos de Recursos Humanos ou Supervisores).

---

## 🛠️ Arquitetura e Tecnologias

A aplicação utiliza uma arquitetura **Single Page Application (SPA)** nativa:
* **Interface**: HTML5 estrutural e Semântico, CSS3 Premium (CSS Grid, Flexbox, efeitos de vidro e micro-animações).
* **Lógica**: Vanilla JavaScript (ES6) assíncrono para renderização dinâmica e manipulação do DOM.
* **Banco de Dados**: Sincronização dupla automática:
  * **Supabase Cloud (Postgres)**: Persistência permanente em nuvem via API REST.
  * **LocalStorage**: Cache local e fallback offline imediato (experiência de atualização com zero latência para o usuário).
* **Segurança**: Bloqueio de CORS contornado para permitir uso nativo via protocolo `file://` (abrir o arquivo diretamente no navegador com duplo clique).

---

## 📂 Estrutura do Projeto

* `index.html`: Casca estrutural e leiaute da SPA.
* `index.css`: Estilização e design de cartões premium.
* `index.js`: Lógica de renderização, lógica de calendário, cálculos do dashboard e sincronizadores.
* `config.js`: Credenciais de conexão ao banco de dados Supabase (injetado no escopo global).
* `supabase_schema.sql`: Script SQL contendo a criação das tabelas, políticas RLS e inserts de fábrica.
* `.env`: Configuração das chaves de ambiente.
* `.gitignore`: Exclusão de arquivos confidenciais do repositório Git.

---

## 💻 Como Rodar o Projeto Localmente

### Opção 1: Duplo Clique (Rápido)
1. Navegue até a pasta do projeto.
2. Dê um duplo clique no arquivo `index.html`. Ele abrirá diretamente em seu navegador preferido.

### Opção 2: Servidor Python Local
Se desejar rodar em um servidor local simulando produção, execute na pasta do projeto:
```bash
python -m http.server 8000
```
Depois, abra o endereço [http://localhost:8000](http://localhost:8000) no seu navegador.

---

## ☁️ Configuração do Supabase (Cloud)

Caso queira inicializar a aplicação em um novo projeto do Supabase:

1. Crie um projeto no Supabase.
2. Vá em **SQL Editor** no painel da esquerda do Supabase.
3. Copie todo o conteúdo de `supabase_schema.sql` e execute o comando run. Isso criará automaticamente as tabelas `profiles`, `shifts`, `sobreaviso`, `vacations` e o usuário `admin`/`admin`.
4. Obtenha a **URL da API** e a **Public Anon Key** no painel e substitua as variáveis em `config.js`:
   ```javascript
   window.env = {
       SUPABASE_URL: "https://seu-projeto.supabase.co",
       SUPABASE_KEY: "sua-chave-anon-public"
   };
   ```

---

## 👤 Credenciais de Acesso Inicial

* **Usuário**: `admin`
* **Senha**: `admin`
* *Nota: Perfis NOC adicionais criados no gerenciador de perfis possuem senha padrão `admin` ou a cadastrada pelo administrador.*
