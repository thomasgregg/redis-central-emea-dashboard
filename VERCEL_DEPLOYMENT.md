# Deploying to Vercel

This document outlines the steps to deploy the Central EMEA Dashboard to Vercel.

## Prerequisites

1. A Vercel account
2. The Vercel CLI installed (`npm i -g vercel`)
3. Redis Cloud instance credentials (already configured in the .env file)

## Deployment Steps

1. **Login to Vercel CLI**
   ```
   vercel login
   ```

2. **Deploy the Application**
   ```
   vercel
   ```
   
   When prompted, select the following options:
   - Set up and deploy: Yes
   - Directory: ./
   - Link to existing project: No
   - Project name: redis-central-emea-dashboard (or your preferred name)
   - Framework preset: Other

3. **Set Environment Variables**
   
   The following environment variables are required:
   
   - `REDIS_HOST`: redis-16999.c74.us-east-1-4.ec2.redns.redis-cloud.com
   - `REDIS_PORT`: 16999
   - `REDIS_USERNAME`: default
   - `REDIS_PASSWORD`: [Your Redis password]
   - `JWT_SECRET`: central-emea-dashboard-secret
   - `NODE_ENV`: production
   - `FRONTEND_URL`: [Your Vercel deployment URL]

   These can be set in the Vercel dashboard under Project Settings > Environment Variables.

4. **Verify Deployment**
   
   Once deployed, visit your Vercel deployment URL to verify that the application is working correctly.

## Troubleshooting

- If you encounter CORS issues, ensure that the `FRONTEND_URL` environment variable is set correctly.
- If Redis connection fails, verify your Redis Cloud credentials.
- Check Vercel logs for any deployment or runtime errors.

## Notes

- The application uses a serverless backend that connects directly to Redis Cloud.
- The frontend is built as a static site and served by Vercel's CDN.
- API requests are proxied to the serverless backend functions. 