from django.shortcuts import render,  redirect
from django.views import View
from django.contrib import messages

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import Category






class RegisterView(View):
    template_name = 'base.html'

    def get(self, request):
        # Affiche le formulaire d'inscription
        return render(request, self.template_name)




from django.shortcuts import render, redirect
from django.views import View
from .models import Task, Category, Tag
from django.utils import timezone

class TaskCreateView(View):
    template_name = 'task_create.html'

    def get(self, request):
        # Affiche le formulaire vide
        categories = Category.objects.all()
        tags = Tag.objects.all()
        return render(request, self.template_name, {
            'categories': categories,
            'tags': tags,
        })

    def post(self, request):
        # Récupère les données du formulaire
        title = request.POST.get('title', '')
        description = request.POST.get('description', '')
        category_id = request.POST.get('category', None)
        tag_ids = request.POST.getlist('tags')
        priority = request.POST.get('priority', 'medium')
        status = request.POST.get('status', 'todo')
        due_date = request.POST.get('due_date', None)

        category = Category.objects.filter(id=category_id).first() if category_id else None
        tags = Tag.objects.filter(id__in=tag_ids) if tag_ids else []

        # Création de la tâche
        task = Task.objects.create(
            title=title,
            description=description,
            category=category,
            priority=priority,
            status=status,
            due_date=due_date if due_date else None,
        )
        if tags:
            task.tags.set(tags)

        return redirect('task_list')  # Redirige vers la liste des tâches
    
    
    
    
    
    
    
from .models import Category

class CategoryCreateView(View):
    template_name = 'base.html'

    def get(self, request):
        categories = Category.objects.all().order_by('name')
        tasks = Task.objects.all()  # si tu veux le count par catégorie
        return render(request, self.template_name, {
            'categories': categories,
            'tasks': tasks,
        })

    def post(self, request):
        # Récupère les données du formulaire
        name = request.POST.get('name', '')
        color = request.POST.get('color', '#6366f1')
        icon = request.POST.get('icon', '')

        if name:  # On ne crée que si le nom est fourni
            Category.objects.create(name=name, color=color, icon=icon)

        return redirect('category_create')  # Recharge la page avec la liste