# 1️⃣ Image de base
FROM python:3.11-slim

# 2️⃣ Variables d'environnement
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3️⃣ Répertoire de travail
WORKDIR /app

# 4️⃣ Installer les dépendances système (nécessaires pour psycopg2)
RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# 5️⃣ Mettre pip à jour
RUN python -m pip install --upgrade pip

# 6️⃣ Installer les dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 7️⃣ Copier le projet
COPY . .

# 8️⃣ Exposer le port
EXPOSE 8000

# 9️⃣ CMD: collectstatic + migrate + lancer gunicorn
# Utiliser les variables d'environnement fournies par Render ou Docker
CMD python Dotolist/manage.py collectstatic --noinput && \
    python Dotolist/manage.py migrate && \
    gunicorn Dotolist.wsgi:application --bind 0.0.0.0:$PORT