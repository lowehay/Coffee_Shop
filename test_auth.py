#!/usr/bin/env python3
"""
Test script to verify authentication endpoints are working
"""
import requests
import json

def test_login():
    """Test the login endpoint"""
    url = "http://localhost:8000/api/login/"
    headers = {"Content-Type": "application/json"}
    
    # Test data - you'll need to create this user first
    data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        response = requests.post(url, json=data, headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        print(f"Cookies: {response.cookies.get_dict()}")
        print(f"Headers: {dict(response.headers)}")
        return response
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    print("Testing authentication endpoint...")
    test_login()
