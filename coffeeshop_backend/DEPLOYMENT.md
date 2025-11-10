# Deployment Guide for Render

## Prerequisites
- A Render account (https://render.com)
- Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
- Your Vercel frontend URL

## Step-by-Step Deployment

### 1. Prepare Your Repository
Make sure all the following files are committed to your repository:
- `requirements.txt`
- `build.sh`
- `render.yaml`
- `.gitignore`
- Updated `settings.py`

### 2. Make build.sh Executable
Run this command locally before pushing:
```bash
chmod +x build.sh
```

### 3. Create a New Web Service on Render

1. Go to https://dashboard.render.com
2. Click "New +" and select "Web Service"
3. Connect your Git repository
4. Configure the service:
   - **Name**: `coffeeshop-backend` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: Leave empty (or specify if backend is in subdirectory)
   - **Runtime**: Python 3
   - **Build Command**: `./build.sh`
   - **Start Command**: `gunicorn coffeeshop_backend.wsgi:application`

### 4. Add Environment Variables

In the Render dashboard, add these environment variables:

**Required:**
- `SECRET_KEY`: Generate a new secret key (use Django's get_random_secret_key() or an online generator)
- `DEBUG`: `False`
- `ALLOWED_HOSTS`: Your Render app URL (e.g., `coffeeshop-backend.onrender.com`)
- `FRONTEND_URL`: Your Vercel frontend URL (e.g., `https://your-app.vercel.app`)

**Database:**
Render will automatically create a PostgreSQL database and set `DATABASE_URL` if you use the render.yaml file.

### 5. Create PostgreSQL Database (if not using render.yaml)

1. In Render dashboard, click "New +" and select "PostgreSQL"
2. Name it `coffeeshop-db`
3. Choose the free plan
4. After creation, go to your web service settings
5. Add the database URL as `DATABASE_URL` environment variable

### 6. Deploy

1. Click "Create Web Service"
2. Render will automatically build and deploy your app
3. Wait for the build to complete (5-10 minutes for first deploy)
4. Your backend will be available at: `https://your-app-name.onrender.com`

### 7. Update Frontend Configuration

Update your Vercel frontend to use the new Render backend URL:
- Update API base URL to: `https://your-app-name.onrender.com`
- Redeploy your frontend on Vercel

### 8. Update CORS Settings

After deployment, update the `ALLOWED_HOSTS` environment variable in Render to include:
```
your-app-name.onrender.com,localhost,127.0.0.1
```

And ensure `FRONTEND_URL` is set to your Vercel URL:
```
https://your-vercel-app.vercel.app
```

### 9. Create Superuser (Optional)

To create an admin user, use Render's Shell feature:
1. Go to your web service in Render dashboard
2. Click "Shell" tab
3. Run: `python manage.py createsuperuser`
4. Follow the prompts

## Important Notes

### Free Tier Limitations
- Render's free tier spins down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds
- Database has 90-day expiration on free tier

### Security Checklist
- ✅ `DEBUG = False` in production
- ✅ Strong `SECRET_KEY` (never use the development key)
- ✅ `ALLOWED_HOSTS` properly configured
- ✅ Database credentials secured
- ✅ HTTPS enabled (automatic on Render)
- ✅ CORS configured for your frontend only

### Troubleshooting

**Build fails:**
- Check `build.sh` has execute permissions
- Verify all dependencies in `requirements.txt`
- Check build logs in Render dashboard

**Database connection errors:**
- Verify `DATABASE_URL` is set correctly
- Check if PostgreSQL database is running
- Ensure migrations ran successfully

**CORS errors:**
- Verify `FRONTEND_URL` matches your Vercel URL exactly
- Check `CSRF_TRUSTED_ORIGINS` includes your frontend
- Ensure `CORS_ALLOW_CREDENTIALS = True`

**Static files not loading:**
- Run `python manage.py collectstatic` in Render shell
- Check WhiteNoise is in MIDDLEWARE
- Verify `STATIC_ROOT` is set correctly

## Monitoring

- View logs in Render dashboard under "Logs" tab
- Set up email alerts for deployment failures
- Monitor database usage in PostgreSQL dashboard

## Updating Your App

1. Push changes to your Git repository
2. Render will automatically detect and deploy changes
3. Monitor the deployment in the Render dashboard

## Useful Commands (via Render Shell)

```bash
# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --no-input

# Check deployment
python manage.py check --deploy
```
