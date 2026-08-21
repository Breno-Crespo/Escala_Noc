document.addEventListener('DOMContentLoaded', async () => {
    // 1. Relógio do Sistema (Padrão de Localização - 24 horas pt-BR)
    const clockElement = document.getElementById('system-clock');
    
    function updateClock() {
        const now = new Date();
        clockElement.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    
    updateClock();
    setInterval(updateClock, 1000);

    // 2. Navegação entre Abas (Views SPA)
    const menuLinks = document.querySelectorAll('.sidebar-menu a[data-target]');
    const viewSections = document.querySelectorAll('.view-section');
    const pageMainTitle = document.getElementById('page-main-title');
    const pageMainSubtitle = document.getElementById('page-main-subtitle');

    const viewDetails = {
        'view-dashboard': {
            title: 'Dashboard Operacional — Ufinet',
            subtitle: 'Métricas consolidadas de escalas e conformidade'
        },
        'view-turnos-noc': {
            title: 'Escala NOC — Visualização e Gestão',
            subtitle: 'Escala mensal & de equipes integrada'
        },
        'view-sobreaviso': {
            title: 'Escala de Sobreaviso — NOC',
            subtitle: 'Equipe de retaguarda e plantonistas de prontidão'
        },
        'view-controle-ferias': {
            title: 'Controle de Férias — NOC',
            subtitle: 'Planejamento e programação de férias das equipes'
        },
        'view-manage-profiles': {
            title: 'Gerenciamento de Perfis e Colaboradores',
            subtitle: 'Área do Administrador para criação de acessos e equipes'
        },
        'view-minha-escala': {
            title: 'Minha Escala',
            subtitle: 'Calendário individual de turnos, folgas e sobreavisos'
        }
    };

    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            if (!targetId) return;

            navigateToTab(targetId);
        });
    });

    function navigateToTab(targetId) {
        closePopover();

        // Alternar classes de links ativos
        document.querySelectorAll('.sidebar-menu a').forEach(a => {
            a.classList.remove('active');
            a.classList.remove('active-parent');
        });
        document.querySelectorAll('.menu-item').forEach(li => {
            li.classList.remove('expanded');
        });

        // Encontrar o link e ativá-lo
        const activeLink = document.querySelector(`.sidebar-menu a[data-target="${targetId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
            const parentLi = activeLink.closest('.menu-item');
            const parentLink = parentLi ? parentLi.querySelector('.menu-link') : null;
            if (parentLink && parentLink !== activeLink) {
                parentLink.classList.add('active-parent');
                parentLi.classList.add('expanded');
            } else if (parentLi && parentLi.querySelector('.submenu')) {
                parentLi.classList.add('expanded');
            }
        }

        // Alternar views visíveis
        viewSections.forEach(section => {
            if (section.id === targetId) {
                section.classList.add('active-view');
            } else {
                section.classList.remove('active-view');
            }
        });

        // Atualizar textos de títulos do cabeçalho
        const info = viewDetails[targetId];
        if (info) {
            pageMainTitle.textContent = info.title;
            pageMainSubtitle.textContent = info.subtitle;
        }

        // Recarregar os dados para manter o dashboard sincronizado ao navegar!
        if (targetId === 'view-dashboard') {
            updateDashboardMetrics();
        }
        if (targetId === 'view-minha-escala') {
            renderMinhaEscala();
        }
    }

    // 3. Busca por Funcionário (Aba Turnos NOC)
    const searchInput = document.getElementById('search-employee');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            applyTurnosNocFilters();
        });
    }

    // 4. Filtro por Equipe (Aba Turnos NOC)
    const teamSelect = document.getElementById('filter-team');
    if (teamSelect) {
        teamSelect.addEventListener('change', () => {
            applyTurnosNocFilters();
        });
    }

    function applyTurnosNocFilters() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const selectedTeam = teamSelect ? teamSelect.value : 'all';
        
        const tbody = document.getElementById('turnos-noc-tbody');
        if (!tbody) return;

        const currentEmployeeRows = tbody.querySelectorAll('.employee-row');
        const categoryRows = tbody.querySelectorAll('.category-row');

        currentEmployeeRows.forEach(row => {
            const employeeName = row.querySelector('.col-employee').textContent.toLowerCase();
            const rowTeam = row.getAttribute('data-team');
            
            const matchesSearch = employeeName.includes(searchTerm);
            const matchesTeam = (selectedTeam === 'all' || rowTeam === selectedTeam);

            if (matchesSearch && matchesTeam) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });

        // Se uma categoria não possuir linhas visíveis, ela também fica oculta
        categoryRows.forEach(catRow => {
            const isN1Cat = catRow.textContent.includes('Colaboradores N1');
            const isTorreCat = catRow.textContent.includes('Colaboradores Torre de Controle');
            const nextRows = getNextEmployeeRows(catRow);
            
            const hasVisibleRow = nextRows.some(row => row.style.display !== 'none');
            
            let shouldShow = false;
            if (selectedTeam === 'all') {
                shouldShow = hasVisibleRow || searchTerm === '';
            } else if (selectedTeam === 'n1' && isN1Cat) {
                shouldShow = hasVisibleRow || searchTerm === '';
            } else if (selectedTeam === 'torre' && isTorreCat) {
                shouldShow = hasVisibleRow || searchTerm === '';
            }

            catRow.style.display = shouldShow ? '' : 'none';
        });
    }

    function getNextEmployeeRows(catRow) {
        const rows = [];
        let next = catRow.nextElementSibling;
        while (next && !next.classList.contains('category-row')) {
            if (next.classList.contains('employee-row')) {
                rows.push(next);
            }
            next = next.nextElementSibling;
        }
        return rows;
    }

    // 5. Autenticação e Login / Logout (VALIDADO CONTRA BANCO DE DADOS)
    const loginForm = document.getElementById('login-form');
    const btnLogin = document.getElementById('btn-login');
    const btnLogout = document.getElementById('btn-logout');
    
    if (loginForm) {
        loginForm.addEventListener('submit', () => {
            const userVal = document.getElementById('login-username').value.toLowerCase().trim();
            const passVal = document.getElementById('login-password').value;
            const btnSpan = btnLogin.querySelector('span');
            
            btnLogin.disabled = true;
            btnSpan.textContent = 'Autenticando...';
            
            setTimeout(async () => {
                let matched = null;
                if (supabaseClient) {
                    try {
                        const { data, error } = await supabaseClient.rpc('verify_profile_login', {
                            p_username: userVal,
                            p_password: passVal
                        });
                        if (!error && data && data.length > 0) {
                            matched = data[0];
                        }
                    } catch (e) {
                        console.error("Erro na autenticação RPC do Supabase:", e);
                    }
                }

                if (!matched) {
                    // Fallback offline / localStorage
                    const localProfiles = JSON.parse(localStorage.getItem('ufinet_profiles')) || [];
                    matched = localProfiles.find(p => p.username.toLowerCase().trim() === userVal && (p.password === passVal || (userVal === 'admin' && passVal === 'admin')));
                }

                if (matched) {
                    // Salvar sessão persistente
                    localStorage.setItem('ufinet_session', JSON.stringify({
                        id: matched.id,
                        name: matched.name,
                        username: matched.username,
                        role: matched.role,
                        team: matched.team,
                        oncall: matched.oncall
                    }));

                    profileSelect.value = matched.role;
                    applyProfilePermissions();
                    
                    document.body.classList.remove('logged-out');
                    
                    userNameDisplay.textContent = matched.name;
                    avatarLetters.textContent = matched.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                    
                    const roleText = {
                        'coordenador': 'Coordenador (Admin)',
                        'noc': 'Analista NOC',
                        'rh': 'Analista de RH'
                    };
                    userRoleDisplay.textContent = roleText[matched.role] || 'Operador';

                    if (matched.role === 'coordenador') {
                        navigateToTab('view-dashboard');
                    } else {
                        navigateToTab('view-minha-escala');
                    }
                    showToast(`Bem-vindo, ${matched.name}! Acesso concedido.`, 'success');
                } else {
                    showToast('Usuário ou senha incorretos! Tente novamente.', 'error');
                }
                
                btnLogin.disabled = false;
                btnSpan.textContent = 'Entrar no Sistema';
            }, 800);
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            
            localStorage.removeItem('ufinet_session');
            document.body.classList.add('logged-out');
            if (loginForm) loginForm.reset();
            
            showToast('Sessão encerrada com sucesso.', 'info');
        });
    }

    // 6. Gestão de Perfis de Acesso e Exibições Condicionais
    const profileSelect = document.getElementById('profile-select');
    const accessBadge = document.getElementById('access-badge');
    const editHelper = document.querySelector('.helper-text-edit');
    
    const avatarLetters = document.getElementById('avatar-letters');
    const userNameDisplay = document.getElementById('user-display-name');
    const userRoleDisplay = document.getElementById('user-display-role');

    // Elementos de Solicitação de Férias e Layout
    const vacationLayoutContainer = document.getElementById('vacation-layout-container');
    const vacationRequestCard = document.getElementById('vacation-request-card');

    // Popover de Seleção de Turno
    const popover = document.getElementById('shift-popover');
    const popoverOptions = popover.querySelector('.popover-options');
    let activeCell = null;

    const shiftClasses = {
        '9h-18h': 'status-09h-18h',
        '09h-18h': 'status-09h-18h',
        '9h ~ 18h': 'status-09h-18h',
        '7h-16h': 'status-7h-16h',
        '13h-22h': 'status-blue-shift',
        '10h-19h': 'status-blue-shift',
        '13H - 22H': 'status-blue-shift',
        '12h-21h': 'status-yellow-shift',
        '12H-21H': 'status-yellow-shift',
        '13h-21h': 'status-yellow-shift',
        '18h-22h': 'status-orange-shift',
        '18H-22H': 'status-orange-shift',
        '17h-22h': 'status-orange-shift',
        '17H-22H': 'status-orange-shift',
        '16h-22h': 'status-orange-shift',
        '14h-22h': 'status-orange-shift',
        '14h ~ 22h': 'status-orange-shift',
        '21h-07h': 'status-green-shift',
        '21h-06h': 'status-green-shift',
        '22h-07h': 'status-green-shift',
        '22h-07:48h': 'status-green-shift',
        '22h-07:48hs': 'status-green-shift',
        '12:12h-22h': 'status-gray-shift',
        '15H - 00H': 'status-yellow-shift',
        '15h-00h': 'status-yellow-shift',
        'FÉRIAS': 'status-ferias',
        'Atestado': 'status-atestado',
        'Folga': 'status-folga',
        'SOBREAVISO': 'status-sobreaviso'
    };

    const listShifts = [
        '9h-18h', '7h-16h', '09h-21h', '07h-19h', '19h-7h',
        '12h-21h', '13h-21h', '13h-22h', '14h-22h', '9h ~ 18h',
        '14h ~ 22h', '12:12h-22h', '22h-07h', '21h-07h',
        '22h-07:48h', '15H - 00H', '13H - 22H', 'FÉRIAS',
        'Atestado', 'Folga', 'SOBREAVISO'
    ];

    // Popula o Popover
    listShifts.forEach(shift => {
        const btn = document.createElement('button');
        btn.className = 'popover-option-btn';
        
        const dot = document.createElement('span');
        dot.className = `popover-color-dot ${shiftClasses[shift] || 'status-folga'}`;
        
        const text = document.createElement('span');
        text.textContent = shift;
        
        btn.appendChild(dot);
        btn.appendChild(text);
        
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (activeCell) {
                const oldShift = activeCell.textContent.trim();
                if (oldShift !== shift) {
                    const hasSat = activeCell.classList.contains('col-weekend-sat');
                    const hasSun = activeCell.classList.contains('col-weekend-sun');
                    
                    activeCell.className = '';
                    
                    if (profileSelect.value === 'coordenador') {
                        activeCell.classList.add('editable');
                    }
                    if (hasSat) activeCell.classList.add('col-weekend-sat');
                    if (hasSun) activeCell.classList.add('col-weekend-sun');

                    let newClass = 'status-default-shift';
                    if (shift === 'Folga') {
                        newClass = 'status-folga';
                    } else if (shift === 'FÉRIAS') {
                        newClass = 'status-ferias';
                    } else if (shift === 'Atestado') {
                        newClass = 'status-atestado';
                    }
                    activeCell.classList.add(newClass);
                    activeCell.textContent = shift;
                    const username = activeCell.parentElement.getAttribute('data-username');
                    const displayName = activeCell.parentElement.querySelector('.col-employee').textContent.split('(')[0].trim();
                    const isSobre = activeCell.closest('#view-sobreaviso') !== null;
                    const cells = Array.from(activeCell.parentElement.children);
                    const day = cells.indexOf(activeCell);

                    if (isSobre) {
                        const year = parseInt(filterSobreYear.value);
                        const month = parseInt(filterSobreMonth.value);
                        await dbSaveShift(true, username, year, month, day, shift);
                    } else {
                        const year = parseInt(filterNocYear.value);
                        const month = parseInt(filterNocMonth.value);
                        await dbSaveShift(false, username, year, month, day, shift);
                    }
                    
                    showToast(`Turno de ${displayName} alterado para: ${shift}`, 'success');
                    updateDashboardMetrics();
                }
                closePopover();
            }
        });
        
        popoverOptions.appendChild(btn);
    });

    // ================= HORÁRIO PERSONALIZADO DO POPOVER =================
    const btnSaveCustomShift = document.getElementById('btn-save-custom-shift');
    const customShiftInput = document.getElementById('custom-shift-input');

    async function saveCustomShift(shift) {
        if (!activeCell) return;
        shift = shift.trim();
        if (!shift) {
            showToast('Por favor, digite um turno válido!', 'error');
            return;
        }

        const oldShift = activeCell.textContent.trim();
        if (oldShift !== shift) {
            const hasSat = activeCell.classList.contains('col-weekend-sat');
            const hasSun = activeCell.classList.contains('col-weekend-sun');

            activeCell.className = '';
            if (profileSelect.value === 'coordenador') {
                activeCell.classList.add('editable');
            }
            if (hasSat) activeCell.classList.add('col-weekend-sat');
            if (hasSun) activeCell.classList.add('col-weekend-sun');

            let newClass = 'status-default-shift';
            if (shift === 'Folga') {
                newClass = 'status-folga';
            } else if (shift === 'FÉRIAS') {
                newClass = 'status-ferias';
            } else if (shift === 'Atestado') {
                newClass = 'status-atestado';
            }
            activeCell.classList.add(newClass);
            activeCell.textContent = shift;

            const username = activeCell.parentElement.getAttribute('data-username');
            const displayName = activeCell.parentElement.querySelector('.col-employee').textContent.split('(')[0].trim();
            const isSobre = activeCell.closest('#view-sobreaviso') !== null;
            const cells = Array.from(activeCell.parentElement.children);
            const day = cells.indexOf(activeCell);

            if (isSobre) {
                const year = parseInt(filterSobreYear.value);
                const month = parseInt(filterSobreMonth.value);
                await dbSaveShift(true, username, year, month, day, shift);
            } else {
                const year = parseInt(filterNocYear.value);
                const month = parseInt(filterNocMonth.value);
                await dbSaveShift(false, username, year, month, day, shift);
            }
            
            showToast(`Turno de ${displayName} alterado para: ${shift}`, 'success');
            updateDashboardMetrics();
        }
        closePopover();
    }

    if (btnSaveCustomShift && customShiftInput) {
        btnSaveCustomShift.addEventListener('click', (e) => {
            e.stopPropagation();
            saveCustomShift(customShiftInput.value);
        });

        customShiftInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                saveCustomShift(customShiftInput.value);
            }
        });
    }

    function closePopover() {
        if (popover) popover.style.display = 'none';
        activeCell = null;
        if (customShiftInput) customShiftInput.value = '';
    }

    function applyProfilePermissions() {
        const activeProfile = profileSelect.value;
        closePopover();

        const savedSession = JSON.parse(localStorage.getItem('ufinet_session'));
        const operatorMenu = document.getElementById('menu-operator-agenda');
        if (operatorMenu) {
            if (savedSession && (savedSession.role === 'noc' || savedSession.role === 'rh')) {
                operatorMenu.style.display = 'block';
            } else {
                operatorMenu.style.display = 'none';
            }
        }
        
        const currentShiftCells = document.querySelectorAll('.schedule-table tbody td:not(.col-employee):not([colspan])');
        
        if (activeProfile === 'coordenador') {
            if (accessBadge) {
                accessBadge.textContent = 'Acesso Coordenador (Edição e Aprovação)';
                accessBadge.className = 'card-tag status-ready';
            }
            if (editHelper) {
                editHelper.textContent = '* Dê um clique em qualquer célula de turno para editá-la (Perfil Coordenador).';
                editHelper.style.display = 'block';
            }
            
            currentShiftCells.forEach(cell => {
                cell.classList.add('editable');
            });

            const adminMenu = document.getElementById('menu-admin-profiles');
            if (adminMenu) adminMenu.style.display = 'block';

            document.querySelectorAll('.admin-only-header').forEach(el => el.style.display = 'table-cell');
            document.querySelectorAll('.admin-only-actions').forEach(el => el.style.display = 'table-cell');

            if (vacationLayoutContainer) vacationLayoutContainer.classList.remove('noc-layout');
            if (vacationRequestCard) vacationRequestCard.style.display = 'none';
        } else {
            if (editHelper) editHelper.style.display = 'none';
            currentShiftCells.forEach(cell => {
                cell.classList.remove('editable');
            });

            const adminMenu = document.getElementById('menu-admin-profiles');
            if (adminMenu) adminMenu.style.display = 'none';

            document.querySelectorAll('.admin-only-header').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.admin-only-actions').forEach(el => el.style.display = 'none');

            if (activeProfile === 'noc') {
                if (accessBadge) {
                    accessBadge.textContent = 'Visualização (NOC)';
                    accessBadge.className = 'card-tag status-9h18h';
                }
                if (vacationLayoutContainer) vacationLayoutContainer.classList.add('noc-layout');
                if (vacationRequestCard) vacationRequestCard.style.display = 'block';
            } else if (activeProfile === 'rh') {
                if (accessBadge) {
                    accessBadge.textContent = 'Visualização (RH)';
                    accessBadge.className = 'card-tag status-ferias';
                }
                if (vacationLayoutContainer) vacationLayoutContainer.classList.remove('noc-layout');
                if (vacationRequestCard) vacationRequestCard.style.display = 'none';
            }
        }

        renderVacationsList();
    }

    // Ouvinte para abrir popover nas células da escala (Turnos NOC E Sobreaviso) via Delegação de Eventos!
    document.addEventListener('click', (e) => {
        const cell = e.target.closest('#view-turnos-noc .schedule-table tbody td:not(.col-employee):not([colspan]), #view-sobreaviso .schedule-table tbody td:not(.col-employee):not([colspan])');
        if (!cell) return;

        const activeProfile = profileSelect.value;
        if (activeProfile !== 'coordenador') return;

        e.stopPropagation();
        
        if (activeCell === cell) {
            closePopover();
            return;
        }
        
        activeCell = cell;

        const isSobreavisoTable = cell.closest('#view-sobreaviso') !== null;
        const optionButtons = popoverOptions.querySelectorAll('.popover-option-btn');
        optionButtons.forEach(btn => {
            const text = btn.textContent.trim();
            if (isSobreavisoTable) {
                if (text === 'SOBREAVISO' || text === 'Folga') {
                    btn.style.display = 'flex';
                } else {
                    btn.style.display = 'none';
                }
            } else {
                if (text === 'SOBREAVISO') {
                    btn.style.display = 'none';
                } else {
                    btn.style.display = 'flex';
                }
            }
        });

        if (customShiftInput) {
            customShiftInput.value = cell.textContent.trim();
        }

        const rect = cell.getBoundingClientRect();
        popover.style.display = 'block';
        
        const popoverHeight = popover.offsetHeight || 320;
        const popoverWidth = popover.offsetWidth || 220;
        
        let top = rect.bottom;
        if (top + popoverHeight > window.innerHeight) {
            top = rect.top - popoverHeight;
            if (top < 0) {
                top = 10;
            }
        }
        
        let left = rect.left;
        if (left + popoverWidth > window.innerWidth) {
            left = rect.right - popoverWidth;
        }
        if (left < 0) {
            left = 10;
        }
        
        popover.style.top = `${top}px`;
        popover.style.left = `${left}px`;
    });

    document.addEventListener('dblclick', (e) => {
        const cell = e.target.closest('#view-turnos-noc .schedule-table tbody td:not(.col-employee):not([colspan]), #view-sobreaviso .schedule-table tbody td:not(.col-employee):not([colspan])');
        if (!cell) return;

        const activeProfile = profileSelect.value;
        if (activeProfile !== 'coordenador') {
            showToast('Seu perfil não possui permissão para editar turnos na escala.', 'error');
        }
    });

    document.addEventListener('click', (e) => {
        if (popover && !popover.contains(e.target) && !e.target.closest('td')) {
            closePopover();
        }
    });

    const tableScrollContainers = document.querySelectorAll('.table-scroll-container');
    tableScrollContainers.forEach(container => {
        container.addEventListener('scroll', closePopover);
    });
    window.addEventListener('scroll', closePopover);

    // ================= BANCO DE DADOS EM MEMÓRIA PARA ESCALAS =================
    const shiftDatabase = {};
    const sobreavisoDatabase = {};

    // ================= INTEGRAÇÃO SUPABASE CLOUD (VIA CONFIG.JS BYPASS PROTOCOL) =================
    let supabaseClient = null;
    const supabaseStatusBanner = document.getElementById('supabase-status-banner');

    async function configureSupabase() {
        const env = window.env; // Carregado do config.js para burlar restrições file:// do navegador!
        if (env && env.SUPABASE_URL && env.SUPABASE_KEY && window.supabase) {
            try {
                let cleanUrl = env.SUPABASE_URL.trim();
                cleanUrl = cleanUrl.replace(/\/rest\/v1\/?$/, "");
                
                supabaseClient = window.supabase.createClient(cleanUrl, env.SUPABASE_KEY.trim());
                if (supabaseStatusBanner) {
                    supabaseStatusBanner.innerHTML = `<span class="card-tag status-ready" style="font-size:11px; padding:4px 8px;">Estado: Conectado ao Supabase Cloud ☁️</span>`;
                }
            } catch (err) {
                console.error("Erro ao inicializar o Supabase:", err);
                supabaseClient = null;
            }
        }
        if (!supabaseClient) {
            if (supabaseStatusBanner) {
                supabaseStatusBanner.innerHTML = `<span class="card-tag status-folga" style="font-size:11px; padding:4px 8px;">Estado: Local (Offline - fallback localStorage ativo)</span>`;
            }
        }
    }

    async function dbGetProfiles() {
        if (supabaseClient) {
            try {
                const { data, error } = await supabaseClient.from('profiles').select('*');
                if (!error && data) return data;
                console.error("Erro Supabase GetProfiles:", error);
            } catch (e) {
                console.error(e);
            }
        }
        return JSON.parse(localStorage.getItem('ufinet_profiles')) || [];
    }

    async function dbSaveProfile(prof) {
        // Gravar no localStorage (Fallback/Cache local imediato)
        const profiles = JSON.parse(localStorage.getItem('ufinet_profiles')) || [];
        const index = profiles.findIndex(p => p.id === prof.id);
        if (index !== -1) {
            profiles[index] = prof;
        } else {
            profiles.push(prof);
        }
        localStorage.setItem('ufinet_profiles', JSON.stringify(profiles));

        // Gravar no Supabase (Nuvem)
        if (supabaseClient) {
            try {
                const { error } = await supabaseClient.from('profiles').upsert([prof]);
                if (error) console.error("Erro Supabase SaveProfile:", error);
            } catch (e) {
                console.error("Erro Supabase SaveProfile:", e);
            }
        }
    }

    async function dbDeleteProfile(id) {
        const profiles = JSON.parse(localStorage.getItem('ufinet_profiles')) || [];
        const prof = profiles.find(p => p.id === id);
        const employeeName = prof ? prof.name : null;

        // 1. Deletar do localStorage
        const updated = profiles.filter(p => p.id !== id);
        localStorage.setItem('ufinet_profiles', JSON.stringify(updated));

        // 2. Limpar e deletar férias relacionadas a esse colaborador (local e nuvem)
        if (employeeName) {
            const vacations = JSON.parse(localStorage.getItem('ufinet_vacations')) || [];
            const cleanName = employeeName.split('(')[0].trim().toLowerCase();
            const updatedVacations = vacations.filter(v => v.name.split('(')[0].trim().toLowerCase() !== cleanName);
            localStorage.setItem('ufinet_vacations', JSON.stringify(updatedVacations));

            if (supabaseClient) {
                try {
                    const { error } = await supabaseClient.from('vacations').delete().ilike('name', `%${cleanName}%`);
                    if (error) console.error("Erro Supabase Delete Vacations Relacionadas:", error);
                } catch (e) {
                    console.error(e);
                }
            }
        }

        // 3. Deletar perfil do Supabase (sempre executado)
        if (supabaseClient) {
            try {
                const { error } = await supabaseClient.from('profiles').delete().eq('id', id);
                if (error) console.error("Erro Supabase DeleteProfile:", error);
            } catch (e) {
                console.error("Erro Supabase DeleteProfile:", e);
            }
        }
    }

    async function dbGetShifts(isSobreaviso) {
        const table = isSobreaviso ? 'sobreaviso' : 'shifts';
        if (supabaseClient) {
            try {
                const { data, error } = await supabaseClient.from(table).select('*');
                if (!error && data) {
                    const mapped = {};
                    data.forEach(row => {
                        mapped[`${row.employee_name}|${row.year}|${row.month}|${row.day}`] = row.shift;
                    });
                    return mapped;
                }
                console.error(`Erro Supabase GetShifts (${table}):`, error);
            } catch (e) {
                console.error(e);
            }
        }
        const localKey = isSobreaviso ? 'ufinet_sobreaviso' : 'ufinet_shifts';
        return JSON.parse(localStorage.getItem(localKey)) || {};
    }

    async function dbSaveShift(isSobreaviso, employee_name, year, month, day, shift) {
        const key = `${employee_name}|${year}|${month}|${day}`;
        const db = isSobreaviso ? sobreavisoDatabase : shiftDatabase;
        const oldShift = db[key] || 'Folga';

        if (isSobreaviso) {
            sobreavisoDatabase[key] = shift;
            localStorage.setItem('ufinet_sobreaviso', JSON.stringify(sobreavisoDatabase));
        } else {
            shiftDatabase[key] = shift;
            localStorage.setItem('ufinet_shifts', JSON.stringify(shiftDatabase));
        }

        // Gravar log se houve alteração real
        if (oldShift !== shift) {
            const operatorSession = JSON.parse(localStorage.getItem('ufinet_session')) || { name: 'Sistema / Seeding' };
            const typeText = isSobreaviso ? 'Sobreaviso' : 'Escala NOC';
            const formattedDate = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
            await dbSaveAuditLog(operatorSession.name, `${employee_name} (${typeText})`, formattedDate, oldShift, shift);
        }

        const table = isSobreaviso ? 'sobreaviso' : 'shifts';
        if (supabaseClient) {
            try {
                const { error } = await supabaseClient.from(table).upsert([{
                    employee_name, year, month, day, shift
                }], { onConflict: 'employee_name,year,month,day' });
                if (error) console.error(`Erro Supabase SaveShift (${table}):`, error);
            } catch (e) {
                console.error("Erro Supabase SaveShift:", e);
            }
        }
    }

    async function dbGetVacations() {
        if (supabaseClient) {
            try {
                const { data, error } = await supabaseClient.from('vacations').select('*');
                if (!error && data) {
                    return data.map(row => ({
                        id: row.id,
                        name: row.name,
                        period: row.period,
                        days: row.days,
                        status: row.status,
                        month: row.month,
                        statusClass: row.status_class,
                        approvedByAdmin: row.approved_by_admin
                    }));
                }
                console.error("Erro Supabase GetVacations:", error);
            } catch (e) {
                console.error(e);
            }
        }
        return JSON.parse(localStorage.getItem('ufinet_vacations')) || [];
    }

    async function dbSaveVacation(vac) {
        // Gravar no localStorage
        const vacations = JSON.parse(localStorage.getItem('ufinet_vacations')) || [];
        const index = vacations.findIndex(v => v.id === vac.id);
        if (index !== -1) {
            vacations[index] = vac;
        } else {
            vacations.push(vac);
        }
        localStorage.setItem('ufinet_vacations', JSON.stringify(vacations));

        // Gravar no Supabase
        const dbVac = {
            id: vac.id,
            name: vac.name,
            period: vac.period,
            days: vac.days,
            status: vac.status,
            month: vac.month,
            status_class: vac.statusClass,
            approved_by_admin: vac.approvedByAdmin
        };
        if (supabaseClient) {
            try {
                const { error } = await supabaseClient.from('vacations').upsert([dbVac]);
                if (error) console.error("Erro Supabase SaveVacation:", error);
            } catch (e) {
                console.error("Erro Supabase SaveVacation:", e);
            }
        }
    }

    function initDatabase() {
        // ================= MIGRAÇÃO LOCALSTORAGE CHAVES DE ESCALA (NAME -> USERNAME) =================
        const nameToUsernameMap = {
            'Coordenador Admin': 'admin',
            'Ericles Sousa': 'ericles.sousa',
            'Maxwel Dantas': 'maxwel.dantas',
            'Cassia': 'cassia',
            'Emerson Silva': 'emerson.silva',
            'Pedro': 'pedro',
            'Allan Martins': 'allan.martins',
            'Felipe Ribeiro': 'felipe.ribeiro',
            'Jorge Luiz': 'jorge.luiz',
            'Dariel Souza': 'dariel.souza',
            'Eduardo Pereira': 'eduardo.pereira',
            'Leandro': 'leandro',
            'Rodolfo Gomes': 'rodolfo.gomes',
            'Thiago Silva': 'thiago.silva',
            'Juliano (RJ)': 'juliano',
            'Raphael (RJ) 22:00 ~ 07:48hs': 'raphael',
            'Breno (RJ) 12:12 ~ 22hs': 'breno',
            'Bruno Landra': 'bruno.landra',
            'Eduardo Leite': 'eduardo.leite'
        };

        function migrateLocalKey(keyName) {
            try {
                const localData = JSON.parse(localStorage.getItem(keyName));
                if (!localData) return;
                const migrated = {};
                let hasChange = false;
                for (let key in localData) {
                    const parts = key.split('|');
                    if (parts.length === 4) {
                         const name = parts[0];
                         const username = nameToUsernameMap[name];
                         if (username) {
                             migrated[`${username}|${parts[1]}|${parts[2]}|${parts[3]}`] = localData[key];
                             hasChange = true;
                         } else {
                             migrated[key] = localData[key];
                         }
                    } else {
                        migrated[key] = localData[key];
                    }
                }
                if (hasChange) {
                    localStorage.setItem(keyName, JSON.stringify(migrated));
                }
            } catch (e) {
                console.error("Erro ao migrar localstorage:", e);
            }
        }
        migrateLocalKey('ufinet_shifts');
        migrateLocalKey('ufinet_sobreaviso');

        // Marcamos o banco como semeado para nunca restabelecer usuários deletados em logins subsequentes!
        const isSeeded = localStorage.getItem('ufinet_db_seeded') === 'true';

        // Seeding Inicial de Perfis/Contas (conforme visual original do Excel) - Executado apenas uma vez!
        if (!isSeeded && (!localStorage.getItem('ufinet_profiles') || JSON.parse(localStorage.getItem('ufinet_profiles')).length === 0)) {
            const initialProfiles = [
                { id: 'profile-row-admin-initial', name: 'Coordenador Admin', username: 'admin', role: 'coordenador', team: 'torre', oncall: 'nao', password: 'admin' },
                { id: 'profile-ericles', name: 'Ericles Sousa', username: 'ericles.sousa', role: 'noc', team: 'n1', oncall: 'nao', password: 'admin' },
                { id: 'profile-maxwel', name: 'Maxwel Dantas', username: 'maxwel.dantas', role: 'noc', team: 'n1', oncall: 'nao', password: 'admin' },
                { id: 'profile-cassia', name: 'Cassia', username: 'cassia', role: 'noc', team: 'n1', oncall: 'nao', password: 'admin' },
                { id: 'profile-emerson', name: 'Emerson Silva', username: 'emerson.silva', role: 'noc', team: 'n1', oncall: 'nao', password: 'admin' },
                { id: 'profile-pedro', name: 'Pedro', username: 'pedro', role: 'noc', team: 'n1', oncall: 'nao', password: 'admin' },
                { id: 'profile-allan', name: 'Allan Martins', username: 'allan.martins', role: 'noc', team: 'n1', oncall: 'nao', password: 'admin' },
                { id: 'profile-felipe', name: 'Felipe Ribeiro', username: 'felipe.ribeiro', role: 'noc', team: 'n1', oncall: 'nao', password: 'admin' },
                { id: 'profile-jorge', name: 'Jorge Luiz', username: 'jorge.luiz', role: 'noc', team: 'torre', oncall: 'nao', password: 'admin' },
                { id: 'profile-dariel', name: 'Dariel Souza', username: 'dariel.souza', role: 'noc', team: 'torre', oncall: 'nao', password: 'admin' },
                { id: 'profile-eduardop', name: 'Eduardo Pereira', username: 'eduardo.pereira', role: 'noc', team: 'torre', oncall: 'nao', password: 'admin' },
                { id: 'profile-leandro', name: 'Leandro', username: 'leandro', role: 'noc', team: 'torre', oncall: 'nao', password: 'admin' },
                { id: 'profile-rodolfo', name: 'Rodolfo Gomes', username: 'rodolfo.gomes', role: 'noc', team: 'torre', oncall: 'nao', password: 'admin' },
                { id: 'profile-thiago', name: 'Thiago Silva', username: 'thiago.silva', role: 'noc', team: 'torre', oncall: 'nao', password: 'admin' },
                { id: 'profile-juliano', name: 'Juliano (RJ)', username: 'juliano', role: 'noc', team: 'torre', oncall: 'nao', password: 'admin' },
                { id: 'profile-raphael', name: 'Raphael (RJ) 22:00 ~ 07:48hs', username: 'raphael', role: 'noc', team: 'torre', oncall: 'nao', password: 'admin' },
                { id: 'profile-brenorj', name: 'Breno (RJ) 12:12 ~ 22hs', username: 'breno', role: 'noc', team: 'torre', oncall: 'nao', password: 'admin' },
                { id: 'profile-bruno-l', name: 'Bruno Landra', username: 'bruno.landra', role: 'noc', team: 'n1', oncall: 'sim', password: 'admin' },
                { id: 'profile-eduardo-l', name: 'Eduardo Leite', username: 'eduardo.leite', role: 'noc', team: 'torre', oncall: 'sim', password: 'admin' }
            ];
            localStorage.setItem('ufinet_profiles', JSON.stringify(initialProfiles));
        }

        // Seeding Inicial de Escala NOC - Todos iniciam com Folga
        if (!isSeeded && (!localStorage.getItem('ufinet_shifts') || Object.keys(JSON.parse(localStorage.getItem('ufinet_shifts'))).length === 0)) {
            const initialShifts = {};
            localStorage.setItem('ufinet_shifts', JSON.stringify(initialShifts));
        }

        // Seeding Inicial de Sobreaviso - Todos iniciam com Folga
        if (!isSeeded && (!localStorage.getItem('ufinet_sobreaviso') || Object.keys(JSON.parse(localStorage.getItem('ufinet_sobreaviso'))).length === 0)) {
            const initialSobre = {};
            localStorage.setItem('ufinet_sobreaviso', JSON.stringify(initialSobre));
        }

        // Férias Iniciais - Vazio para preenchimento manual
        if (!isSeeded && !localStorage.getItem('ufinet_vacations')) {
            const initialVacations = [];
            localStorage.setItem('ufinet_vacations', JSON.stringify(initialVacations));
        }
    }

    async function loadAllDataAndRender() {
        const isCleaned = localStorage.getItem('ufinet_db_cleaned_v4') === 'true';
        if (!isCleaned) {
            localStorage.removeItem('ufinet_profiles');
            localStorage.removeItem('ufinet_shifts');
            localStorage.removeItem('ufinet_sobreaviso');
            localStorage.removeItem('ufinet_vacations');
            localStorage.setItem('ufinet_db_seeded', 'false');

            const initialProfiles = [
                { id: 'profile-row-admin-initial', name: 'Coordenador Admin', username: 'admin', role: 'coordenador', team: 'torre', oncall: 'nao', password: 'admin' },
                { id: 'profile-ericles', name: 'Ericles Sousa', username: 'ericles.sousa', role: 'noc', team: 'n1', oncall: 'nao', password: 'admin' },
                { id: 'profile-pedro', name: 'Pedro', username: 'pedro', role: 'noc', team: 'n1', oncall: 'nao', password: 'admin' },
                { id: 'profile-cassia', name: 'Cassia', username: 'cassia', role: 'noc', team: 'n1', oncall: 'nao', password: 'admin' },
                { id: 'profile-maxwel', name: 'Maxwel Dantas', username: 'maxwel.dantas', role: 'noc', team: 'n1', oncall: 'nao', password: 'admin' },
                { id: 'profile-emerson', name: 'Emerson Silva', username: 'emerson.silva', role: 'noc', team: 'n1', oncall: 'nao', password: 'admin' },
                { id: 'profile-jonathan', name: 'Jonathan (RJ)', username: 'jonathan', role: 'noc', team: 'n1', oncall: 'nao', password: 'admin' },
                { id: 'profile-allan', name: 'Allan Martins', username: 'allan.martins', role: 'noc', team: 'n1', oncall: 'nao', password: 'admin' },
                { id: 'profile-felipe', name: 'Felipe Ribeiro', username: 'felipe.ribeiro', role: 'noc', team: 'n1', oncall: 'nao', password: 'admin' },
                { id: 'profile-jorge', name: 'Jorge Luiz', username: 'jorge.luiz', role: 'noc', team: 'torre', oncall: 'nao', password: 'admin' },
                { id: 'profile-dariel', name: 'Dariel Souza', username: 'dariel.sousa', role: 'noc', team: 'torre', oncall: 'nao', password: 'admin' },
                { id: 'profile-leandro', name: 'Leandro', username: 'leandro', role: 'noc', team: 'torre', oncall: 'nao', password: 'admin' },
                { id: 'profile-eduardop', name: 'Eduardo Pereira', username: 'eduardo.pereira', role: 'noc', team: 'torre', oncall: 'nao', password: 'admin' },
                { id: 'profile-rodolfo', name: 'Rodolfo Gomes', username: 'rodolfo.gomes', role: 'noc', team: 'torre', oncall: 'nao', password: 'admin' },
                { id: 'profile-breno', name: 'Breno', username: 'breno', role: 'noc', team: 'torre', oncall: 'nao', password: 'admin' },
                { id: 'profile-raphael', name: 'Raphael (RJ)', username: 'raphael', role: 'noc', team: 'torre', oncall: 'nao', password: 'admin' },
                { id: 'profile-juliano', name: 'Juliano (RJ)', username: 'juliano', role: 'noc', team: 'torre', oncall: 'nao', password: 'admin' },
                { id: 'profile-eduardo-l', name: 'Eduardo Leite', username: 'eduardo.leite', role: 'noc', team: 'torre', oncall: 'sim', password: 'admin' },
                { id: 'profile-fabiana', name: 'Fabiana', username: 'fabiana', role: 'noc', team: 'torre', oncall: 'sim', password: 'admin' },
                { id: 'profile-claudinei', name: 'Claudinei', username: 'claudinei', role: 'noc', team: 'torre', oncall: 'sim', password: 'admin' }
            ];
            localStorage.setItem('ufinet_profiles', JSON.stringify(initialProfiles));

            const basePatterns = {
                'ericles.sousa': ['7h-16h', '7h-16h', '7h-16h', 'Folga', 'Folga', '7h-16h', '7h-16h', '7h-16h', '7h-16h', '7h-16h', '7h-16h', '7h-16h', 'Folga', '7h-16h', '7h-16h', '7h-16h', '7h-16h', 'Folga', 'Folga'],
                'pedro': ['Folga', 'Folga', '7h-16h', '7h-16h', '7h-16h', 'Folga', '7h-16h', '7h-16h', '7h-16h', '7h-16h', 'Folga', 'Folga', '7h-16h', '7h-16h', '7h-16h', 'Folga', '7h-16h', '7h-16h', '7h-16h'],
                'cassia': ['09h-18h', '09h-18h', '09h-18h', 'Folga', 'Folga', '09h-18h', '09h-18h', 'Folga', 'Folga', '09h-18h', '09h-18h', '09h-18h', 'Folga', '09h-18h', '09h-18h', '09h-18h', 'Folga', '16h-22h', 'Folga'],
                'maxwel.dantas': ['Folga', 'Folga', '13h-22h', '09h-18h', '09h-18h', 'Folga', '13h-22h', '10h-19h', '10h-19h', '09h-18h', 'Folga', 'Folga', '10h-19h', '10h-19h', 'Folga', 'Folga', '09h-18h', '09h-18h', '09h-18h'],
                'emerson.silva': ['12h-21h', '12h-21h', 'Folga', '18h-22h', '18h-22h', '12h-21h', 'Folga', '12h-21h', '12h-21h', '12h-21h', 'Folga', 'Folga', '12h-21h', 'Folga', '12h-21h', '12h-21h', '12h-21h', 'Folga', '17h-22h'],
                'jonathan': ['12:12h-22h', '12:12h-22h', 'Folga', 'Folga', 'Folga', '12:12h-22h', '12:12h-22h', 'Folga', 'Folga', '12:12h-22h', '12:12h-22h', '12:12h-22h', 'Folga', '12:12h-22h', '12:12h-22h', '12:12h-22h', 'Folga', '12:12h-22h', '12:12h-22h'],
                'allan.martins': ['21h-07h', '21h-07h', '21h-06h', 'Folga', 'Folga', '22h-07h', '21h-07h', 'Folga', 'Folga', '22h-07h', '22h-07h', '22h-07h', 'Folga', '21h-07h', '22h-07h', 'Folga', 'Folga', '21h-07h', '22h-07h'],
                'felipe.ribeiro': ['Folga', 'Folga', '22h-07h', '22h-07h', '22h-07h', 'Folga', '22h-07h', '21h-07h', '21h-07h', '22h-07h', 'Folga', 'Folga', '21h-07h', '22h-07h', 'Folga', 'Folga', '22h-07h', '22h-07h', '22h-07h'],
                'jorge.luiz': ['7h-16h', '7h-16h', '7h-16h', 'Folga', 'Folga', '7h-16h', '7h-16h', '7h-16h', '7h-16h', '7h-16h', '7h-16h', '7h-16h', 'Folga', '7h-16h', '7h-16h', '7h-16h', '7h-16h', 'Folga', 'Folga'],
                'dariel.souza': ['Folga', 'Folga', '7h-16h', '7h-16h', '7h-16h', 'Folga', '7h-16h', '7h-16h', '7h-16h', '7h-16h', 'Folga', 'Folga', '7h-16h', '7h-16h', '7h-16h', 'Folga', '7h-16h', '7h-16h', '7h-16h'],
                'leandro': ['09h-18h', '09h-18h', '09h-18h', 'Folga', 'Folga', '09h-18h', '09h-18h', 'Folga', 'Folga', '09h-18h', '09h-18h', '09h-18h', 'Folga', '09h-18h', '09h-18h', '09h-18h', 'Folga', '17h-22h', 'Folga'],
                'eduardo.pereira': ['Folga', 'Folga', '13h-22h', '09h-18h', '09h-18h', 'Folga', '13h-22h', '10h-19h', '10h-19h', '09h-18h', 'Folga', 'Folga', '09h-18h', '09h-18h', 'Folga', 'Folga', '09h-18h', '09h-18h', '09h-18h'],
                'rodolfo.gomes': ['15h-00h', '15h-00h', 'Folga', '18h-22h', '18h-22h', '15h-00h', 'Folga', '15h-00h', '15h-00h', '15h-00h', 'Folga', 'Folga', '15h-00h', '15h-00h', '15h-00h', '15h-00h', 'Folga', 'Folga', '17h-22h'],
                'breno': ['12:12h-22h', '12:12h-22h', 'Folga', 'Folga', 'Folga', '12:12h-22h', '12:12h-22h', '12:12h-22h', '12:12h-22h', '12:12h-22h', 'Folga', 'Folga', '12:12h-22h', '12:12h-22h', '12:12h-22h', '12:12h-22h', '12:12h-22h', '12:12h-22h', '12:12h-22h'],
                'raphael': ['22h-07:48h', '22h-07:48h', '22h-07:48h', 'Folga', 'Folga', '22h-07:48h', '22h-07:48h', 'Folga', 'Folga', '22h-07:48h', '22h-07:48h', '22h-07:48h', 'Folga', '22h-07:48h', '22h-07:48h', '22h-07:48h', '22h-07:48h', 'Folga', 'Folga'],
                'juliano': ['Folga', 'Folga', '22h-07h', '22h-07h', '22h-07h', 'Folga', '22h-07h', '22h-07h', '22h-07h', '22h-07h', 'Folga', 'Folga', '22h-07h', '22h-07h', 'Folga', 'Folga', '22h-07h', '22h-07h', '22h-07h']
            };

            const newShiftsData = {};
            const startDate = new Date(2026, 7, 19);
            const endDate = new Date(2026, 11, 31);
            
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const year = d.getFullYear();
                const month = d.getMonth() + 1;
                const day = d.getDate();
                const diffTime = d.getTime() - startDate.getTime();
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                const dayIndex = diffDays % 19;
                
                for (let employee in basePatterns) {
                    const shiftVal = basePatterns[employee][dayIndex];
                    const key = `${employee}|${year}|${month}|${day}`;
                    newShiftsData[key] = shiftVal;
                }
            }

            localStorage.setItem('ufinet_shifts', JSON.stringify(newShiftsData));

            if (supabaseClient) {
                try {
                    await supabaseClient.from('shifts').delete().neq('id', 0);
                    await supabaseClient.from('sobreaviso').delete().neq('id', 0);
                    await supabaseClient.from('vacations').delete().neq('id', '0');
                    await supabaseClient.from('profiles').delete().neq('id', '0');

                    // Bulk insert profiles
                    await supabaseClient.from('profiles').insert(initialProfiles);

                    // Build and bulk insert shifts in chunks of 500
                    const shiftsToInsert = [];
                    for (let key in newShiftsData) {
                        const [username, year, month, day] = key.split('|');
                        shiftsToInsert.push({
                            employee_name: username,
                            year: parseInt(year),
                            month: parseInt(month),
                            day: parseInt(day),
                            shift_value: newShiftsData[key]
                        });
                    }

                    for (let i = 0; i < shiftsToInsert.length; i += 500) {
                        const chunk = shiftsToInsert.slice(i, i + 500);
                        await supabaseClient.from('shifts').insert(chunk);
                    }
                } catch(e) {
                    console.error("Erro ao limpar e re-semear Supabase:", e);
                }
            }

            localStorage.setItem('ufinet_db_cleaned_v5', 'true');
            window.location.reload();
            return;
        }

        initDatabase();

        // 1. Carregar perfis
        let profiles = await dbGetProfiles();
        const isSeeded = localStorage.getItem('ufinet_db_seeded') === 'true';

        // Só faz a inserção inicial se o banco na nuvem estiver vazio e localmente não tivermos marcado como Seeded!
        if (supabaseClient && !isSeeded && profiles.length <= 1) {
            const localProfiles = JSON.parse(localStorage.getItem('ufinet_profiles')) || [];
            for (let prof of localProfiles) {
                await dbSaveProfile(prof);
            }
            profiles = await dbGetProfiles();
            localStorage.setItem('ufinet_db_seeded', 'true');
        } else if (profiles.length > 1) {
            // Se já existem registros, nos certificamos de salvar o flag localmente para nunca sobrescrever edições!
            localStorage.setItem('ufinet_db_seeded', 'true');
        }

        // 2. Carregar shifts e sincronizar
        const shifts = await dbGetShifts(false);
        const localShifts = JSON.parse(localStorage.getItem('ufinet_shifts')) || {};
        Object.assign(shiftDatabase, localShifts, shifts);
        
        if (supabaseClient && Object.keys(shifts).length === 0) {
            for (let key in localShifts) {
                const [employee_name, year, month, day] = key.split('|');
                await dbSaveShift(false, employee_name, parseInt(year), parseInt(month), parseInt(day), localShifts[key]);
            }
        }

        // 3. Carregar sobreaviso e sincronizar
        const sobreaviso = await dbGetShifts(true);
        const localSobre = JSON.parse(localStorage.getItem('ufinet_sobreaviso')) || {};
        Object.assign(sobreavisoDatabase, localSobre, sobreaviso);
        
        if (supabaseClient && Object.keys(sobreaviso).length === 0) {
            for (let key in localSobre) {
                const [employee_name, year, month, day] = key.split('|');
                await dbSaveShift(true, employee_name, parseInt(year), parseInt(month), parseInt(day), localSobre[key]);
            }
        }

        // 4. Carregar vacations e sincronizar
        let vacations = await dbGetVacations();
        const localVacations = JSON.parse(localStorage.getItem('ufinet_vacations')) || [];
        if (supabaseClient && vacations.length === 0) {
            for (let vac of localVacations) {
                await dbSaveVacation(vac);
            }
            vacations = await dbGetVacations();
        }

        renderProfilesListFromData(profiles);
        await renderVacationsList();
        renderTurnosNoc();
        renderSobreaviso();
        updateDashboardMetrics();
    }

    // ================= DYNAMIC DASHBOARD CALCULATIONS =================
    async function updateDashboardMetrics() {
        const profiles = await dbGetProfiles();
        const activeProfiles = profiles.length;

        // 1. Colaboradores Ativos
        const activeEmpMetric = document.querySelector('.metric-card:nth-child(1) .metric-value');
        if (activeEmpMetric) {
            activeEmpMetric.innerHTML = `${activeProfiles} <span class="metric-total">Ativos</span>`;
        }

        // 2. Turnos em Andamento (Hoje)
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;
        const currentDay = today.getDate();
        
        let workingToday = 0;
        let atestadoToday = 0;
        let n1Working = 0;
        let torreWorking = 0;

        profiles.forEach(prof => {
            // Ignora o coordenador e quem está fora da escala na rotação de turnos operacionais
            if (prof.oncall === 'nao' && prof.role !== 'coordenador') {
                const key = `${prof.username}|${currentYear}|${currentMonth}|${currentDay}`;
                const shift = shiftDatabase[key] || getVacationOrShiftDefault(prof.name, currentYear, currentMonth, currentDay, false);
                
                if (shift !== 'Folga' && shift !== 'FÉRIAS') {
                    workingToday++;
                    if (prof.team === 'n1') n1Working++;
                    else if (prof.team === 'torre') torreWorking++;
                }

                if (shift === 'Atestado') {
                    atestadoToday++;
                }
            }
        });

        const workingMetric = document.querySelector('.metric-card:nth-child(2) .metric-value');
        const workingTrend = document.querySelector('.metric-card:nth-child(2) .metric-trend');
        if (workingMetric) {
            workingMetric.innerHTML = `${workingToday} <span class="metric-total">Em Plantão</span>`;
        }
        if (workingTrend) {
            workingTrend.textContent = `${n1Working} em N1, ${torreWorking} em Torre`;
        }

        // 3. Afastamentos / Atestados
        const atestadoMetric = document.querySelector('.metric-card:nth-child(3) .metric-value');
        const atestadoTrend = document.querySelector('.metric-card:nth-child(3) .metric-trend');
        if (atestadoMetric) {
            atestadoMetric.innerHTML = `${atestadoToday} <span class="metric-total">Ativo</span>`;
        }
        if (atestadoTrend) {
            const atestadoNames = [];
            profiles.forEach(prof => {
                if (prof.oncall === 'nao' && prof.role !== 'coordenador') {
                    const key = `${prof.username}|${currentYear}|${currentMonth}|${currentDay}`;
                    const shift = shiftDatabase[key] || getVacationOrShiftDefault(prof.name, currentYear, currentMonth, currentDay, false);
                    if (shift === 'Atestado') {
                        atestadoNames.push(prof.name);
                    }
                }
            });
            atestadoTrend.textContent = atestadoNames.length > 0 ? atestadoNames.join(', ') : 'Nenhum desfalque';
        }

        // 4. Progress Bars (Cobertura & Equidade para o mês filtrado)
        let fYear = currentYear;
        let fMonth = currentMonth;
        if (filterNocYear && filterNocMonth) {
            fYear = parseInt(filterNocYear.value);
            fMonth = parseInt(filterNocMonth.value);
        }

        const daysCount = getDaysInMonth(fYear, fMonth);
        let n1CoveredDays = 0;
        let torreCoveredDays = 0;
        let weekendCoveredDays = 0;
        let totalWeekends = 0;

        for (let day = 1; day <= daysCount; day++) {
            const wdName = getWeekdayName(fYear, fMonth, day);
            const isWeekend = wdName === 'SÁB' || wdName === 'DOM';
            if (isWeekend) totalWeekends++;

            let n1WorkingOnDay = false;
            let torreWorkingOnDay = false;
            let weekendWorkingOnDay = false;

            profiles.forEach(prof => {
                if (prof.oncall === 'nao' && prof.role !== 'coordenador') {
                    const key = `${prof.username}|${fYear}|${fMonth}|${day}`;
                    const shift = shiftDatabase[key] || getVacationOrShiftDefault(prof.name, fYear, fMonth, day, false);
                    if (shift !== 'Folga' && shift !== 'FÉRIAS') {
                        if (prof.team === 'n1') n1WorkingOnDay = true;
                        if (prof.team === 'torre') torreWorkingOnDay = true;
                        if (isWeekend) weekendWorkingOnDay = true;
                    }
                }
            });

            if (n1WorkingOnDay) n1CoveredDays++;
            if (torreWorkingOnDay) torreCoveredDays++;
            if (isWeekend && weekendWorkingOnDay) weekendCoveredDays++;
        }

        const n1Pct = daysCount > 0 ? Math.round((n1CoveredDays / daysCount) * 100) : 0;
        const torrePct = daysCount > 0 ? Math.round((torreCoveredDays / daysCount) * 100) : 0;
        const weekendPct = totalWeekends > 0 ? Math.round((weekendCoveredDays / totalWeekends) * 100) : 100;

        const n1ProgressFill = document.querySelector('.progress-item:nth-child(2) .progress-bar-fill');
        const n1ProgressLabel = document.querySelector('.progress-item:nth-child(2) .progress-label span:nth-child(2)');
        if (n1ProgressFill) n1ProgressFill.style.width = `${n1Pct}%`;
        if (n1ProgressLabel) n1ProgressLabel.textContent = `${n1Pct}% Cobertura`;

        const torreProgressFill = document.querySelector('.progress-item:nth-child(3) .progress-bar-fill');
        const torreProgressLabel = document.querySelector('.progress-item:nth-child(3) .progress-label span:nth-child(2)');
        if (torreProgressFill) torreProgressFill.style.width = `${torrePct}%`;
        if (torreProgressLabel) torreProgressLabel.textContent = `${torrePct}% Cobertura`;

        const wkProgressFill = document.querySelector('.progress-item:nth-child(4) .progress-bar-fill');
        const wkProgressLabel = document.querySelector('.progress-item:nth-child(4) .progress-label span:nth-child(2)');
        if (wkProgressFill) wkProgressFill.style.width = `${weekendPct}%`;
        if (wkProgressLabel) wkProgressLabel.textContent = `${weekendPct}% Equidade`;

        // 5. Alertas de Ausências e Férias (Filtrando apenas colaboradores ativos)
        const alertsList = document.querySelector('.alert-list');
        if (alertsList) {
            alertsList.innerHTML = '';
            
            const activeNames = profiles.map(p => p.name.split('(')[0].trim().toLowerCase());

            // Férias Ativas no mês filtrado
            const vacations = await dbGetVacations();
            const activeVacations = vacations.filter(vac => {
                const cleanVacName = vac.name.split('(')[0].trim().toLowerCase();
                const isApproved = vac.approvedByAdmin === true;
                const matchesMonth = vac.month === fMonth.toString();
                const matchesUser = activeNames.includes(cleanVacName);
                const hasStarted = hasVacationStarted(vac.period);

                return isApproved && matchesMonth && matchesUser && hasStarted;
            });
            
            activeVacations.forEach(vac => {
                const li = document.createElement('li');
                li.className = 'alert-list-item warning';
                li.innerHTML = `<strong>${vac.name}</strong> em FÉRIAS programadas de ${vac.period}.`;
                alertsList.appendChild(li);
            });

            // Atestados Ativos no mês filtrado
            const atestadosThisMonth = [];
            profiles.forEach(prof => {
                if (prof.oncall === 'nao' && prof.role !== 'coordenador') {
                    for (let day = 1; day <= daysCount; day++) {
                        const key = `${prof.username}|${fYear}|${fMonth}|${day}`;
                        const shift = shiftDatabase[key];
                        if (shift === 'Atestado') {
                            if (!atestadosThisMonth.some(a => a.name === prof.name && a.day === day)) {
                                atestadosThisMonth.push({ name: prof.name, day });
                            }
                        }
                    }
                }
            });

            atestadosThisMonth.forEach(at => {
                const li = document.createElement('li');
                li.className = 'alert-list-item info';
                li.innerHTML = `<strong>${at.name}</strong> com Atestado homologado no dia ${at.day.toString().padStart(2, '0')}/${fMonth.toString().padStart(2, '0')}.`;
                alertsList.appendChild(li);
            });

            if (activeVacations.length === 0 && atestadosThisMonth.length === 0) {
                const li = document.createElement('li');
                li.className = 'alert-list-item info';
                li.style.backgroundColor = '#ecfdf5';
                li.style.borderLeftColor = '#10b981';
                li.innerHTML = `<strong>Tudo limpo!</strong> Nenhuma ausência ou férias ativas registradas para este mês.`;
                alertsList.appendChild(li);
            }
        }

        // 6. Alertas de Desfalque Operacional
        const understaffingList = document.getElementById('understaffing-alerts-list');
        if (understaffingList) {
            understaffingList.innerHTML = '';
            let desfalques = 0;
            
            for (let day = 1; day <= daysCount; day++) {
                let n1Count = 0;
                let torreCount = 0;
                
                profiles.forEach(prof => {
                    if (prof.oncall === 'nao' && prof.role !== 'coordenador') {
                        const key = `${prof.username}|${fYear}|${fMonth}|${day}`;
                        const shift = shiftDatabase[key] || getVacationOrShiftDefault(prof.name, fYear, fMonth, day, false);
                        
                        if (shift !== 'Folga' && shift !== 'FÉRIAS' && shift !== 'Atestado') {
                            if (prof.team === 'n1') n1Count++;
                            if (prof.team === 'torre') torreCount++;
                        }
                    }
                });
                
                const wdName = getWeekdayName(fYear, fMonth, day);
                const dateLabel = `${day.toString().padStart(2, '0')}/${fMonth.toString().padStart(2, '0')} (${wdName})`;
                
                if (n1Count === 0) {
                    desfalques++;
                    const li = document.createElement('li');
                    li.className = 'alert-list-item warning';
                    li.innerHTML = `⚠️ Dia <strong>${dateLabel}</strong> sem operadores no setor <strong>N1</strong>!`;
                    understaffingList.appendChild(li);
                }
                
                if (torreCount === 0) {
                    desfalques++;
                    const li = document.createElement('li');
                    li.className = 'alert-list-item warning';
                    li.innerHTML = `⚠️ Dia <strong>${dateLabel}</strong> sem operadores no setor <strong>Torre</strong>!`;
                    understaffingList.appendChild(li);
                }
            }
            
            if (desfalques === 0) {
                const li = document.createElement('li');
                li.className = 'alert-list-item info';
                li.style.backgroundColor = '#ecfdf5';
                li.style.borderLeftColor = '#10b981';
                li.innerHTML = `<strong>Cobertura Ideal!</strong> Pelo menos 1 operador ativo em todos os setores e turnos.`;
                understaffingList.appendChild(li);
            }
        }

        // 7. Relatório de Equidade (Distribuição de Turnos de Final de Semana)
        const equityBody = document.getElementById('equity-report-rows');
        if (equityBody) {
            equityBody.innerHTML = '';
            
            const stats = [];
            profiles.forEach(prof => {
                if (prof.oncall === 'nao' && prof.role !== 'coordenador') {
                    let satsCount = 0;
                    let sunsCount = 0;
                    
                    for (let day = 1; day <= daysCount; day++) {
                        const key = `${prof.username}|${fYear}|${fMonth}|${day}`;
                        const shift = shiftDatabase[key] || getVacationOrShiftDefault(prof.name, fYear, fMonth, day, false);
                        
                        if (shift !== 'Folga' && shift !== 'FÉRIAS' && shift !== 'Atestado') {
                            const wdName = getWeekdayName(fYear, fMonth, day);
                            if (wdName === 'SÁB') satsCount++;
                            if (wdName === 'DOM') sunsCount++;
                        }
                    }
                    
                    stats.push({
                        name: prof.name,
                        sats: satsCount,
                        suns: sunsCount,
                        total: satsCount + sunsCount
                    });
                }
            });
            
            stats.sort((a, b) => b.total - a.total);
            
            stats.forEach(st => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="text-align: left; padding: 8px; font-weight:700;">${st.name}</td>
                    <td style="text-align: center; padding: 8px;">${st.sats}</td>
                    <td style="text-align: center; padding: 8px;">${st.suns}</td>
                    <td style="text-align: center; padding: 8px; font-weight:700; color: #f59e0b;">${st.total}</td>
                `;
                equityBody.appendChild(tr);
            });
        }

        // 8. Histórico de Auditoria (Apenas se o coordenador estiver logado)
        const activeUser = JSON.parse(localStorage.getItem('ufinet_session'));
        if (activeUser && activeUser.role === 'coordenador') {
            const auditWidget = document.getElementById('audit-logs-widget');
            if (auditWidget) auditWidget.style.display = 'block';
            
            const auditBody = document.getElementById('audit-logs-rows');
            if (auditBody) {
                auditBody.innerHTML = '';
                const logs = await dbGetAuditLogs();
                if (logs && logs.length > 0) {
                    logs.forEach(log => {
                        const tr = document.createElement('tr');
                        const logDate = new Date(log.created_at).toLocaleString('pt-BR');
                        tr.innerHTML = `
                            <td style="text-align:left; padding:6px;">${logDate}</td>
                            <td style="text-align:left; padding:6px; font-weight:700;">${log.operator_name}</td>
                            <td style="text-align:left; padding:6px;">${log.employee_name}</td>
                            <td style="text-align:left; padding:6px;">${log.shift_date}</td>
                            <td style="text-align:center; padding:6px;"><span class="card-tag status-folga" style="font-size:10px;">${log.old_value || 'Nulo'}</span></td>
                            <td style="text-align:center; padding:6px;"><span class="card-tag status-ferias" style="font-size:10px; background-color:#dbeafe; color:#1e40af;">${log.new_value || 'Nulo'}</span></td>
                        `;
                        auditBody.appendChild(tr);
                    });
                } else {
                    auditBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:12px; color:#64748b;">Nenhuma alteração registrada.</td></tr>`;
                }
            }
        }
    }

    // ================= FUNÇÕES DE SELEÇÃO E FILTROS DE FÉRIAS =================
    const filterVacationMonth = document.getElementById('filter-vacation-month');
    const vacationRowsBody = document.getElementById('vacation-rows');

    function applyVacationMonthFilter() {
        if (!filterVacationMonth || !vacationRowsBody) return;
        const selectedMonth = filterVacationMonth.value;
        const rows = vacationRowsBody.querySelectorAll('tr');

        rows.forEach(row => {
            const rowMonth = row.getAttribute('data-month');
            if (selectedMonth === 'all' || rowMonth === selectedMonth) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    if (filterVacationMonth) {
        filterVacationMonth.addEventListener('change', applyVacationMonthFilter);
    }

    // Helper para verificar se as férias já começaram (data de início <= hoje)
    function hasVacationStarted(periodText) {
        const parts = periodText.split(' a ');
        if (parts.length === 2) {
            const startParts = parts[0].split('/');
            if (startParts.length === 3) {
                const startDate = new Date(startParts[2], startParts[1] - 1, startParts[0]);
                startDate.setHours(0, 0, 0, 0);

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                return today >= startDate;
            }
        }
        return false;
    }

    async function renderVacationsList() {
        if (!vacationRowsBody) return;

        vacationRowsBody.innerHTML = '';
        const vacations = await dbGetVacations();
        const profiles = await dbGetProfiles();

        // Filtrar férias para manter somente colaboradores ativos
        const activeNames = profiles.map(p => p.name.split('(')[0].trim().toLowerCase());
        
        // Regra de férias consolidada: exibe solicitações pendentes (para ação) E aprovadas que já começaram/passaram da data
        const filteredVacations = vacations.filter(vac => {
            const cleanVacName = vac.name.split('(')[0].trim().toLowerCase();
            const employeeExists = activeNames.includes(cleanVacName);
            if (!employeeExists) return false;

            const isPending = vac.approvedByAdmin === null || vac.approvedByAdmin === undefined;
            const isApproved = vac.approvedByAdmin === true;
            const hasStarted = hasVacationStarted(vac.period);

            return isPending || (isApproved && hasStarted);
        });

        filteredVacations.forEach(vac => {
            const tr = document.createElement('tr');
            tr.id = vac.id;
            tr.setAttribute('data-month', vac.month);

            const isCoord = profileSelect.value === 'coordenador';
            const actionDisplay = isCoord ? 'table-cell' : 'none';

            let actionContent = '';
            if (vac.approvedByAdmin === true) {
                actionContent = `<span class="text-green" style="font-weight:600; font-size:11px;">Consolidada</span>`;
            } else if (vac.approvedByAdmin === false) {
                actionContent = `<span class="text-orange" style="font-weight:600; font-size:11px;">Recusada</span>`;
            } else {
                actionContent = `
                    <div style="display:flex; gap:6px; justify-content:center;">
                        <button class="btn-action-approve" onclick="approveVacation('${vac.id}')">Aprovar</button>
                        <button class="btn-action-reject" onclick="rejectVacation('${vac.id}')">Rejeitar</button>
                    </div>
                `;
            }

            tr.innerHTML = `
                <td style="text-align:left; padding-left:12px; font-weight:700;">${vac.name}</td>
                <td>${vac.period}</td>
                <td>${vac.days} dias</td>
                <td><span class="card-tag ${vac.statusClass}" id="badge-${vac.id}" style="font-size:10px; animation:none; ${vac.status === 'Aguardando Coordenador' ? 'background-color:#ddd6fe; color:#6d28d9;' : ''}">${vac.status}</span></td>
                <td class="admin-only-actions" style="display:${actionDisplay};">
                    ${actionContent}
                </td>
            `;

            vacationRowsBody.appendChild(tr);
        });

        applyVacationMonthFilter();
    }

    // ================= AUXILIARES DE APROVAÇÃO DE FÉRIAS (ADMIN) =================
    window.approveVacation = async function(id) {
        const vacations = await dbGetVacations();
        const vac = vacations.find(v => v.id === id);
        if (vac) {
            vac.approvedByAdmin = true;
            vac.status = 'Férias Aprovadas';
            vac.statusClass = 'status-ready';
            
            await dbSaveVacation(vac);
            await renderVacationsList();
            renderTurnosNoc();
            renderSobreaviso();
            updateDashboardMetrics();
            showToast(`Férias de ${vac.name} aprovadas com sucesso!`, 'success');
        }
    };

    window.rejectVacation = async function(id) {
        const vacations = await dbGetVacations();
        const vac = vacations.find(v => v.id === id);
        if (vac) {
            vac.approvedByAdmin = false;
            vac.status = 'Recusada pelo Coord.';
            vac.statusClass = 'status-folga';
            
            await dbSaveVacation(vac);
            await renderVacationsList();
            renderTurnosNoc();
            renderSobreaviso();
            updateDashboardMetrics();
            showToast(`Férias de ${vac.name} recusadas.`, 'info');
        }
    };

    // ================= ENVIO DE SOLICITAÇÃO DE FÉRIAS (NOC) =================
    const btnSubmitVacation = document.getElementById('btn-submit-vacation');
    const vacationRequestForm = document.getElementById('vacation-request-form');

    if (btnSubmitVacation && vacationRequestForm) {
        btnSubmitVacation.addEventListener('click', async () => {
            const startDateVal = document.getElementById('vac-req-start').value;
            const endDateVal = document.getElementById('vac-req-end').value;

            if (!startDateVal || !endDateVal) {
                showToast('Por favor, selecione as datas de início e término.', 'error');
                return;
            }

            const startD = new Date(startDateVal);
            const endD = new Date(endDateVal);

            if (endD < startD) {
                showToast('A data de término não pode ser anterior à data de início.', 'error');
                return;
            }

            const diffTime = Math.abs(endD.getTime() - startD.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            const startMonth = startD.getMonth() + 1;
            const userName = userNameDisplay.textContent || 'Allan Martins';

            const startFormatted = startDateVal.split('-').reverse().join('/');
            const endFormatted = endDateVal.split('-').reverse().join('/');
            const periodText = `${startFormatted} a ${endFormatted}`;

            const uniqueRowId = `row-vac-custom-${Date.now()}`;

            const newVac = {
                id: uniqueRowId,
                name: userName,
                period: periodText,
                days: diffDays,
                status: 'Aguardando Coordenador',
                month: startMonth.toString(),
                statusClass: 'status-importing',
                approvedByAdmin: null
            };

            await dbSaveVacation(newVac);
            await renderVacationsList();

            showToast(`Solicitação de férias de ${diffDays} dias enviada para aprovação!`, 'success');
            vacationRequestForm.reset();

            if (filterVacationMonth) {
                filterVacationMonth.value = startMonth.toString();
                applyVacationMonthFilter();
            }
        });
    }

    // ================= GERAÇÃO DINÂMICA DE CALENDÁRIO COM DADOS DO BANCO =================
    function getDaysInMonth(year, month) {
        return new Date(year, month, 0).getDate();
    }

    function getWeekdayName(year, month, day) {
        const date = new Date(year, month - 1, day);
        const dayNames = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
        return dayNames[date.getDay()];
    }

    function getVacationOrShiftDefault(employeeName, year, month, day, isSobreaviso) {
        const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const currentDate = new Date(dateStr);
        
        const vacations = JSON.parse(localStorage.getItem('ufinet_vacations')) || [];
        for (let vac of vacations) {
            if (vac.name.split('(')[0].trim().toLowerCase() === employeeName.split('(')[0].trim().toLowerCase() && vac.approvedByAdmin === true) {
                const parts = vac.period.split(' a ');
                if (parts.length === 2) {
                    const startParts = parts[0].split('/');
                    const endParts = parts[1].split('/');
                    if (startParts.length === 3 && endParts.length === 3) {
                        const startDate = new Date(startParts[2], startParts[1] - 1, startParts[0]);
                        const endDate = new Date(endParts[2], endParts[1] - 1, endParts[0]);
                        
                        startDate.setHours(0,0,0,0);
                        endDate.setHours(0,0,0,0);
                        currentDate.setHours(0,0,0,0);
                        
                        if (currentDate >= startDate && currentDate <= endDate) {
                            return 'FÉRIAS';
                        }
                    }
                }
            }
        }
        return isSobreaviso ? 'Folga' : 'Folga';
    }

    async function renderTurnosNoc() {
        if (!filterNocYear || !filterNocMonth) return;
        const year = parseInt(filterNocYear.value);
        const month = parseInt(filterNocMonth.value);
        const daysCount = getDaysInMonth(year, month);

        // 1. Renderizar cabeçalhos de colunas
        const headerRow = document.querySelector('#view-turnos-noc .schedule-table thead tr.header-days-row');
        if (headerRow) {
            while (headerRow.children.length > 1) {
                headerRow.removeChild(headerRow.lastChild);
            }

            for (let day = 1; day <= daysCount; day++) {
                const wdName = getWeekdayName(year, month, day);
                const th = document.createElement('th');
                th.className = 'day-header';
                
                if (wdName === 'SÁB') th.classList.add('font-sat');
                else if (wdName === 'DOM') th.classList.add('font-sun');
                else th.classList.add('font-weekday');

                if (year === 2026 && month === 7 && day >= 7 && day <= 19) {
                    th.classList.add('highlight-period');
                }

                th.innerHTML = `${day.toString().padStart(2, '0')}<span class="day-name">${wdName}</span>`;
                headerRow.appendChild(th);
            }
        }

        // 2. Renderizar linhas dinamicamente (excluindo Coordenador e perfis marcados fora da escala)
        const tbody = document.getElementById('turnos-noc-tbody');
        if (tbody) {
            tbody.innerHTML = '';
            const profiles = await dbGetProfiles();
            const nocProfiles = profiles.filter(p => p.oncall === 'nao' && p.role !== 'coordenador');

            const n1Profiles = nocProfiles.filter(p => p.team === 'n1');
            const torreProfiles = nocProfiles.filter(p => p.team === 'torre');

            // Categoria N1
            const trCatN1 = document.createElement('tr');
            trCatN1.className = 'category-row';
            trCatN1.innerHTML = `<td colspan="${daysCount + 1}">Colaboradores N1</td>`;
            tbody.appendChild(trCatN1);

            n1Profiles.forEach(prof => {
                appendEmployeeRow(tbody, prof, daysCount, year, month, false);
            });

            // Categoria Torre de Controle
            const trCatTorre = document.createElement('tr');
            trCatTorre.className = 'category-row';
            trCatTorre.innerHTML = `<td colspan="${daysCount + 1}">Colaboradores Torre de Controle</td>`;
            tbody.appendChild(trCatTorre);

            torreProfiles.forEach(prof => {
                appendEmployeeRow(tbody, prof, daysCount, year, month, false);
            });
        }

        applyTurnosNocFilters();
        updateDashboardMetrics();
    }

    async function renderSobreaviso() {
        if (!filterSobreYear || !filterSobreMonth) return;
        const year = parseInt(filterSobreYear.value);
        const month = parseInt(filterSobreMonth.value);
        const daysCount = getDaysInMonth(year, month);

        // 1. Renderizar cabeçalhos de colunas
        const headerRow = document.querySelector('#view-sobreaviso .schedule-table thead tr.header-days-row');
        if (headerRow) {
            while (headerRow.children.length > 1) {
                headerRow.removeChild(headerRow.lastChild);
            }

            for (let day = 1; day <= daysCount; day++) {
                const wdName = getWeekdayName(year, month, day);
                const th = document.createElement('th');
                th.className = 'day-header';
                
                if (wdName === 'SÁB') th.classList.add('font-sat');
                else if (wdName === 'DOM') th.classList.add('font-sun');
                else th.classList.add('font-weekday');

                th.innerHTML = `${day.toString().padStart(2, '0')}<span class="day-name">${wdName}</span>`;
                headerRow.appendChild(th);
            }
        }

        // 2. Renderizar linhas dinamicamente (excluindo Coordenador e perfis marcados fora da escala)
        const tbody = document.getElementById('sobreaviso-tbody');
        if (tbody) {
            tbody.innerHTML = '';
            const profiles = await dbGetProfiles();
            const sobreProfiles = profiles.filter(p => p.oncall === 'sim' && p.role !== 'coordenador');

            sobreProfiles.forEach(prof => {
                appendEmployeeRow(tbody, prof, daysCount, year, month, true);
            });
        }
    }

    function getShiftClass(shift) {
        if (!shift) return 'status-folga';
        const trimmed = shift.trim();
        if (shiftClasses[trimmed]) return shiftClasses[trimmed];
        
        const lower = trimmed.toLowerCase();
        for (let key in shiftClasses) {
            if (key.toLowerCase() === lower) {
                return shiftClasses[key];
            }
        }
        
        if (lower === 'folga') return 'status-folga';
        if (lower === 'férias') return 'status-ferias';
        if (lower === 'atestado') return 'status-atestado';
        if (lower.includes('7h-16h')) return 'status-7h-16h';
        if (lower.includes('9h-18h') || lower.includes('09h-18h')) return 'status-09h-18h';
        if (lower.includes('13h-22h') || lower.includes('10h-19h')) return 'status-blue-shift';
        if (lower.includes('12h-21h') || lower.includes('15h-00h')) return 'status-yellow-shift';
        if (lower.includes('18h-22h') || lower.includes('17h-22h') || lower.includes('16h-22h')) return 'status-orange-shift';
        if (lower.includes('21h-') || lower.includes('22h-')) return 'status-green-shift';
        if (lower.includes('12:12h')) return 'status-gray-shift';
        
        return 'status-default-shift';
    }

    function appendEmployeeRow(tbody, prof, daysCount, year, month, isSobreaviso) {
        const tr = document.createElement('tr');
        tr.className = 'employee-row';
        tr.setAttribute('data-team', prof.team);
        tr.setAttribute('data-name', prof.name);
        tr.setAttribute('data-username', prof.username);

        const tdName = document.createElement('td');
        tdName.className = 'col-employee';
        tdName.textContent = prof.name;
        tr.appendChild(tdName);

        const db = isSobreaviso ? sobreavisoDatabase : shiftDatabase;

        for (let day = 1; day <= daysCount; day++) {
            const td = document.createElement('td');
            const key = `${prof.username}|${year}|${month}|${day}`;
            let shift = db[key];

            if (!shift) {
                shift = getVacationOrShiftDefault(prof.name, year, month, day, isSobreaviso);
            }

            td.textContent = shift;
            
            const cellClass = getShiftClass(shift);
            td.className = cellClass;

            const wdName = getWeekdayName(year, month, day);
            if (wdName === 'SÁB') {
                td.classList.add('col-weekend-sat');
            } else if (wdName === 'DOM') {
                td.classList.add('col-weekend-sun');
            }

            if (profileSelect.value === 'coordenador') {
                td.classList.add('editable');
            }

            tr.appendChild(td);
        }

        tbody.appendChild(tr);
    }

    // ================= FILTRAGEM DE MES/ANO (TURNOS NOC E SOBREAVISO) =================
    const filterNocMonth = document.getElementById('filter-month');
    const filterNocYear = document.getElementById('filter-year');
    const titleTurnosNoc = document.querySelector('#view-turnos-noc .card-title');

    const filterSobreMonth = document.getElementById('filter-sobre-month');
    const filterSobreYear = document.getElementById('filter-sobre-year');
    const titleSobreavisoMonth = document.getElementById('title-sobreaviso-month');

    const searchSobreInput = document.getElementById('search-sobre-employee');

    const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    function updateTurnosNocTitle() {
        if (!filterNocMonth || !filterNocYear || !titleTurnosNoc) return;
        const selectedMonthName = monthNames[parseInt(filterNocMonth.value) - 1];
        const selectedYear = filterNocYear.value;
        titleTurnosNoc.textContent = `Escala ${selectedMonthName} ${selectedYear} (Mês Completo - 01 a 31)`;
        
        renderTurnosNoc();
        showToast(`Escala NOC filtrada para: ${selectedMonthName} de ${selectedYear}.`, 'info');
    }

    function updateSobreavisoTitle() {
        if (!filterSobreMonth || !filterSobreYear || !titleSobreavisoMonth) return;
        const selectedMonthName = monthNames[parseInt(filterSobreMonth.value) - 1];
        const selectedYear = filterSobreYear.value;
        titleSobreavisoMonth.textContent = `Escala de Sobreaviso NOC (${selectedMonthName} ${selectedYear})`;
        
        renderSobreaviso();
        showToast(`Sobreavisos filtrados para: ${selectedMonthName} de ${selectedYear}.`, 'info');
    }

    if (filterNocMonth) filterNocMonth.addEventListener('change', updateTurnosNocTitle);
    if (filterNocYear) filterNocYear.addEventListener('change', updateTurnosNocTitle);

    if (filterSobreMonth) filterSobreMonth.addEventListener('change', updateSobreavisoTitle);
    if (filterSobreYear) filterSobreYear.addEventListener('change', updateSobreavisoTitle);

    if (searchSobreInput) {
        searchSobreInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            const sobreRows = document.querySelectorAll('#view-sobreaviso .employee-row');
            sobreRows.forEach(row => {
                const name = row.querySelector('.col-employee').textContent.toLowerCase();
                if (name.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }

    // ================= CRUD DE GERENCIAMENTO DE PERFIS =================
    const btnCreateProfile = document.getElementById('btn-create-profile');
    const profileForm = document.getElementById('profile-create-form');

    function renderProfilesListFromData(profiles) {
        const tbody = document.getElementById('recent-profiles-rows');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        profiles.forEach(prof => {
            const tr = document.createElement('tr');
            tr.id = prof.id;

            const badgeClasses = {
                'noc': 'status-9h18h',
                'rh': 'status-ferias',
                'coordenador': 'status-ready'
            };
            const badgeTexts = {
                'noc': 'NOC',
                'rh': 'RH',
                'coordenador': 'Coordenador'
            };

            const selectedClass = badgeClasses[prof.role] || 'status-folga';
            const selectedText = badgeTexts[prof.role] || 'NOC';

            const oncallClass = prof.oncall === 'sim' ? 'status-ready' : (prof.oncall === 'fora' ? 'status-folga' : 'status-9h18h');
            const oncallStyle = prof.oncall === 'sim' ? 'background-color:#dbeafe; color:#1e40af;' : (prof.oncall === 'fora' ? 'background-color:#f1f5f9; color:#475569;' : 'background-color:#ecfdf5; color:#047857;');
            const oncallText = prof.oncall === 'sim' ? 'Sobreaviso' : (prof.oncall === 'fora' ? 'Não' : 'NOC');

            tr.innerHTML = `
                <td style="text-align:left; padding-left:10px; font-weight:700;" class="prof-td-name">${prof.name}</td>
                <td class="prof-td-user"><code>${prof.username}</code></td>
                <td class="prof-td-role" data-val="${prof.role}"><span class="card-tag ${selectedClass}" style="font-size:10px;">${selectedText}</span></td>
                <td class="prof-td-team" data-val="${prof.team}" style="display:none;">${prof.team === 'n1' ? 'Equipe N1' : (prof.team === 'rh' ? 'Recursos Humanos (RH)' : 'Torre de Controle')}</td>
                <td class="prof-td-oncall" data-val="${prof.oncall}"><span class="card-tag ${oncallClass}" style="font-size:10px; ${oncallStyle}">${oncallText}</span></td>
                <td class="prof-td-password" style="display:none;">${prof.password}</td>
                <td>
                    <div style="display:flex; gap:6px; justify-content:center;">
                        <button class="btn-action-approve" style="background-color:#2563eb;" onclick="editProfileRow('${prof.id}')">Editar</button>
                        <button class="btn-action-reject" onclick="deleteProfileRow('${prof.id}')">Excluir</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    async function renderProfilesList() {
        const profiles = await dbGetProfiles();
        renderProfilesListFromData(profiles);
    }

    if (btnCreateProfile && profileForm) {
        btnCreateProfile.addEventListener('click', async () => {
            const name = document.getElementById('prof-name').value.trim();
            const username = document.getElementById('prof-username').value.trim();
            const password = document.getElementById('prof-password').value.trim();
            const role = document.getElementById('prof-role').value;
            const team = document.getElementById('prof-team').value;
            const oncall = document.getElementById('prof-oncall').value;
            const editId = document.getElementById('prof-edit-id').value;
            const oldName = document.getElementById('prof-edit-old-name').value;
            
            if (!name || !username || !role || !password) {
                showToast('Por favor, preencha todos os campos obrigatórios do perfil (incluindo senha).', 'error');
                return;
            }

            if (password.length < 6) {
                showToast('A senha deve ter no mínimo 6 caracteres por segurança.', 'error');
                return;
            }

            const profiles = await dbGetProfiles();

            if (editId) {
                const prof = { id: editId, name, username, role, team, oncall, password };
                await dbSaveProfile(prof);

                showToast(`Perfil de ${name} atualizado com sucesso!`, 'success');
                
                document.getElementById('prof-edit-id').value = '';
                document.getElementById('prof-edit-old-name').value = '';
                document.getElementById('profile-form-title').textContent = 'Cadastrar Novo Colaborador (Perfil)';
                btnCreateProfile.textContent = 'Salvar Perfil e Criar Acesso';
            } else {
                const exists = profiles.some(p => p.username.toLowerCase() === username.toLowerCase());
                if (exists) {
                    showToast('Este usuário de login já está em uso.', 'error');
                    return;
                }

                const uniqueId = `profile-row-${Date.now()}`;
                const newProf = { id: uniqueId, name, username, role, team, oncall, password };
                await dbSaveProfile(newProf);

                showToast(`Perfil criado! ${name} adicionado às escalas de acordo.`, 'success');
            }

            // Padrão de autogeração de escala se o perfil for NOC e participar da escala
            const patternSelect = document.getElementById('prof-pattern');
            const selectedPattern = patternSelect ? patternSelect.value : 'none';

            if (selectedPattern !== 'none' && role === 'noc' && oncall !== 'fora') {
                const fYear = parseInt(filterNocYear.value);
                const fMonth = parseInt(filterNocMonth.value);
                const daysInMonth = getDaysInMonth(fYear, fMonth);

                for (let d = 1; d <= daysInMonth; d++) {
                    let fillShift = 'Folga';
                    if (selectedPattern === '5x2_adm') {
                        const wd = getWeekdayName(fYear, fMonth, d);
                        if (wd !== 'SÁB' && wd !== 'DOM') {
                            fillShift = '07h-16h';
                        }
                    } else if (selectedPattern === '12x36_dia') {
                        if (d % 2 !== 0) {
                            fillShift = '07h-19h';
                        }
                    } else if (selectedPattern === '12x36_noite') {
                        if (d % 2 !== 0) {
                            fillShift = '19h-07h';
                        }
                    }
                    await dbSaveShift(false, username, fYear, fMonth, d, fillShift);
                }
                showToast(`Escala do colaborador preenchida automaticamente!`, 'info');
            }

            profileForm.reset();
            if (containerProfOncall) containerProfOncall.style.display = 'flex';
            await renderProfilesList();
            renderTurnosNoc();
            renderSobreaviso();
            updateDashboardMetrics();
        });
    }

    // ================= CONTROLE DE EXIBIÇÃO DO CAMPO DE ESCALA (SE FOR RH, SELEÇÃO DO CAMPO ESCONDIDA) =================
    const profTeamSelect = document.getElementById('prof-team');
    const containerProfOncall = document.getElementById('container-prof-oncall');
    const profOncallSelect = document.getElementById('prof-oncall');

    if (profTeamSelect && containerProfOncall && profOncallSelect) {
        profTeamSelect.addEventListener('change', () => {
            if (profTeamSelect.value === 'rh') {
                containerProfOncall.style.display = 'none';
                profOncallSelect.value = 'fora';
            } else {
                containerProfOncall.style.display = 'flex';
                if (profOncallSelect.value === 'fora') {
                    profOncallSelect.value = 'nao';
                }
            }
        });
    }

    window.editProfileRow = function(rowId) {
        const row = document.getElementById(rowId);
        if (row) {
            const name = row.querySelector('.prof-td-name').textContent;
            const username = row.querySelector('.prof-td-user').textContent.trim();
            const role = row.querySelector('.prof-td-role').getAttribute('data-val');
            const team = row.querySelector('.prof-td-team').getAttribute('data-val');
            const oncall = row.querySelector('.prof-td-oncall').getAttribute('data-val');
            const password = row.querySelector('.prof-td-password').textContent;

            document.getElementById('prof-name').value = name;
            document.getElementById('prof-username').value = username;
            document.getElementById('prof-password').value = password;
            document.getElementById('prof-role').value = role;
            document.getElementById('prof-team').value = team;
            document.getElementById('prof-oncall').value = oncall;
            
            document.getElementById('prof-edit-id').value = rowId;
            document.getElementById('prof-edit-old-name').value = name;
            
            document.getElementById('profile-form-title').textContent = 'Editar Colaborador (Perfil)';
            btnCreateProfile.textContent = 'Salvar Alterações';

            if (team === 'rh') {
                if (containerProfOncall) containerProfOncall.style.display = 'none';
            } else {
                if (containerProfOncall) containerProfOncall.style.display = 'flex';
            }

            document.getElementById('profile-form-title').scrollIntoView({ behavior: 'smooth' });
            showToast('Dados do perfil carregados no formulário.', 'info');
        }
    };

    window.deleteProfileRow = async function(rowId) {
        const row = document.getElementById(rowId);
        if (row) {
            const name = row.querySelector('.prof-td-name').textContent;
            
            await dbDeleteProfile(rowId);

            showToast(`Perfil de ${name} e suas escalas foram excluídos do sistema.`, 'info');
            
            const currentEditId = document.getElementById('prof-edit-id').value;
            if (currentEditId === rowId) {
                document.getElementById('prof-edit-id').value = '';
                document.getElementById('prof-edit-old-name').value = '';
                document.getElementById('profile-form-title').textContent = 'Cadastrar Novo Colaborador (Perfil)';
                btnCreateProfile.textContent = 'Salvar Perfil e Criar Acesso';
                profileForm.reset();
            }

            await renderProfilesList();
            renderTurnosNoc();
            renderSobreaviso();
            updateDashboardMetrics();
        }
    };

    // ================= NOTIFICAÇÕES TOAST =================
    const toastContainer = document.getElementById('toast-container');

    function showToast(message, type = 'success') {
        if (!toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = 'toast';
        
        if (type === 'info') {
            toast.style.borderLeftColor = '#3b82f6';
        } else if (type === 'error') {
            toast.style.borderLeftColor = '#ef4444';
        }
        
        toast.innerHTML = `
            <svg style="width: 20px; height: 20px; flex-shrink: 0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${type === 'success' 
                    ? '<polyline points="20 6 9 17 4 12"></polyline>' 
                    : type === 'error'
                        ? '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>'
                        : '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>'}
            </svg>
            <span>${message}</span>
        `;
        
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toast-in 0.4s reverse cubic-bezier(0.16, 1, 0.3, 1) forwards';
            setTimeout(() => {
                toast.remove();
            }, 400);
        }, 3000);
    }

    // ================= CUSTOM CONFIRMATION OVERLAY DIALOG =================
    function customConfirm(message, onConfirm) {
        const modal = document.getElementById('confirm-modal');
        const msgEl = document.getElementById('confirm-modal-msg');
        const btnOk = document.getElementById('btn-confirm-ok');
        const btnCancel = document.getElementById('btn-confirm-cancel');

        if (!modal || !msgEl || !btnOk || !btnCancel) {
            if (confirm(message)) onConfirm();
            return;
        }

        msgEl.textContent = message;
        modal.style.display = 'flex';

        const cleanUp = () => {
            modal.style.display = 'none';
            btnOk.removeEventListener('click', handleOk);
            btnCancel.removeEventListener('click', handleCancel);
        };

        const handleOk = () => {
            cleanUp();
            onConfirm();
        };

        const handleCancel = () => {
            cleanUp();
        };

        btnOk.addEventListener('click', handleOk);
        btnCancel.addEventListener('click', handleCancel);
    }

    // ================= MINHA ESCALA: CALENDÁRIO INDIVIDUAL (OPERADOR) =================
    function renderMinhaEscala() {
        const grid = document.getElementById('minha-escala-grid');
        const title = document.getElementById('minha-escala-title');
        const selMonthSelect = document.getElementById('minha-escala-month');
        const selYearSelect = document.getElementById('minha-escala-year');
        const sessionUser = JSON.parse(localStorage.getItem('ufinet_session'));

        if (!grid || !title || !selMonthSelect || !selYearSelect || !sessionUser) return;

        const year = parseInt(selYearSelect.value);
        const month = parseInt(selMonthSelect.value);
        const selectedMonthName = monthNames[month - 1];

        title.textContent = `Escala de ${sessionUser.name} em ${selectedMonthName} ${year}`;
        grid.innerHTML = '';

        const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
        const daysInMonth = getDaysInMonth(year, month);

        // Dias vazios
        for (let i = 0; i < firstDayOfWeek; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.style.minHeight = '90px';
            grid.appendChild(emptyCell);
        }

        const today = new Date();
        const isCurrentMonthYear = today.getFullYear() === year && (today.getMonth() + 1) === month;

        for (let day = 1; day <= daysInMonth; day++) {
            const card = document.createElement('div');
            card.className = 'calendar-day-card';
            
            const wdName = getWeekdayName(year, month, day);
            if (wdName === 'SÁB') card.classList.add('col-weekend-sat');
            if (wdName === 'DOM') card.classList.add('col-weekend-sun');

            if (isCurrentMonthYear && today.getDate() === day) {
                card.classList.add('calendar-day-today');
            }

            const numEl = document.createElement('span');
            numEl.className = 'calendar-day-number';
            numEl.textContent = `${day.toString().padStart(2, '0')} (${wdName})`;
            card.appendChild(numEl);

            const key = `${sessionUser.username}|${year}|${month}|${day}`;
            let shift = shiftDatabase[key] || getVacationOrShiftDefault(sessionUser.name, year, month, day, false);
            
            const hasSobreaviso = sobreavisoDatabase[key];
            if (hasSobreaviso && hasSobreaviso !== 'Folga') {
                shift = `${shift} + Sobreaviso: ${hasSobreaviso}`;
            }

            const shiftEl = document.createElement('div');
            shiftEl.className = 'calendar-day-shift';
            shiftEl.textContent = shift || 'Folga';

            const cellClass = getShiftClass(shift);
            shiftEl.classList.add(cellClass);
            card.appendChild(shiftEl);
            grid.appendChild(card);
        }
    }

    const minMonthSelect = document.getElementById('minha-escala-month');
    const minYearSelect = document.getElementById('minha-escala-year');
    if (minMonthSelect) minMonthSelect.addEventListener('change', renderMinhaEscala);
    if (minYearSelect) minYearSelect.addEventListener('change', renderMinhaEscala);

    // ================= ALTERNADOR DE TEMA (DARK / LIGHT MODE) =================
    const btnThemeToggle = document.getElementById('btn-theme-toggle');
    const themeIcon = document.getElementById('theme-toggle-icon');
    const themeText = document.getElementById('theme-toggle-text');

    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            if (themeText) themeText.textContent = 'Modo Claro';
            if (themeIcon) {
                themeIcon.innerHTML = `<path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"/>`;
            }
        } else {
            document.body.classList.remove('dark-theme');
            if (themeText) themeText.textContent = 'Modo Escuro';
            if (themeIcon) {
                themeIcon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`;
            }
        }
        localStorage.setItem('ufinet_theme', theme);
    }

    if (btnThemeToggle) {
        btnThemeToggle.addEventListener('click', (e) => {
            e.preventDefault();
            const isDark = document.body.classList.contains('dark-theme');
            applyTheme(isDark ? 'light' : 'dark');
            showToast(`Tema visual alterado com sucesso!`, 'info');
        });
    }

    // Carregar tema salvo
    const savedTheme = localStorage.getItem('ufinet_theme') || 'light';
    applyTheme(savedTheme);

    // ================= EXPORTADORES (PDF / CSV) =================
    const btnExportPdf = document.getElementById('btn-export-pdf');
    if (btnExportPdf) {
        btnExportPdf.addEventListener('click', () => {
            window.print();
        });
    }

    const btnExportCsv = document.getElementById('btn-export-csv');
    if (btnExportCsv) {
        btnExportCsv.addEventListener('click', () => {
            const year = filterNocYear.value;
            const month = filterNocMonth.value;
            const daysCount = new Date(year, month, 0).getDate();
            
            let csvContent = "Colaborador;";
            for (let d = 1; d <= daysCount; d++) {
                csvContent += `${d}/${month};`;
            }
            csvContent += "\n";
            
            const rows = document.querySelectorAll('#turnos-noc-tbody .employee-row');
            rows.forEach(row => {
                const name = row.querySelector('.col-employee').textContent.split('(')[0].trim();
                csvContent += `"${name}";`;
                const cells = Array.from(row.querySelectorAll('td')).slice(1);
                cells.forEach(cell => {
                    csvContent += `"${cell.textContent.trim()}";`;
                });
                csvContent += "\n";
            });
            
            const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `Escala_NOC_${month}_${year}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast('Arquivo CSV exportado com sucesso!', 'success');
        });
    }

    // ================= INICIALIZAÇÃO DO SISTEMA =================
    // 1. Carregar arquivo config.js e configurar cliente Supabase Cloud
    await configureSupabase();

    // Configurar seletores de escala para o mês e ano atual do sistema
    const initDate = new Date();
    const currentM = initDate.getMonth() + 1;
    const currentY = initDate.getFullYear();

    if (filterNocMonth) filterNocMonth.value = currentM.toString();
    if (filterNocYear) filterNocYear.value = currentY.toString();
    if (filterSobreMonth) filterSobreMonth.value = currentM.toString();
    if (filterSobreYear) filterSobreYear.value = currentY.toString();

    const elMinMonth = document.getElementById('minha-escala-month');
    const elMinYear = document.getElementById('minha-escala-year');
    if (elMinMonth) elMinMonth.value = currentM.toString();
    if (elMinYear) elMinYear.value = currentY.toString();

    if (filterNocMonth && filterNocYear && titleTurnosNoc) {
        const selectedMonthName = monthNames[currentM - 1];
        titleTurnosNoc.textContent = `Escala ${selectedMonthName} ${currentY} (Mês Completo - 01 a 31)`;
    }
    if (filterSobreMonth && filterSobreYear && titleSobreavisoMonth) {
        const selectedMonthName = monthNames[currentM - 1];
        titleSobreavisoMonth.textContent = `Escala de Sobreaviso NOC (${selectedMonthName} ${currentY})`;
    }

    // 2. Carregar e renderizar todos os dados das tabelas e estatísticas
    await loadAllDataAndRender();

    // 3. Aplicar restrições de visibilidade de perfis
    applyProfilePermissions();

    // 4. Verificar sessão persistente (Login Automático)
    const savedSession = localStorage.getItem('ufinet_session');
    if (savedSession) {
        try {
            const sessionUser = JSON.parse(savedSession);
            profileSelect.value = sessionUser.role;
            applyProfilePermissions();
            
            document.body.classList.remove('logged-out');
            
            userNameDisplay.textContent = sessionUser.name;
            avatarLetters.textContent = sessionUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            
            const roleText = {
                'coordenador': 'Coordenador (Admin)',
                'noc': 'Analista NOC',
                'rh': 'Analista de RH'
            };
            userRoleDisplay.textContent = roleText[sessionUser.role] || 'Operador';
            
            if (sessionUser.role === 'coordenador') {
                navigateToTab('view-dashboard');
            } else {
                navigateToTab('view-minha-escala');
            }
        } catch (e) {
            console.error("Erro ao ler sessão persistente:", e);
            localStorage.removeItem('ufinet_session');
        }
    } else {
        document.body.classList.add('logged-out');
    }
});
