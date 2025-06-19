// Sistema de Armazenamento de Clientes
class StorageSystem {
    constructor() {
        this.clients = JSON.parse(localStorage.getItem('clients')) || [];
        this.groups = JSON.parse(localStorage.getItem('groups')) || [];
        this.files = JSON.parse(localStorage.getItem('files')) || {};
        this.currentClientId = null;
        this.currentGroupId = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderGroups();
        this.renderClients();
        this.updateCounts();
        this.setupSectionToggles();
    }

    setupEventListeners() {
        // Botões principais
        document.getElementById('addClientBtn').addEventListener('click', () => this.openClientModal());
        document.getElementById('manageGroupsBtn').addEventListener('click', () => this.openGroupsModal());
        document.getElementById('emptyStateAddBtn').addEventListener('click', () => this.openClientModal());

        // Modal de cliente
        document.getElementById('closeModal').addEventListener('click', () => this.closeClientModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeClientModal());
        document.getElementById('clientForm').addEventListener('submit', (e) => this.handleClientSubmit(e));

        // Modal de grupos
        document.getElementById('closeGroupsModal').addEventListener('click', () => this.closeGroupsModal());
        document.getElementById('groupForm').addEventListener('submit', (e) => this.handleGroupSubmit(e));

        // Modal de detalhes do grupo
        document.getElementById('closeGroupDetailsModal').addEventListener('click', () => this.closeGroupDetailsModal());
        document.getElementById('addClientToGroupBtn').addEventListener('click', () => this.toggleAddClientToGroupForm());
        document.getElementById('confirmAddClientBtn').addEventListener('click', () => this.addClientToGroup());
        document.getElementById('cancelAddClientBtn').addEventListener('click', () => this.toggleAddClientToGroupForm());

        // Modal de detalhes do cliente
        document.getElementById('closeDetailsModal').addEventListener('click', () => this.closeClientDetailsModal());
        document.getElementById('uploadFileBtn').addEventListener('click', () => this.toggleFileUpload());
        document.getElementById('downloadAllFilesBtn').addEventListener('click', () => this.downloadAllFiles());
        document.getElementById('downloadByTypeBtn').addEventListener('click', () => this.showDownloadByTypeModal());
        document.getElementById('selectFilesBtn').addEventListener('click', () => document.getElementById('fileInput').click());
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileUpload(e));

        // Modal de confirmação
        document.getElementById('cancelConfirm').addEventListener('click', () => this.closeConfirmModal());
        document.getElementById('confirmDelete').addEventListener('click', () => this.confirmDelete());

        // Modal de download por tipo
        document.getElementById('closeDownloadByTypeModal').addEventListener('click', () => this.closeDownloadByTypeModal());
        document.getElementById('cancelDownloadByType').addEventListener('click', () => this.closeDownloadByTypeModal());

        // Busca e filtros
        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e.target.value));
        document.getElementById('groupFilterSelect').addEventListener('change', (e) => this.handleGroupFilter(e.target.value));
        document.getElementById('filterSelect').addEventListener('change', (e) => this.handleStatusFilter(e.target.value));

        // Fechar modais ao clicar fora
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
    }

    setupSectionToggles() {
        // Configurar toggles das seções
        const sectionHeaders = document.querySelectorAll('.section-header');
        
        sectionHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const section = header.getAttribute('data-section');
                this.toggleSection(section);
            });
        });

        // Expandir seções por padrão
        this.toggleSection('groups');
        this.toggleSection('clients');
    }

    toggleSection(section) {
        const header = document.querySelector(`[data-section="${section}"]`);
        const content = document.getElementById(`${section}Content`);
        const icon = document.getElementById(`${section}Icon`);
        
        if (content.classList.contains('hidden')) {
            // Expandir
            content.classList.remove('hidden');
            content.classList.add('show');
            header.classList.add('expanded');
            icon.style.transform = 'rotate(180deg)';
        } else {
            // Colapsar
            content.classList.remove('show');
            content.classList.add('hide');
            header.classList.remove('expanded');
            icon.style.transform = 'rotate(0deg)';
            
            setTimeout(() => {
                content.classList.add('hidden');
                content.classList.remove('hide');
            }, 300);
        }
    }

    // Métodos de renderização
    renderGroups() {
        const groupsGrid = document.getElementById('groupsGrid');
        const groupsList = document.getElementById('groupsList');
        
        if (this.groups.length === 0) {
            groupsGrid.innerHTML = `
                <div class="col-span-full text-center py-8 text-gray-500">
                    <i class="fas fa-users text-4xl mb-4"></i>
                    <p>Nenhum grupo criado ainda.</p>
                    <p class="text-sm">Clique em "Gerenciar Grupos" para criar seu primeiro grupo.</p>
                </div>
            `;
            groupsList.innerHTML = '<p class="text-gray-500 text-center py-4">Nenhum grupo criado</p>';
            return;
        }

        // Renderizar cards dos grupos
        groupsGrid.innerHTML = this.groups.map(group => {
            const clientCount = this.clients.filter(client => client.groupId === group.id).length;
            return `
                <div class="group-card bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer" 
                     onclick="storageSystem.openGroupDetails('${group.id}')">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center">
                            <div class="group-color-indicator" style="background-color: ${group.color}"></div>
                            <h3 class="font-semibold text-gray-900 truncate">${group.name}</h3>
                        </div>
                        <span class="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                            ${clientCount} cliente${clientCount !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-500">Criado em ${new Date(group.createdAt).toLocaleDateString()}</span>
                        <div class="flex space-x-1">
                            <button onclick="event.stopPropagation(); storageSystem.editGroup('${group.id}')" 
                                    class="text-blue-600 hover:text-blue-800 p-1">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="event.stopPropagation(); storageSystem.deleteGroup('${group.id}')" 
                                    class="text-red-600 hover:text-red-800 p-1">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Renderizar lista de grupos no modal
        groupsList.innerHTML = this.groups.map(group => {
            const clientCount = this.clients.filter(client => client.groupId === group.id).length;
            return `
                <div class="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                    <div class="flex items-center">
                        <div class="group-color-indicator" style="background-color: ${group.color}"></div>
                        <span class="font-medium">${group.name}</span>
                        <span class="ml-2 text-sm text-gray-500">(${clientCount} cliente${clientCount !== 1 ? 's' : ''})</span>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="storageSystem.editGroup('${group.id}')" 
                                class="text-blue-600 hover:text-blue-800 p-1">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="storageSystem.deleteGroup('${group.id}')" 
                                class="text-red-600 hover:text-red-800 p-1">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Atualizar opções dos selects
        this.updateGroupOptions();
    }

    renderClients() {
        const clientsGrid = document.getElementById('clientsGrid');
        
        if (this.clients.length === 0) {
            clientsGrid.innerHTML = `
                <div class="col-span-full text-center py-8 text-gray-500">
                    <i class="fas fa-user-friends text-4xl mb-4"></i>
                    <p>Nenhum cliente cadastrado ainda.</p>
                    <p class="text-sm">Clique em "Novo Cliente" para adicionar seu primeiro cliente.</p>
                </div>
            `;
            return;
        }

        clientsGrid.innerHTML = this.clients.map(client => {
            const group = this.groups.find(g => g.id === client.groupId);
            const fileCount = this.files[client.id] ? this.files[client.id].length : 0;
            
            return `
                <div class="client-card bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer" 
                     onclick="storageSystem.openClientDetails('${client.id}')">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center">
                            <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                <i class="fas fa-user text-blue-600"></i>
                            </div>
                            <div>
                                <h3 class="font-semibold text-gray-900 truncate">${client.name}</h3>
                                <p class="text-sm text-gray-500 truncate">${client.email}</p>
                            </div>
                        </div>
                        <span class="status-badge ${client.status === 'active' ? 'status-active' : 'status-inactive'}">
                            ${client.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                    </div>
                    
                    <div class="space-y-2 mb-3">
                        ${client.phone ? `<p class="text-sm text-gray-600"><i class="fas fa-phone mr-2"></i>${client.phone}</p>` : ''}
                        ${group ? `<p class="text-sm text-gray-600"><i class="fas fa-users mr-2"></i>${group.name}</p>` : ''}
                        <p class="text-sm text-gray-600"><i class="fas fa-file mr-2"></i>${fileCount} arquivo${fileCount !== 1 ? 's' : ''}</p>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-xs text-gray-400">Criado em ${new Date(client.createdAt).toLocaleDateString()}</span>
                        <div class="flex space-x-1">
                            ${fileCount > 0 ? `
                                <button onclick="event.stopPropagation(); storageSystem.quickDownloadAllFiles('${client.id}')" 
                                        class="text-green-600 hover:text-green-800 p-1" 
                                        title="Baixar todos os arquivos">
                                    <i class="fas fa-download"></i>
                                </button>
                            ` : ''}
                            <button onclick="event.stopPropagation(); storageSystem.editClient('${client.id}')" 
                                    class="text-blue-600 hover:text-blue-800 p-1">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="event.stopPropagation(); storageSystem.deleteClient('${client.id}')" 
                                    class="text-red-600 hover:text-red-800 p-1">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateCounts() {
        document.getElementById('groupsCount').textContent = this.groups.length;
        document.getElementById('clientsCount').textContent = this.clients.length;
    }

    updateGroupOptions() {
        const groupSelects = ['clientGroup', 'groupFilterSelect', 'clientToAddSelect'];
        
        groupSelects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (!select) return;
            
            const currentValue = select.value;
            const isGroupFilter = selectId === 'groupFilterSelect';
            
            // Manter opção "Todos os grupos" ou "Sem grupo"
            const defaultOption = isGroupFilter ? 
                '<option value="all">Todos os grupos</option>' : 
                '<option value="">Sem grupo</option>';
            
            select.innerHTML = defaultOption + this.groups.map(group => 
                `<option value="${group.id}" ${currentValue === group.id ? 'selected' : ''}>${group.name}</option>`
            ).join('');
        });
    }

    // Métodos de modal
    openClientModal(clientId = null) {
        this.currentClientId = clientId;
        const modal = document.getElementById('clientModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('clientForm');
        
        title.textContent = clientId ? 'Editar Cliente' : 'Novo Cliente';
        
        if (clientId) {
            const client = this.clients.find(c => c.id === clientId);
            if (client) {
                document.getElementById('clientName').value = client.name;
                document.getElementById('clientEmail').value = client.email;
                document.getElementById('clientPhone').value = client.phone || '';
                document.getElementById('clientGroup').value = client.groupId || '';
                document.getElementById('clientStatus').value = client.status;
            }
        } else {
            form.reset();
        }
        
        modal.classList.remove('hidden');
    }

    closeClientModal() {
        document.getElementById('clientModal').classList.add('hidden');
        this.currentClientId = null;
    }

    openGroupsModal() {
        document.getElementById('groupsModal').classList.remove('hidden');
    }

    closeGroupsModal() {
        document.getElementById('groupsModal').classList.add('hidden');
    }

    openGroupDetails(groupId) {
        this.currentGroupId = groupId;
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        const modal = document.getElementById('groupDetailsModal');
        const title = document.getElementById('groupDetailsTitle');
        const info = document.getElementById('groupInfo');
        
        title.textContent = `Detalhes do Grupo: ${group.name}`;
        
        const groupClients = this.clients.filter(client => client.groupId === groupId);
        const fileCount = groupClients.reduce((total, client) => {
            return total + (this.files[client.id] ? this.files[client.id].length : 0);
        }, 0);
        
        info.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h4 class="font-medium text-gray-900 mb-2">Informações do Grupo</h4>
                    <div class="space-y-2">
                        <p><strong>Nome:</strong> ${group.name}</p>
                        <p><strong>Cor:</strong> <span class="inline-block w-4 h-4 rounded-full mr-2" style="background-color: ${group.color}"></span>${group.color}</p>
                        <p><strong>Criado em:</strong> ${new Date(group.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
                <div>
                    <h4 class="font-medium text-gray-900 mb-2">Estatísticas</h4>
                    <div class="space-y-2">
                        <p><strong>Total de clientes:</strong> ${groupClients.length}</p>
                        <p><strong>Total de arquivos:</strong> ${fileCount}</p>
                        <p><strong>Clientes ativos:</strong> ${groupClients.filter(c => c.status === 'active').length}</p>
                    </div>
                </div>
            </div>
        `;

        // Renderizar lista de clientes do grupo
        this.renderGroupClients(groupClients);
        
        // Atualizar opções de clientes disponíveis
        this.updateAvailableClientsSelect();
        
        modal.classList.remove('hidden');
    }

    closeGroupDetailsModal() {
        document.getElementById('groupDetailsModal').classList.add('hidden');
        this.currentGroupId = null;
    }

    openClientDetails(clientId) {
        this.currentClientId = clientId;
        const client = this.clients.find(c => c.id === clientId);
        if (!client) return;

        const modal = document.getElementById('clientDetailsModal');
        const title = document.getElementById('clientDetailsTitle');
        const info = document.getElementById('clientInfo');
        
        title.textContent = `Detalhes do Cliente: ${client.name}`;
        
        const group = this.groups.find(g => g.id === client.groupId);
        const clientFiles = this.files[clientId] || [];
        
        // Calcular tamanho total dos arquivos
        const totalSize = clientFiles.reduce((total, file) => total + (file.size || 0), 0);
        const formattedTotalSize = this.formatFileSize(totalSize);
        
        info.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h4 class="font-medium text-gray-900 mb-2">Informações Pessoais</h4>
                    <div class="space-y-2">
                        <p><strong>Nome:</strong> ${client.name}</p>
                        <p><strong>Email:</strong> ${client.email}</p>
                        ${client.phone ? `<p><strong>Telefone:</strong> ${client.phone}</p>` : ''}
                        <p><strong>Status:</strong> <span class="status-badge ${client.status === 'active' ? 'status-active' : 'status-inactive'}">${client.status === 'active' ? 'Ativo' : 'Inativo'}</span></p>
                    </div>
                </div>
                <div>
                    <h4 class="font-medium text-gray-900 mb-2">Informações Adicionais</h4>
                    <div class="space-y-2">
                        <p><strong>Grupo:</strong> ${group ? group.name : 'Sem grupo'}</p>
                        <p><strong>Total de arquivos:</strong> ${clientFiles.length}</p>
                        <p><strong>Tamanho total:</strong> ${formattedTotalSize}</p>
                        <p><strong>Cadastrado em:</strong> ${new Date(client.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>
        `;

        // Renderizar arquivos do cliente
        this.renderClientFiles(clientFiles);
        
        modal.classList.remove('hidden');
    }

    closeClientDetailsModal() {
        document.getElementById('clientDetailsModal').classList.add('hidden');
        this.currentClientId = null;
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => modal.classList.add('hidden'));
        this.currentClientId = null;
        this.currentGroupId = null;
    }

    // Métodos de manipulação de dados
    handleClientSubmit(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('clientName').value,
            email: document.getElementById('clientEmail').value,
            phone: document.getElementById('clientPhone').value,
            groupId: document.getElementById('clientGroup').value || null,
            status: document.getElementById('clientStatus').value
        };

        if (this.currentClientId) {
            // Editar cliente existente
            const index = this.clients.findIndex(c => c.id === this.currentClientId);
            if (index !== -1) {
                this.clients[index] = { ...this.clients[index], ...formData };
            }
        } else {
            // Adicionar novo cliente
            const newClient = {
                id: Date.now().toString(),
                ...formData,
                createdAt: new Date().toISOString()
            };
            this.clients.push(newClient);
        }

        this.saveData();
        this.renderClients();
        this.updateCounts();
        this.closeClientModal();
    }

    handleGroupSubmit(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('groupName').value,
            color: document.getElementById('groupColor').value
        };

        if (this.currentGroupId) {
            // Editar grupo existente
            const index = this.groups.findIndex(g => g.id === this.currentGroupId);
            if (index !== -1) {
                this.groups[index] = { ...this.groups[index], ...formData };
            }
        } else {
            // Adicionar novo grupo
            const newGroup = {
                id: Date.now().toString(),
                ...formData,
                createdAt: new Date().toISOString()
            };
            this.groups.push(newGroup);
        }

        this.saveData();
        this.renderGroups();
        this.updateCounts();
        this.closeGroupsModal();
        document.getElementById('groupForm').reset();
    }

    // Métodos auxiliares
    editClient(clientId) {
        this.openClientModal(clientId);
    }

    deleteClient(clientId) {
        this.showConfirmModal(
            'Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.',
            () => {
                this.clients = this.clients.filter(c => c.id !== clientId);
                delete this.files[clientId];
                this.saveData();
                this.renderClients();
                this.updateCounts();
            }
        );
    }

    editGroup(groupId) {
        this.currentGroupId = groupId;
        const group = this.groups.find(g => g.id === groupId);
        if (group) {
            document.getElementById('groupName').value = group.name;
            document.getElementById('groupColor').value = group.color;
        }
    }

    deleteGroup(groupId) {
        this.showConfirmModal(
            'Tem certeza que deseja excluir este grupo? Os clientes serão movidos para "Sem grupo".',
            () => {
                this.groups = this.groups.filter(g => g.id !== groupId);
                // Remover referência do grupo dos clientes
                this.clients.forEach(client => {
                    if (client.groupId === groupId) {
                        client.groupId = null;
                    }
                });
                this.saveData();
                this.renderGroups();
                this.renderClients();
                this.updateCounts();
            }
        );
    }

    addClientToGroup() {
        const clientId = document.getElementById('clientToAddSelect').value;
        if (!clientId || !this.currentGroupId) return;

        const client = this.clients.find(c => c.id === clientId);
        if (client) {
            client.groupId = this.currentGroupId;
            this.saveData();
            this.renderClients();
            this.renderGroups();
            this.openGroupDetails(this.currentGroupId);
        }
    }

    toggleAddClientToGroupForm() {
        const form = document.getElementById('addClientToGroupForm');
        form.classList.toggle('hidden');
    }

    toggleFileUpload() {
        const uploadArea = document.getElementById('fileUploadArea');
        uploadArea.classList.toggle('hidden');
    }

    handleFileUpload(e) {
        const files = Array.from(e.target.files);
        if (!files.length || !this.currentClientId) return;

        if (!this.files[this.currentClientId]) {
            this.files[this.currentClientId] = [];
        }

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const fileData = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    uploadedAt: new Date().toISOString(),
                    content: e.target.result // Armazenar o conteúdo do arquivo como base64
                };
                this.files[this.currentClientId].push(fileData);
                this.saveData();
                this.renderClientFiles(this.files[this.currentClientId]);
                this.renderClients();
            };
            reader.readAsDataURL(file);
        });

        this.toggleFileUpload();
        e.target.value = '';
    }

    renderGroupClients(clients) {
        const container = document.getElementById('groupClientsList');
        
        if (clients.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">Nenhum cliente neste grupo</p>';
            return;
        }

        container.innerHTML = clients.map(client => {
            const fileCount = this.files[client.id] ? this.files[client.id].length : 0;
            return `
                <div class="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                    <div class="flex items-center">
                        <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <i class="fas fa-user text-blue-600 text-sm"></i>
                        </div>
                        <div>
                            <p class="font-medium text-gray-900">${client.name}</p>
                            <p class="text-sm text-gray-500">${client.email}</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-4">
                        <span class="text-sm text-gray-500">${fileCount} arquivo${fileCount !== 1 ? 's' : ''}</span>
                        <span class="status-badge ${client.status === 'active' ? 'status-active' : 'status-inactive'}">
                            ${client.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                        <button onclick="storageSystem.removeClientFromGroup('${client.id}')" 
                                class="text-red-600 hover:text-red-800 p-1">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderClientFiles(files) {
        const container = document.getElementById('filesList');
        
        if (files.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">Nenhum arquivo enviado</p>';
            return;
        }

        container.innerHTML = files.map(file => {
            const size = this.formatFileSize(file.size);
            return `
                <div class="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                    <div class="flex items-center">
                        <i class="fas fa-file text-gray-400 mr-3"></i>
                        <div>
                            <p class="font-medium text-gray-900">${file.name}</p>
                            <p class="text-sm text-gray-500">${size} • ${new Date(file.uploadedAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="storageSystem.downloadFile('${file.id}')" 
                                class="text-green-600 hover:text-green-800 p-1" 
                                title="Baixar arquivo">
                            <i class="fas fa-download"></i>
                        </button>
                        <button onclick="storageSystem.deleteFile('${file.id}')" 
                                class="text-red-600 hover:text-red-800 p-1"
                                title="Excluir arquivo">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateAvailableClientsSelect() {
        const select = document.getElementById('clientToAddSelect');
        const currentGroupClients = this.clients.filter(c => c.groupId === this.currentGroupId);
        const availableClients = this.clients.filter(c => !c.groupId || c.groupId !== this.currentGroupId);
        
        select.innerHTML = '<option value="">Selecione um cliente...</option>' + 
            availableClients.map(client => 
                `<option value="${client.id}">${client.name} (${client.email})</option>`
            ).join('');
    }

    removeClientFromGroup(clientId) {
        const client = this.clients.find(c => c.id === clientId);
        if (client) {
            client.groupId = null;
            this.saveData();
            this.renderClients();
            this.renderGroups();
            this.openGroupDetails(this.currentGroupId);
        }
    }

    deleteFile(fileId) {
        if (!this.currentClientId) return;
        
        this.files[this.currentClientId] = this.files[this.currentClientId].filter(f => f.id !== fileId);
        this.saveData();
        this.renderClientFiles(this.files[this.currentClientId]);
        this.renderClients();
    }

    downloadFile(fileId) {
        if (!this.currentClientId) return;
        
        const file = this.files[this.currentClientId].find(f => f.id === fileId);
        if (!file || !file.content) {
            alert('Arquivo não encontrado ou conteúdo não disponível.');
            return;
        }

        try {
            // Converter base64 para blob
            const base64Response = fetch(file.content);
            base64Response.then(res => res.blob()).then(blob => {
                // Criar URL do blob
                const url = window.URL.createObjectURL(blob);
                
                // Criar elemento de download
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = file.name;
                
                // Adicionar ao DOM, clicar e remover
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            });
        } catch (error) {
            console.error('Erro ao baixar arquivo:', error);
            alert('Erro ao baixar o arquivo. Tente novamente.');
        }
    }

    downloadAllFiles() {
        if (!this.currentClientId) return;
        
        const clientFiles = this.files[this.currentClientId];
        if (!clientFiles || clientFiles.length === 0) {
            alert('Nenhum arquivo disponível para download.');
            return;
        }

        const client = this.clients.find(c => c.id === this.currentClientId);
        const clientName = client ? client.name : 'cliente';
        
        // Se houver apenas um arquivo, baixar diretamente
        if (clientFiles.length === 1) {
            this.downloadFile(clientFiles[0].id);
            return;
        }

        // Para múltiplos arquivos, usar JSZip para criar um arquivo ZIP
        if (typeof JSZip === 'undefined') {
            // Fallback: baixar arquivos individualmente
            alert('Baixando arquivos individualmente...');
            clientFiles.forEach((file, index) => {
                setTimeout(() => this.downloadFile(file.id), index * 500);
            });
            return;
        }

        // Mostrar indicador de progresso
        const progressModal = this.showProgressModal('Preparando arquivos para download...');
        
        // Usar JSZip para criar um arquivo ZIP
        const zip = new JSZip();
        let processedFiles = 0;
        let totalFiles = clientFiles.length;

        clientFiles.forEach(file => {
            if (file.content) {
                // Converter base64 para blob e adicionar ao ZIP
                fetch(file.content)
                    .then(res => res.blob())
                    .then(blob => {
                        zip.file(file.name, blob);
                        processedFiles++;
                        
                        // Atualizar progresso
                        const progress = Math.round((processedFiles / totalFiles) * 100);
                        this.updateProgressModal(progressModal, `Processando arquivos... ${progress}%`);
                        
                        if (processedFiles === totalFiles) {
                            // Gerar e baixar o ZIP
                            this.updateProgressModal(progressModal, 'Gerando arquivo ZIP...');
                            zip.generateAsync({type: 'blob'}).then(content => {
                                const url = window.URL.createObjectURL(content);
                                const a = document.createElement('a');
                                a.style.display = 'none';
                                a.href = url;
                                a.download = `${clientName}_arquivos.zip`;
                                
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(url);
                                document.body.removeChild(a);
                                
                                // Fechar modal de progresso
                                this.closeProgressModal(progressModal);
                            });
                        }
                    })
                    .catch(error => {
                        console.error('Erro ao processar arquivo:', error);
                        processedFiles++;
                        
                        if (processedFiles === totalFiles) {
                            this.closeProgressModal(progressModal);
                            alert('Alguns arquivos não puderam ser processados. Verifique o console para mais detalhes.');
                        }
                    });
            } else {
                processedFiles++;
                if (processedFiles === totalFiles) {
                    this.closeProgressModal(progressModal);
                }
            }
        });
    }

    showProgressModal(message) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                <div class="flex items-center mb-4">
                    <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                    <h3 class="text-lg font-semibold text-gray-900">Download em Progresso</h3>
                </div>
                <p class="text-gray-600 mb-4">${message}</p>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="progress-bar bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    }

    updateProgressModal(modal, message) {
        const messageEl = modal.querySelector('p');
        const progressBar = modal.querySelector('.progress-bar');
        
        if (messageEl) messageEl.textContent = message;
        
        // Extrair porcentagem da mensagem se disponível
        const match = message.match(/(\d+)%/);
        if (match && progressBar) {
            progressBar.style.width = match[1] + '%';
        }
    }

    closeProgressModal(modal) {
        if (modal && modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    }

    quickDownloadAllFiles(clientId) {
        // Definir o cliente atual temporariamente
        const originalClientId = this.currentClientId;
        this.currentClientId = clientId;
        
        // Chamar o método de download
        this.downloadAllFiles();
        
        // Restaurar o cliente atual
        this.currentClientId = originalClientId;
    }

    showDownloadByTypeModal() {
        if (!this.currentClientId) return;
        
        const clientFiles = this.files[this.currentClientId] || [];
        if (clientFiles.length === 0) {
            alert('Nenhum arquivo disponível para download.');
            return;
        }

        // Agrupar arquivos por tipo
        const fileTypes = {};
        clientFiles.forEach(file => {
            const type = this.getFileType(file.type);
            if (!fileTypes[type]) {
                fileTypes[type] = [];
            }
            fileTypes[type].push(file);
        });

        // Renderizar lista de tipos
        const container = document.getElementById('fileTypesList');
        container.innerHTML = Object.entries(fileTypes).map(([type, files]) => {
            const totalSize = files.reduce((total, file) => total + (file.size || 0), 0);
            const formattedSize = this.formatFileSize(totalSize);
            return `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                        <p class="font-medium text-gray-900">${type}</p>
                        <p class="text-sm text-gray-500">${files.length} arquivo${files.length !== 1 ? 's' : ''} • ${formattedSize}</p>
                    </div>
                    <button onclick="storageSystem.downloadFilesByType('${type}')" 
                            class="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm">
                        <i class="fas fa-download mr-1"></i>Baixar
                    </button>
                </div>
            `;
        }).join('');

        document.getElementById('downloadByTypeModal').classList.remove('hidden');
    }

    closeDownloadByTypeModal() {
        document.getElementById('downloadByTypeModal').classList.add('hidden');
    }

    downloadFilesByType(type) {
        if (!this.currentClientId) return;
        
        const clientFiles = this.files[this.currentClientId] || [];
        const filesOfType = clientFiles.filter(file => this.getFileType(file.type) === type);
        
        if (filesOfType.length === 0) {
            alert('Nenhum arquivo encontrado deste tipo.');
            return;
        }

        const client = this.clients.find(c => c.id === this.currentClientId);
        const clientName = client ? client.name : 'cliente';
        
        // Se houver apenas um arquivo, baixar diretamente
        if (filesOfType.length === 1) {
            this.downloadFile(filesOfType[0].id);
            this.closeDownloadByTypeModal();
            return;
        }

        // Para múltiplos arquivos, usar JSZip
        if (typeof JSZip === 'undefined') {
            // Fallback: baixar arquivos individualmente
            alert('Baixando arquivos individualmente...');
            filesOfType.forEach((file, index) => {
                setTimeout(() => this.downloadFile(file.id), index * 500);
            });
            this.closeDownloadByTypeModal();
            return;
        }

        // Mostrar indicador de progresso
        const progressModal = this.showProgressModal('Preparando arquivos para download...');
        this.closeDownloadByTypeModal();
        
        // Usar JSZip para criar um arquivo ZIP
        const zip = new JSZip();
        let processedFiles = 0;
        let totalFiles = filesOfType.length;

        filesOfType.forEach(file => {
            if (file.content) {
                fetch(file.content)
                    .then(res => res.blob())
                    .then(blob => {
                        zip.file(file.name, blob);
                        processedFiles++;
                        
                        const progress = Math.round((processedFiles / totalFiles) * 100);
                        this.updateProgressModal(progressModal, `Processando arquivos... ${progress}%`);
                        
                        if (processedFiles === totalFiles) {
                            this.updateProgressModal(progressModal, 'Gerando arquivo ZIP...');
                            zip.generateAsync({type: 'blob'}).then(content => {
                                const url = window.URL.createObjectURL(content);
                                const a = document.createElement('a');
                                a.style.display = 'none';
                                a.href = url;
                                a.download = `${clientName}_${type}_arquivos.zip`;
                                
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(url);
                                document.body.removeChild(a);
                                
                                this.closeProgressModal(progressModal);
                            });
                        }
                    })
                    .catch(error => {
                        console.error('Erro ao processar arquivo:', error);
                        processedFiles++;
                        
                        if (processedFiles === totalFiles) {
                            this.closeProgressModal(progressModal);
                            alert('Alguns arquivos não puderam ser processados.');
                        }
                    });
            } else {
                processedFiles++;
                if (processedFiles === totalFiles) {
                    this.closeProgressModal(progressModal);
                }
            }
        });
    }

    getFileType(mimeType) {
        if (!mimeType) return 'Desconhecido';
        
        const typeMap = {
            'image/': 'Imagens',
            'video/': 'Vídeos',
            'audio/': 'Áudios',
            'text/': 'Documentos de Texto',
            'application/pdf': 'PDFs',
            'application/msword': 'Documentos Word',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Documentos Word',
            'application/vnd.ms-excel': 'Planilhas Excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Planilhas Excel',
            'application/zip': 'Arquivos ZIP',
            'application/x-rar-compressed': 'Arquivos RAR'
        };

        for (const [key, value] of Object.entries(typeMap)) {
            if (mimeType.startsWith(key) || mimeType === key) {
                return value;
            }
        }

        return 'Outros';
    }

    // Métodos de busca e filtro
    handleSearch(query) {
        const filteredClients = this.clients.filter(client => 
            client.name.toLowerCase().includes(query.toLowerCase()) ||
            client.email.toLowerCase().includes(query.toLowerCase()) ||
            (client.phone && client.phone.includes(query))
        );
        this.renderFilteredClients(filteredClients);
    }

    handleGroupFilter(groupId) {
        let filteredClients = this.clients;
        if (groupId !== 'all') {
            filteredClients = this.clients.filter(client => client.groupId === groupId);
        }
        this.renderFilteredClients(filteredClients);
    }

    handleStatusFilter(status) {
        let filteredClients = this.clients;
        if (status !== 'all') {
            filteredClients = this.clients.filter(client => client.status === status);
        }
        this.renderFilteredClients(filteredClients);
    }

    renderFilteredClients(clients) {
        const clientsGrid = document.getElementById('clientsGrid');
        
        if (clients.length === 0) {
            clientsGrid.innerHTML = `
                <div class="col-span-full text-center py-8 text-gray-500">
                    <i class="fas fa-search text-4xl mb-4"></i>
                    <p>Nenhum cliente encontrado com os filtros aplicados.</p>
                </div>
            `;
            return;
        }

        // Reutilizar a lógica de renderização de clientes
        this.renderClients();
    }

    // Métodos de confirmação
    showConfirmModal(message, onConfirm) {
        document.getElementById('confirmMessage').textContent = message;
        document.getElementById('confirmModal').classList.remove('hidden');
        
        const confirmBtn = document.getElementById('confirmDelete');
        const oldOnClick = confirmBtn.onclick;
        
        confirmBtn.onclick = () => {
            onConfirm();
            this.closeConfirmModal();
            confirmBtn.onclick = oldOnClick;
        };
    }

    closeConfirmModal() {
        document.getElementById('confirmModal').classList.add('hidden');
    }

    // Métodos utilitários
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    saveData() {
        localStorage.setItem('clients', JSON.stringify(this.clients));
        localStorage.setItem('groups', JSON.stringify(this.groups));
        localStorage.setItem('files', JSON.stringify(this.files));
    }
}

// Inicializar o sistema
const storageSystem = new StorageSystem(); 