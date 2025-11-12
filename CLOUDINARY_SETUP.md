# Cloudinary Setup Guide

## Why Cloudinary?

Render's free tier uses **ephemeral storage** - uploaded files are deleted when the server restarts. Cloudinary provides persistent cloud storage for images.

## Setup Steps:

### 1. Create Cloudinary Account

1. Go to [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Sign up for a **free account** (25GB storage, 25GB bandwidth/month)
3. Verify your email

### 2. Get Your Credentials

1. Go to your Cloudinary Dashboard
2. Find your credentials:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### 3. Add to Render Environment Variables

Go to your Render service → **Environment** tab and add:

```
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 4. Deploy

After adding the environment variables, Render will automatically redeploy.

## How It Works:

- **Development**: Images stored locally in `/media/` folder
- **Production**: Images automatically uploaded to Cloudinary
- **URLs**: Cloudinary provides CDN URLs for fast image delivery
- **Persistence**: Images remain even after server restarts

## Testing:

1. Upload a product image in production
2. Check the image URL - it should be from Cloudinary (e.g., `https://res.cloudinary.com/...`)
3. Restart your Render service - images should still be there!

## Free Tier Limits:

- 25 GB storage
- 25 GB bandwidth/month
- 25 credits/month for transformations

This is more than enough for a coffee shop app! ☕
