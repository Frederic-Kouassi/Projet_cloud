// Configuration de l'API
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// État de l'API
let isOnline = navigator.onLine;
let pendingRequests = [];

// Vérifier la connexion
window.addEventListener('online', () => {
    isOnline = true;
    showNotification('Connexion rétablie', 'success');
    retryPendingRequests();
});

window.addEventListener('offline', () => {
    isOnline = false;
    showNotification('Pas de connexion internet. Les données seront sauvegardées localement.', 'warning');
});

// Fonction générique pour les appels API avec retry et cache
async function apiCall(endpoint, method = 'GET', data = null, retries = 3) {
    const cacheKey = `${method}:${endpoint}`;
    
    // Vérifier le cache pour les GET
    if (method === 'GET' && !data) {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached && navigator.onLine) {
            return JSON.parse(cached);
        }
    }
    
    if (!isOnline && method !== 'GET') {
        // Sauvegarder pour plus tard
        pendingRequests.push({ endpoint, method, data });
        throw new Error('Mode hors ligne - requête sauvegardée');
    }
    
    const url = `${API_BASE_URL}${endpoint}`;
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        let result;
        if (method === 'DELETE') {
            result = { success: true };
        } else {
            result = await response.json();
            // Mettre en cache les résultats GET
            if (method === 'GET') {
                sessionStorage.setItem(cacheKey, JSON.stringify(result));
            }
        }
        
        return result;
    } catch (error) {
        if (retries > 0 && error.message.includes('fetch')) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return apiCall(endpoint, method, data, retries - 1);
        }
        throw error;
    }
}

// Fonctions pour les tâches
async function getTasks() {
    return await apiCall('/tasks/');
}

async function getTask(id) {
    return await apiCall(`/tasks/${id}/`);
}

async function createTask(taskData) {
    return await apiCall('/tasks/', 'POST', taskData);
}

async function updateTask(id, taskData) {
    return await apiCall(`/tasks/${id}/`, 'PUT', taskData);
}

async function deleteTask(id) {
    return await apiCall(`/tasks/${id}/`, 'DELETE');
}

// Fonctions pour les catégories
async function getCategories() {
    return await apiCall('/categories/');
}

async function createCategory(categoryData) {
    return await apiCall('/categories/', 'POST', categoryData);
}

async function updateCategory(id, categoryData) {
    return await apiCall(`/categories/${id}/`, 'PUT', categoryData);
}

async function deleteCategory(id) {
    return await apiCall(`/categories/${id}/`, 'DELETE');
}

// Fonctions pour les sous-tâches
async function getSubtasks(taskId) {
    return await apiCall(`/tasks/${taskId}/subtasks/`);
}

async function createSubtask(taskId, subtaskData) {
    return await apiCall(`/tasks/${taskId}/subtasks/`, 'POST', subtaskData);
}

async function updateSubtask(taskId, subtaskId, subtaskData) {
    return await apiCall(`/tasks/${taskId}/subtasks/${subtaskId}/`, 'PUT', subtaskData);
}

async function deleteSubtask(taskId, subtaskId) {
    return await apiCall(`/tasks/${taskId}/subtasks/${subtaskId}/`, 'DELETE');
}

// Fonctions pour les tags
async function getTags() {
    return await apiCall('/tags/');
}

async function addTagToTask(taskId, tagId) {
    return await apiCall(`/tasks/${taskId}/tags/`, 'POST', { tag_id: tagId });
}

async function removeTagFromTask(taskId, tagId) {
    return await apiCall(`/tasks/${taskId}/tags/${tagId}/`, 'DELETE');
}

// Export des données
async function exportTasks() {
    const tasks = await getTasks();
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `taskflow-export-${new Date().toISOString().slice(0,19)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Retry des requêtes en attente
function retryPendingRequests() {
    pendingRequests.forEach(request => {
        apiCall(request.endpoint, request.method, request.data)
            .catch(console.error);
    });
    pendingRequests = [];
}


// Dans js/api.js
async function getCategories() {
    return await apiCall('/categories/');
}

// Export global
window.api = {
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getSubtasks,
    createSubtask,
    updateSubtask,
    deleteSubtask,
    getTags,
    addTagToTask,
    removeTagFromTask,
    exportTasks
};