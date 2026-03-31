# 1️⃣ Image de base
FROM python:3.11-slim

# 2️⃣ Variables d'environnement
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3️⃣ Répertoire de travail
WORKDIR /app

# 4️⃣ Installer les dépendances système (important pour psycopg2)
RUN apt-get update && apt-get install -y gcc libpq-dev

# 5️⃣ Installer les dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 6️⃣ Copier le projet
COPY . .

# 7️⃣ Exposer le port
EXPOSE 8000

RUN python manage.py collectstatic --noinput
# 8️⃣ Lancer avec Gunicorn (PRODUCTION)
CMD ["sh", "-c", "gunicorn Dotolist.wsgi:application --bind 0.0.0.0:$PORT"]