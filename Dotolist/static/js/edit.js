let taskId = null;

// Charger la navbar
async function loadNavbar() {
    try {
        const response = await fetch('components/navbar.html');
        const navbarHtml = await response.text();
        document.getElementById('navbar-container').innerHTML = navbarHtml;
        initTheme();
    } catch (error) {
        console.error('Erreur lors du chargement de la navbar:', error);
    }
}

// Récupérer l'ID de la tâche depuis l'URL
function getTaskIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Charger les données de la tâche
async function loadTaskData() {
    taskId = getTaskIdFromUrl();
    
    if (!taskId) {
        showFormError('ID de tâche manquant');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
    
    try {
        const task = await getTask(taskId);
        
        document.getElementById('title').value = task.title;
        document.getElementById('description').value = task.description || '';
        document.getElementById('completed').checked = task.completed;
        
    } catch (error) {
        console.error('Erreur lors du chargement de la tâche:', error);
        showFormError('Tâche non trouvée');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }
}

// Gestionnaire du formulaire de modification
document.addEventListener('DOMContentLoaded', () => {
    loadNavbar();
    loadTaskData();
    
    const form = document.getElementById('task-form');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('title').value.trim();
        const description = document.getElementById('description').value.trim();
        const completed = document.getElementById('completed').checked;
        
        if (!title) {
            showFormError('Le titre est obligatoire');
            return;
        }
        
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Enregistrement...';;
        
        try {
            const taskData = {
                title: title,
                description: description,
                completed: completed
            };
            
            await updateTask(taskId, taskData);
            showNotification('Tâche modifiée avec succès !', 'success');
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            
        } catch (error) {
            console.error('Erreur lors de la modification:', error);
            showFormError('Erreur lors de la modification');
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-floppy-disk mr-2"></i>Enregistrer';
        }
    });
});

function showFormError(message) {
    const messageDiv = document.getElementById('message');
    messageDiv.innerHTML = `
        <div class="p-4 rounded-lg bg-red-100 text-red-700">
            <i class="fas fa-circle-exclamation mr-2"></i>${message}
        </div>
    `;
    
    setTimeout(() => {
        messageDiv.innerHTML = '';
    }, 3000);
}