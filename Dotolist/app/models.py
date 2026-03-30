from django.db import models
from django.utils.text import slugify
from django.utils import timezone


class Category(models.Model):
    """Catégorie pour regrouper les tâches."""

    name = models.CharField(max_length=100, unique=True, verbose_name="Nom")
    color = models.CharField(
        max_length=7,
        default="#6366f1",
        help_text="Couleur hexadécimale (ex: #6366f1)",
        verbose_name="Couleur",
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        help_text="Nom d'icône (ex: 'work', 'home', 'shopping')",
        verbose_name="Icône",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créée le")

    class Meta:
        verbose_name = "Catégorie"
        verbose_name_plural = "Catégories"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Tag(models.Model):
    """Étiquette libre pour affiner le classement des tâches."""

    name = models.CharField(max_length=50, unique=True, verbose_name="Nom")
    slug = models.SlugField(max_length=50, unique=True, blank=True)

    class Meta:
        verbose_name = "Étiquette"
        verbose_name_plural = "Étiquettes"
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Task(models.Model):
    """Tâche principale de la todolist."""

    class Priority(models.TextChoices):
        LOW = "low", "Basse"
        MEDIUM = "medium", "Moyenne"
        HIGH = "high", "Haute"
        URGENT = "urgent", "Urgente"

    class Status(models.TextChoices):
        TODO = "todo", "À faire"
        IN_PROGRESS = "in_progress", "En cours"
        DONE = "done", "Terminée"
        CANCELLED = "cancelled", "Annulée"

    # Contenu
    title = models.CharField(max_length=255, verbose_name="Titre")
    description = models.TextField(blank=True, verbose_name="Description")

    # Classification
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tasks",
        verbose_name="Catégorie",
    )
    tags = models.ManyToManyField(
        Tag,
        blank=True,
        related_name="tasks",
        verbose_name="Étiquettes",
    )

    # État
    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.MEDIUM,
        verbose_name="Priorité",
    )
    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.TODO,
        verbose_name="Statut",
    )

    # Dates
    due_date = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Échéance",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créée le")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Modifiée le")

    class Meta:
        verbose_name = "Tâche"
        verbose_name_plural = "Tâches"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["priority"]),
            models.Index(fields=["due_date"]),
            models.Index(fields=["category"]),
        ]

    def __str__(self):
        return self.title

    # ── Propriétés utiles ──────────────────────────────────────────────────

    @property
    def is_done(self) -> bool:
        return self.status == self.Status.DONE

    @property
    def is_overdue(self) -> bool:
        """Vraie si la date d'échéance est dépassée et la tâche non terminée."""
        return (
            self.due_date is not None
            and self.due_date < timezone.now()
            and not self.is_done
        )

    # ── Méthodes de transition ─────────────────────────────────────────────

    def mark_done(self) -> None:
        self.status = self.Status.DONE
        self.save(update_fields=["status", "updated_at"])

    def reopen(self) -> None:
        self.status = self.Status.TODO
        self.save(update_fields=["status", "updated_at"])