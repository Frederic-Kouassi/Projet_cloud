let allTasks = [];
let allCategories = [];
let currentView = 'grid';
let deleteTaskId = null;
let currentTaskDetail = null;

// Charger la navbar et sidebar
async function loadComponents() {
    try {
        const navbarResponse = await fetch('components/navbar.html');
        const navbarHtml = await navbarResponse.text();
        document.getElementById('navbar-container').innerHTML = navbarHtml;
        
        const sidebarResponse = await fetch('components/sidebar.html');
        const sidebarHtml = await sidebarResponse.text();
        document.getElementById('sidebar-container').innerHTML = sidebarHtml;
        
        // Initialiser le thème après chargement
        initTheme();
        
        // Charger les catégories dans la sidebar
        await loadCategoriesSidebar();
        
    } catch (error) {
        console.error('Erreur lors du chargement des composants:', error);
    }
}

// Charger les catégories dans la sidebar
async function loadCategoriesSidebar() {
    try {
        allCategories = await getCategories();
        const categoriesList = document.getElementById('categories-list');
        if (categoriesList) {
            categoriesList.innerHTML = allCategories.map(cat => `
                <li class="mb-2">
                    <button onclick="filterByCategory(${cat.id})" class="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-300 flex items-center">
                        <i class="fas ${cat.icon || 'fa-folder'} mr-2" style="color: ${cat.color || '#3b82f6'}"></i>
                        <span class="flex-1">${escapeHtml(cat.name)}</span>
                        <span class="text-xs text-gray-500">${cat.task_count || 0}</span>
                    </button>
                </li>
            `).join('');
        }
    } catch (error) {
        console.error('Erreur chargement catégories:', error);
    }
}

// Afficher les statistiques avancées
async function updateAdvancedStats(tasks) {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const overdue = tasks.filter(t => !t.completed && t.due_date && new Date(t.due_date) < new Date()).length;
    const highPriority = tasks.filter(t => t.priority === 'high' && !t.completed).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    
    const statsContainer = document.getElementById('stats-container');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="stat-card bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 dark:text-gray-400 text-sm">Total tâches</p>
                        <p class="text-2xl font-bold text-gray-800 dark:text-white">${total}</p>
                    </div>
                    <i class="fas fa-list-check text-3xl text-blue-500"></i>
                </div>
            </div>
            <div class="stat-card bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 dark:text-gray-400 text-sm">Terminées</p>
                        <p class="text-2xl font-bold text-green-600">${completed}</p>
                    </div>
                    <i class="fas fa-square-check text-3xl text-green-500"></i>
                </div>
            </div>
            <div class="stat-card bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 dark:text-gray-400 text-sm">En cours</p>
                        <p class="text-2xl font-bold text-yellow-600">${pending}</p>
                    </div>
                    <i class="fas fa-circle-dot text-3xl text-yellow-500"></i>
                </div>
            </div>
            <div class="stat-card bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 dark:text-gray-400 text-sm">En retard</p>
                        <p class="text-2xl font-bold text-red-600">${overdue}</p>
                    </div>
                    <i class="fas fa-hourglass-end text-3xl text-red-500"></i>
                </div>
            </div>
            <div class="stat-card bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 dark:text-gray-400 text-sm">Progression</p>
                        <p class="text-2xl font-bold text-purple-600">${percent}%</p>
                    </div>
                    <div class="w-12">
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${percent}%"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Mettre à jour le compteur
    const tasksCountSpan = document.getElementById('tasks-count');
    if (tasksCountSpan) tasksCountSpan.textContent = tasks.length;
}

// Afficher les tâches
async function displayTasks() {
    const container = document.getElementById('tasks-container');
    if (!container) return;
    
    try {
        let tasks = await getTasks();
        allTasks = tasks;
        
        // Appliquer les filtres
        let filteredTasks = filterTasks(tasks);
        filteredTasks = sortTasks(filteredTasks);
        
        // Mettre à jour les stats
        await updateAdvancedStats(tasks);
        
        if (!filteredTasks || filteredTasks.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-inbox text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
                    <p class="text-gray-500 dark:text-gray-400 text-lg">Aucune tâche trouvée</p>
                    <p class="text-gray-400 dark:text-gray-500 mt-2">Essayez de modifier vos filtres ou créez une nouvelle tâche</p>
                    <a href="add.html" class="inline-block mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition duration-300">
                        <i class="fas fa-square-plus mr-2"></i>Créer une tâche
                    </a>
                </div>
            `;
            return;
        }
        
        container.className = currentView === 'grid' 
            ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'list-view space-y-4';
        
        container.innerHTML = '';
        
        filteredTasks.forEach(task => {
            const taskCard = createAdvancedTaskCard(task);
            container.appendChild(taskCard);
        });
        
    } catch (error) {
        console.error('Erreur lors du chargement des tâches:', error);
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-triangle-exclamation text-6xl text-red-500 mb-4"></i>
                <p class="text-red-500">Erreur de chargement des tâches</p>
                <button onclick="location.reload()" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg">
                    <i class="fas fa-arrows-rotate mr-2"></i>Réessayer
                </button>
            </div>
        `;
    }
}

// Créer une carte de tâche avancée
function createAdvancedTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden task-card cursor-pointer';
    card.dataset.id = task.id;
    
    const priorityClass = task.priority === 'high' ? 'priority-high' : task.priority === 'medium' ? 'priority-medium' : 'priority-low';
    const priorityText = task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse';
    const priorityIcon = task.priority === 'high' ? 'fa-arrow-up' : task.priority === 'medium' ? 'fa-minus' : 'fa-arrow-down';
    
    const dueDate = task.due_date ? new Date(task.due_date) : null;
    const isOverdue = dueDate && dueDate < new Date() && !task.completed;
    const daysUntilDue = dueDate ? Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24)) : null;
    
    // Trouver la catégorie
    const category = allCategories.find(c => c.id === task.category_id);
    
    card.innerHTML = `
        <div class="p-6" onclick="showTaskDetail(${task.id})">
            <div class="flex justify-between items-start mb-3">
                <div class="flex-1">
                    <h3 class="text-xl font-semibold text-gray-800 dark:text-white ${task.completed ? 'line-through opacity-75' : ''}">
                        ${escapeHtml(task.title)}
                    </h3>
                    ${category ? `
                        <div class="mt-1">
                            <span class="category-badge text-xs">
                                <i class="fas ${category.icon || 'fa-folder'} mr-1"></i>
                                ${escapeHtml(category.name)}
                            </span>
                        </div>
                    ` : ''}
                </div>
                <div class="flex gap-2">
                    <span class="priority-badge ${priorityClass}">
                        <i class="fas ${priorityIcon} mr-1"></i>${priorityText}
                    </span>
                </div>
            </div>
            
            <p class="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">${escapeHtml(task.description) || 'Pas de description'}</p>
            
            ${dueDate ? `
                <div class="mb-4 ${isOverdue ? 'text-red-500' : daysUntilDue <= 2 ? 'text-orange-500' : 'text-gray-500'} text-sm">
                    <i class="far fa-calendar-alt mr-2"></i>
                    Échéance: ${formatDate(dueDate)}
                    ${isOverdue ? '<span class="ml-2"><i class="fas fa-triangle-exclamation"></i> En retard</span>' : daysUntilDue <= 2 && daysUntilDue > 0 ? `<span class="ml-2"><i class="fas fa-hourglass-start"></i> J-${daysUntilDue}</span>` : ''}
                </div>
            ` : ''}
            
            ${task.subtasks && task.subtasks.length > 0 ? `
                <div class="mb-4">
                    <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span>Sous-tâches</span>
                        <span>${task.subtasks.filter(st => st.completed).length}/${task.subtasks.length}</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${(task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100}%"></div>
                    </div>
                </div>
            ` : ''}
            
            <div class="flex gap-3 mt-4" onclick="event.stopPropagation()">
                <button onclick="toggleComplete(${task.id}, ${!task.completed})" 
                        class="flex-1 ${task.completed ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'} text-white px-4 py-2 rounded-lg transition duration-300 text-sm">
                    <i class="fas ${task.completed ? 'fa-check-circle' : 'fa-check'} mr-2"></i>
                    ${task.completed ? 'Terminé' : 'Marquer terminé'}
                </button>
                <a href="edit.html?id=${task.id}" class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition duration-300 text-sm text-center">
                    <i class="fas fa-pen-to-square"></i>
                </a>
                <button onclick="confirmDelete(${task.id})" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-300 text-sm">
                    <i class="fas fa-trash-can"></i>
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// Afficher les détails d'une tâche
async function showTaskDetail(taskId) {
    try {
        const task = await getTask(taskId);
        currentTaskDetail = task;
        
        const subtasks = await getSubtasks(taskId);
        
        const modal = document.getElementById('task-detail-modal');
        const content = document.getElementById('task-detail-content');
        
        const category = allCategories.find(c => c.id === task.category_id);
        
        content.innerHTML = `
            <div class="space-y-4">
                <div class="flex justify-between items-start">
                    <h2 class="text-2xl font-bold dark:text-white">${escapeHtml(task.title)}</h2>
                    <span class="priority-badge ${task.priority === 'high' ? 'priority-high' : task.priority === 'medium' ? 'priority-medium' : 'priority-low'}">
                        ${task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'} priorité
                    </span>
                </div>
                
                ${category ? `
                    <div class="flex items-center">
                        <i class="fas ${category.icon || 'fa-folder'} mr-2" style="color: ${category.color || '#3b82f6'}"></i>
                        <span>Catégorie: ${escapeHtml(category.name)}</span>
                    </div>
                ` : ''}
                
                <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 class="font-semibold mb-2 dark:text-white">Description</h3>
                    <p class="text-gray-600 dark:text-gray-300">${escapeHtml(task.description) || 'Aucune description'}</p>
                </div>
                
                ${task.due_date ? `
                    <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h3 class="font-semibold mb-2 dark:text-white">Date d'échéance</h3>
                        <p class="text-gray-600 dark:text-gray-300">${formatDate(new Date(task.due_date))}</p>
                    </div>
                ` : ''}
                
                <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 class="font-semibold mb-2 dark:text-white">Sous-tâches</h3>
                    <div id="subtasks-list" class="space-y-2">
                        ${subtasks.map(st => `
                            <div class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                <div class="flex items-center">
                                    <input type="checkbox" ${st.completed ? 'checked' : ''} 
                                           onchange="toggleSubtask(${task.id}, ${st.id}, this.checked)"
                                           class="mr-3 w-4 h-4">
                                    <span class="${st.completed ? 'line-through text-gray-500' : 'dark:text-white'}">${escapeHtml(st.title)}</span>
                                </div>
                                <button onclick="deleteSubtask(${task.id}, ${st.id})" class="text-red-500 hover:text-red-600">
                                    <i class="fas fa-trash-can"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    <div class="mt-3 flex gap-2">
                        <input type="text" id="new-subtask" placeholder="Nouvelle sous-tâche..." 
                               class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
                        <button onclick="addSubtask(${task.id})" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
                            <i class="fas fa-square-plus"></i> Ajouter
                        </button>
                    </div>
                </div>
                
                <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 class="font-semibold mb-2 dark:text-white">Informations</h3>
                    <p class="text-sm text-gray-500">Créée le: ${formatDate(new Date(task.created_at))}</p>
                    <p class="text-sm text-gray-500">Statut: ${task.completed ? '<i class="fas fa-square-check"></i> Terminée' : '<i class="fas fa-circle-dot"></i> En cours'}</p>
                </div>
            </div>
        `;
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
    } catch (error) {
        console.error('Erreur chargement détails:', error);
        showNotification('Erreur lors du chargement des détails', 'error');
    }
}

// Toggle completion
async function toggleComplete(id, completed) {
    try {
        const task = await getTask(id);
        task.completed = completed;
        await updateTask(id, task);
        showNotification(completed ? 'Tâche terminée ! 🎉' : 'Tâche réactivée', 'success');
        displayTasks();
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors de la mise à jour', 'error');
    }
}

// Dans js/main.js ou directement dans add.js
async function loadNavbar() {
    try {
        const response = await fetch('components/navbar.html');
        const navbarHtml = await response.text();
        document.getElementById('navbar-container').innerHTML = navbarHtml;
    } catch (error) {
        console.error('Erreur lors du chargement de la navbar:', error);
    }
}

// Ajouter une sous-tâche
async function addSubtask(taskId) {
    const input = document.getElementById('new-subtask');
    const title = input.value.trim();
    
    if (!title) {
        showNotification('Veuillez entrer un titre pour la sous-tâche', 'warning');
        return;
    }
    
    try {
        await createSubtask(taskId, { title, completed: false });
        showNotification('Sous-tâche ajoutée', 'success');
        input.value = '';
        showTaskDetail(taskId);
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors de l\'ajout', 'error');
    }
}

// Basculer une sous-tâche
async function toggleSubtask(taskId, subtaskId, completed) {
    try {
        await updateSubtask(taskId, subtaskId, { completed });
        showNotification(completed ? 'Sous-tâche terminée' : 'Sous-tâche réactivée', 'success');
        showTaskDetail(taskId);
        displayTasks();
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors de la mise à jour', 'error');
    }
}

// Supprimer une sous-tâche
async function deleteSubtask(taskId, subtaskId) {
    if (confirm('Supprimer cette sous-tâche ?')) {
        try {
            await deleteSubtask(taskId, subtaskId);
            showNotification('Sous-tâche supprimée', 'success');
            showTaskDetail(taskId);
            displayTasks();
        } catch (error) {
            console.error('Erreur:', error);
            showNotification('Erreur lors de la suppression', 'error');
        }
    }
}

// Confirmer la suppression
function confirmDelete(id) {
    deleteTaskId = id;
    const modal = document.getElementById('confirm-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

// Supprimer une tâche
async function deleteTaskHandler() {
    if (!deleteTaskId) return;
    
    try {
        await deleteTask(deleteTaskId);
        showNotification('Tâche supprimée avec succès', 'success');
        displayTasks();
        closeModal();
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        showNotification('Erreur lors de la suppression', 'error');
    }
}

// Fermer le modal
function closeModal() {
    const modal = document.getElementById('confirm-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    deleteTaskId = null;
}

// Fermer le modal de détails
function closeDetailModal() {
    const modal = document.getElementById('task-detail-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// Filtrer par catégorie
function filterByCategory(categoryId) {
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.value = categoryId.toString();
        displayTasks();
    }
}

// Exporter les données
function exportData() {
    exportTasks();
    showNotification('Export lancé', 'success');
}

// Changer la vue
function switchView(view) {
    currentView = view;
    const gridBtn = document.getElementById('grid-view');
    const listBtn = document.getElementById('list-view');
    
    if (view === 'grid') {
        gridBtn.className = 'px-4 py-2 rounded-lg transition duration-300 bg-blue-500 text-white';
        listBtn.className = 'px-4 py-2 rounded-lg transition duration-300 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    } else {
        listBtn.className = 'px-4 py-2 rounded-lg transition duration-300 bg-blue-500 text-white';
        gridBtn.className = 'px-4 py-2 rounded-lg transition duration-300 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
    
    displayTasks();
}

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    await loadComponents();
    await displayTasks();
    
    // Écouteurs d'événements
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.addEventListener('input', () => displayTasks());
    
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) statusFilter.addEventListener('change', () => displayTasks());
    
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) categoryFilter.addEventListener('change', () => displayTasks());
    
    const priorityFilter = document.getElementById('priority-filter');
    if (priorityFilter) priorityFilter.addEventListener('change', () => displayTasks());
    
    const sortBy = document.getElementById('sort-by');
    if (sortBy) sortBy.addEventListener('change', () => displayTasks());
    
    const clearFiltersBtn = document.getElementById('clear-filters');
    if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', clearFilters);
    
    const gridViewBtn = document.getElementById('grid-view');
    if (gridViewBtn) gridViewBtn.addEventListener('click', () => switchView('grid'));
    
    const listViewBtn = document.getElementById('list-view');
    if (listViewBtn) listViewBtn.addEventListener('click', () => switchView('list'));
    
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', deleteTaskHandler);
    
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeModal);
    
    const closeDetailBtn = document.getElementById('close-detail-modal');
    if (closeDetailBtn) closeDetailBtn.addEventListener('click', closeDetailModal);
    
    const exportBtn = document.getElementById('export-data');
    if (exportBtn) exportBtn.addEventListener('click', exportData);
    
    // Message de bienvenue
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Bon matin' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
    const greetingElement = document.getElementById('greeting');
    if (greetingElement) greetingElement.textContent = `${greeting}, bienvenue sur TaskFlow Ultra`;
});

// Rendre les fonctions disponibles globalement
window.toggleComplete = toggleComplete;
window.confirmDelete = confirmDelete;
window.deleteTaskHandler = deleteTaskHandler;
window.showTaskDetail = showTaskDetail;
window.addSubtask = addSubtask;
window.toggleSubtask = toggleSubtask;
window.deleteSubtask = deleteSubtask;
window.filterByCategory = filterByCategory;
window.exportData = exportData;
window.switchView = switchView;