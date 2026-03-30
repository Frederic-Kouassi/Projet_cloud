let categories = [];

// Charger la navbar et les catégories
async function loadData() {
    await loadNavbar();
    try {
        categories = await getCategories();
        const categorySelect = document.getElementById('category');
        if (categorySelect) {
            // Correction: bien formater les options HTML
            let optionsHtml = '<option value="">Sans catégorie</option>';
            
            categories.forEach(cat => {
                optionsHtml += `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`;
            });
            
            categorySelect.innerHTML = optionsHtml;
        }
    } catch (error) {
        console.error('Erreur chargement catégories:', error);
        // En cas d'erreur, au moins avoir l'option "Sans catégorie"
        const categorySelect = document.getElementById('category');
        if (categorySelect) {
            categorySelect.innerHTML = '<option value="">Sans catégorie</option>';
        }
    }
}

// Gestionnaire du formulaire
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initTheme();
    
    const form = document.getElementById('task-form');
    const descriptionInput = document.getElementById('description');
    const charCountDiv = document.getElementById('char-count');
    
    if (descriptionInput && charCountDiv) {
        descriptionInput.addEventListener('input', () => {
            const count = descriptionInput.value.length;
            charCountDiv.textContent = `${count} caractères`;
            if (count > 500) {
                charCountDiv.classList.add('text-red-500');
            } else {
                charCountDiv.classList.remove('text-red-500');
            }
        });
    }
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const title = document.getElementById('title').value.trim();
            const description = document.getElementById('description').value.trim();
            const priority = document.getElementById('priority').value;
            const dueDate = document.getElementById('due-date').value;
            const categoryId = document.getElementById('category').value;
            
            if (!title) {
                showNotification('Le titre est obligatoire', 'warning');
                return;
            }
            
            if (title.length < 3) {
                showNotification('Le titre doit contenir au moins 3 caractères', 'warning');
                return;
            }
            
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Création en cours...';;
            
            try {
                const taskData = {
                    title: title,
                    description: description,
                    completed: false,
                    priority: priority,
                    due_date: dueDate || null,
                    category_id: categoryId || null,
                    created_at: new Date().toISOString()
                };
                
                await createTask(taskData);
                showNotification('Tâche créée avec succès ! 🎉', 'success');
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
                
            } catch (error) {
                console.error('Erreur lors de la création:', error);
                showNotification('Erreur lors de la création de la tâche', 'error');
                submitButton.disabled = false;
                submitButton.innerHTML = '<i class="fas fa-floppy-disk mr-2"></i>Créer la tâche';
            }
        });
    }
});