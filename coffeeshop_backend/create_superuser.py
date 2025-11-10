#!/usr/bin/env python
"""
Script to create a superuser if one doesn't exist.
Uses environment variables for credentials.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'coffeeshop_backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Get credentials from environment variables
username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@example.com')
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'admin123')

# Check if superuser already exists
if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(
        username=username,
        email=email,
        password=password
    )
    print(f'Superuser "{username}" created successfully!')
else:
    print(f'Superuser "{username}" already exists.')
