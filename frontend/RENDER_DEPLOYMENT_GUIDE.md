# Render Deployment Guide

This guide explains how to deploy the Virtual Coach App to Render securely.

## 1. Create a New Web Service

1.  Log in to your [Render Dashboard](https://dashboard.render.com/).
2.  Click **New +** and select **Static Site**.
3.  Connect your GitHub repository.

## 2. Configure Build Settings

-   **Name**: `virtual-coach-app` (or your preferred name)
-   **Branch**: `main`
-   **Root Directory**: `virtual_coach_app_frontend` (Important: The project is in a subdirectory)
-   **Build Command**: `npm install && npm run build`
-   **Publish Directory**: `dist`

## 3. Configure Environment Variables (Security)

**CRITICAL**: Do NOT commit your `.env` file to GitHub. Instead, set these variables in the Render Dashboard.

1.  Scroll down to the **Environment Variables** section.
2.  Click **Add Environment Variable**.
3.  Add the following keys and values:

| Key | Value |
| :--- | :--- |
| `VITE_SUPABASE_URL` | `https://lyfsuwsfydliivfqlyhd.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | *(Paste your Supabase Anon Key here)* |
| `GEMINI_API_KEY` | *(Paste your Gemini API Key here)* |

## 4. Deploy

1.  Click **Create Static Site**.
2.  Render will start the build process. You can monitor the logs in the dashboard.
3.  Once finished, your app will be live at `https://your-app-name.onrender.com`.
