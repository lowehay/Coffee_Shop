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
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', '123')

# Delete existing user if exists and recreate with new password
if User.objects.filter(username=username).exists():
    user = User.objects.get(username=username)
    user.delete()
    print(f'Deleted existing user "{username}"')

# Create superuser
User.objects.create_superuser(
    username=username,
    email=email,
    password=password
)
print(f'Superuser "{username}" created successfully with password from environment!')
