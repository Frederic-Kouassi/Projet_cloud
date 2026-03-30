let categories = [];

// Charger les catégories
async function loadCategories() {
    try {
        categories = await getCategories();
        displayCategories();
    } catch (error) {
        console.error('Erreur chargement catégories:', error);
        showNotification('Erreur de chargement des catégories', 'error');
    }
}

// Afficher les catégories
function displayCategories() {
    const container = document.getElementById('categories-grid');
    if (!container) return;
    
    if (categories.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-8">
                <i class="fas fa-folder-open text-4xl text-gray-400 mb-2"></i>
                <p class="text-gray-500">Aucune catégorie pour le moment</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = categories.map(cat => `
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex items-center justify-between">
            <div class="flex items-center">
                <i class="fas ${cat.icon || 'fa-folder'} text-2xl mr-3" style="color: ${cat.color || '#3b82f6'}"></i>
                <div>
                    <h3 class="font-semibold dark:text-white">${escapeHtml(cat.name)}</h3>
                    <p class="text-sm text-gray-500">${cat.task_count || 0} tâche(s)</p>
                </div>
            </div>
            <div class="flex gap-2">
                <button onclick="editCategory(${cat.id})" class="text-yellow-500 hover:text-yellow-600">
                    <i class="fas fa-pen-to-square"></i>
                </button>
                <button onclick="deleteCategory(${cat.id})" class="text-red-500 hover:text-red-600">
                    <i class="fas fa-trash-can"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Ajouter une catégorie
async function addCategory() {
    const nameInput = document.getElementById('category-name');
    const colorInput = document.getElementById('category-color');
    const iconSelect = document.getElementById('category-icon');
    
    const name = nameInput.value.trim();
    if (!name) {
        showNotification('Veuillez entrer un nom de catégorie', 'warning');
        return;
    }
    
    try {
        await createCategory({
            name: name,
            color: colorInput.value,
            icon: iconSelect.value
        });
        
        showNotification('Catégorie ajoutée', 'success');
        nameInput.value = '';
        await loadCategories();
        
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors de l\'ajout', 'error');
    }
}

// Supprimer une catégorie
async function deleteCategory(id) {
    if (confirm('Supprimer cette catégorie ? Les tâches associées seront décatégorisées.')) {
        try {
            await deleteCategory(id);
            showNotification('Catégorie supprimée', 'success');
            await loadCategories();
        } catch (error) {
            console.error('Erreur:', error);
            showNotification('Erreur lors de la suppression', 'error');
        }
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    await loadNavbar();
    await loadCategories();
    initTheme();
    
    const addBtn = document.getElementById('add-category');
    if (addBtn) addBtn.addEventListener('click', addCategory);
});

// Rendre disponibles globalement
window.editCategory = (id) => {
    showNotification('Fonctionnalité à venir', 'info');
};
window.deleteCategory = deleteCategory;