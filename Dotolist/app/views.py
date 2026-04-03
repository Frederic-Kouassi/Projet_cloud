from django.shortcuts import render,  redirect, get_object_or_404
from django.views import View
from django.contrib import messages

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import Category

from datetime import datetime
from django.http import HttpResponse





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
            tasks = Task.objects.all().order_by('-created_at')

            data = []
            for t in tasks:
                data.append({
                    'id': t.id,
                    'title': t.title,
                    'description': t.description,
                    'priority': t.priority,
                    'status': t.status,
                    'due_date': t.due_date.strftime('%Y-%m-%d') if t.due_date else None,
                    'created_at': t.created_at.timestamp(),

                    # relations
                    'category_id': t.category.id if t.category else None,
                    'category_name': t.category.name if t.category else None,

                    'tags': [tag.name for tag in t.tags.all()]
                })

            return JsonResponse({'tasks': data})
    def post(self, request):
        try:
            title = request.POST.get('title', '').strip()
            description = request.POST.get('description', '').strip()
            category_id = request.POST.get('category')
            tag_names = request.POST.getlist('tags')
            priority = request.POST.get('priority', 'medium')
            status = request.POST.get('status', 'todo')
            due_date = request.POST.get('due_date')

            if not title:
                return JsonResponse({'ok': False, 'error': 'Titre requis'}, status=400)

            # ✅ sécuriser priority & status
            valid_priorities = [c[0] for c in Task.Priority.choices]
            valid_statuses = [c[0] for c in Task.Status.choices]

            if priority not in valid_priorities:
                priority = Task.Priority.MEDIUM

            if status not in valid_statuses:
                status = Task.Status.TODO

            # ✅ category safe
            category = None
            if category_id and category_id.isdigit():
                category = Category.objects.filter(id=category_id).first()

            # ✅ date fix
            if due_date:
                try:
                    due_date = datetime.strptime(due_date, '%Y-%m-%d')
                    due_date = due_date.replace(hour=23, minute=59, second=59)
                except:
                    due_date = None
            else:
                due_date = None

            # ✅ create task
            task = Task.objects.create(
                title=title,
                description=description,
                category=category,
                priority=priority,
                status=status,
                due_date=due_date,
            )

            # ✅ TAGS (le vrai fix 🔥)
            tags = []
            for name in tag_names:
                tag, _ = Tag.objects.get_or_create(name=name)
                tags.append(tag)

            if tags:
                task.tags.set(tags)

            return JsonResponse({
                'ok': True,
                'id': task.id,
                'title': task.title
            })

        except Exception as e:
            print("ERREUR DJANGO:", e)
            return JsonResponse({'ok': False, 'error': str(e)}, status=500)
                
                
                
    
from .models import Category

class CategoryCreateView(View):
    
    def post(self, request):
        name  = request.POST.get('name', '').strip()
        color = request.POST.get('color', '#6366f1')
        icon  = request.POST.get('icon', '')

        if not name:
            return JsonResponse({'ok': False, 'error': 'Le nom est requis.'}, status=400)

        category = Category.objects.create(name=name, color=color, icon=icon)

        return JsonResponse({
            'ok': True,
            'id':    category.id,
            'name':  category.name,
            'color': category.color,
            'icon':  category.icon,
        })
    
    
    
    
    
class TaskListAPIView(View):
     def get(self, request):
        tasks = Task.objects.all()
        data = []
        for t in tasks:
            data.append({
                'id':           t.id,
                'title':        t.title,
                'description':  t.description,
                'category_id':  t.category.id if t.category else None,
                'category_name':t.category.name if t.category else None,
                'priority':     t.priority,
                'status':       t.status,
                'due_date':     t.due_date.isoformat() if t.due_date else None,
                'tags':         [tag.name for tag in t.tags.all()],
                'created_at':   t.created_at.timestamp() * 1000,  # ms pour JS
            })

        return HttpResponse(
            json.dumps({
                'tasks':       data,
                'total':       tasks.count(),
                'done':        tasks.filter(status='done').count(),
            }, ensure_ascii=False),
            content_type='application/json; charset=utf-8'
        )
    
    

class CategoryListAPIView(View):
    def get(self, request):
        categories = Category.objects.all().order_by('name')
        
        print(f"[DEBUG] Nombre de catégories : {categories.count()}")  # log terminal
        
        data = []
        for c in categories:
            task_count = Task.objects.filter(category=c).count()
            print(f"[DEBUG] Catégorie : {c.name} | icon={c.icon} | color={c.color} | tasks={task_count}")
            data.append({
                'id':    c.id,
                'name':  c.name,
                'icon':  c.icon if c.icon else '📁',
                'color': c.color,
                'task_count': task_count,
            })
        
        return JsonResponse({'categories': data})
    
    
    
    
    
    
    import json
from django.views import View
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

# ── Modifier une catégorie ────────────────────────────────────────
@method_decorator(csrf_exempt, name='dispatch')
class CategoryUpdateAPIView(View):
    def post(self, request, pk):
        try:
            category = Category.objects.get(pk=pk)
        except Category.DoesNotExist:
            return JsonResponse({'ok': False, 'error': 'Catégorie introuvable'}, status=404)

        data = request.POST  # FormData
        if 'name' in data:
            category.name = data['name'].strip()
        if 'icon' in data:
            category.icon = data['icon']
        if 'color' in data:
            category.color = data['color']
        category.save()
        return JsonResponse({'ok': True, 'id': category.id, 'name': category.name})


# ── Supprimer une catégorie ───────────────────────────────────────
@method_decorator(csrf_exempt, name='dispatch')
class CategoryDeleteAPIView(View):
    def post(self, request, pk):
        try:
            category = Category.objects.get(pk=pk)
        except Category.DoesNotExist:
            return JsonResponse({'ok': False, 'error': 'Catégorie introuvable'}, status=404)

        name = category.name
        category.delete()   # les tâches liées passent à category=NULL (SET_NULL)
        return JsonResponse({'ok': True, 'deleted': name})
    
    
    

    
# /api/tasks/<pk>/update/
class TaskUpdateAPIView(View):
    def post(self, request, pk):
        task = get_object_or_404(Task, pk=pk)
        data = request.POST
        if 'title'       in data: task.title       = data['title'].strip()
        if 'description' in data: task.description = data['description'].strip()
        if 'priority'    in data: task.priority    = data['priority']
        if 'status'      in data: task.status      = data['status']
        if 'due_date'    in data: task.due_date     = data['due_date'] or None
        if 'category'    in data:
            cat_id = data['category']
            task.category = Category.objects.get(pk=cat_id) if cat_id else None
        task.save()
        return JsonResponse({'ok': True})

# /api/tasks/<pk>/delete/
class TaskDeleteAPIView(View):
    def post(self, request, pk):
        task = get_object_or_404(Task, pk=pk)
        title = task.title
        task.delete()
        return JsonResponse({'ok': True, 'deleted': title})