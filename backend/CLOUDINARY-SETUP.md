# Cloudinary Image Upload Setup Guide

This guide explains how to configure Cloudinary for image uploads in the Food Reservation application.

## Overview

The application supports two image storage backends:
- **Filesystem** (default): Images are stored locally in `backend/src/uploads/`
- **Cloudinary**: Images are uploaded to Cloudinary CDN and served via their global CDN

You can switch between backends using the `IMAGE_STORAGE_TYPE` environment variable.

## Prerequisites

- A Cloudinary account (free tier available)
- Node.js and npm installed
- Access to environment variable configuration

## Step 1: Create a Cloudinary Account

1. Go to [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Sign up for a free account (no credit card required)
3. Verify your email address

## Step 2: Get Your Cloudinary Credentials

1. After logging in, you'll be taken to your Dashboard
2. On the Dashboard, you'll see your **Cloud Name**, **API Key**, and **API Secret**
3. Copy these three values - you'll need them for configuration

**Important**: Keep your API Secret secure and never commit it to version control.

## Step 3: Configure Environment Variables

Create or update your `.env` file in the `backend` directory with the following variables:

```env
# Image Storage Configuration
IMAGE_STORAGE_TYPE=cloudinary

# Cloudinary Credentials
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Example `.env` file:

```env
# Database Configuration (existing)
MONGO_URI=mongodb://localhost:27017/food-reservation

# Image Storage - Use Cloudinary
IMAGE_STORAGE_TYPE=cloudinary

# Cloudinary Credentials
CLOUDINARY_CLOUD_NAME=my-food-app
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

## Step 4: Install Dependencies

The Cloudinary package should already be installed. If not, run:

```bash
cd backend
npm install cloudinary
```

## Step 5: Verify Configuration

1. Start your backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Check the console output. You should see:
   ```
   [ImageUploadFactory] Using Cloudinary storage
   ```

3. If you see a warning about missing credentials, double-check your `.env` file and ensure all three Cloudinary variables are set correctly.

## Switching Between Storage Backends

### Use Filesystem Storage (Default)

Set in `.env`:
```env
IMAGE_STORAGE_TYPE=filesystem
```

Or simply remove/comment out the `IMAGE_STORAGE_TYPE` variable.

### Use Cloudinary Storage

Set in `.env`:
```env
IMAGE_STORAGE_TYPE=cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Note**: After changing `IMAGE_STORAGE_TYPE`, restart your server for the change to take effect.

## How It Works

### Image Upload Flow

1. User uploads an image through the application (menu item, profile picture, etc.)
2. The application uses the `ImageUploadFactory` to get the configured repository
3. The repository uploads the image to the selected backend:
   - **Filesystem**: Saves to `backend/src/uploads/` and returns `/uploads/filename.jpg`
   - **Cloudinary**: Uploads to Cloudinary CDN and returns `https://res.cloudinary.com/...`
4. The URL is stored in the database
5. Images are served:
   - **Filesystem**: Via Express static middleware at `/uploads/`
   - **Cloudinary**: Directly from Cloudinary's CDN

### Image Deletion

When images are deleted (e.g., updating a profile picture), the repository automatically:
- **Filesystem**: Deletes the file from the local filesystem
- **Cloudinary**: Removes the asset from Cloudinary using the API

## Cloudinary Free Tier Limits

The free tier includes:
- **25 GB** storage
- **25 GB** monthly bandwidth
- **25,000** monthly transformations
- Unlimited uploads

For most small to medium applications, this is sufficient. Monitor your usage in the Cloudinary Dashboard.

## Troubleshooting

### Issue: "Cloudinary not configured" warning

**Solution**: Ensure all three environment variables are set:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### Issue: Upload fails with authentication error

**Solution**: 
1. Verify your API credentials in the Cloudinary Dashboard
2. Ensure there are no extra spaces in your `.env` file
3. Restart your server after changing environment variables

### Issue: Images not displaying

**Solution**:
1. Check that the URL returned from upload is a valid Cloudinary URL
2. Verify the image exists in your Cloudinary Media Library
3. Check browser console for CORS or loading errors

### Issue: Want to switch back to filesystem

**Solution**: 
1. Set `IMAGE_STORAGE_TYPE=filesystem` in `.env`
2. Restart the server
3. Existing Cloudinary URLs will still work (they're stored in the database), but new uploads will use filesystem

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use environment variables** for all sensitive credentials
3. **Rotate API secrets** periodically
4. **Use Cloudinary's security features**:
   - Enable signed URLs for private assets
   - Set up upload presets with size/format restrictions
   - Configure CORS settings in Cloudinary Dashboard

## Testing

The application includes comprehensive tests for both storage backends:

```bash
cd backend
npm test -- --testPathPattern="image-upload"
```

Tests verify:
- Filesystem upload and deletion
- Cloudinary upload and deletion (with mocks)
- Integration with controller endpoints
- Factory pattern switching

## Additional Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [Cloudinary Dashboard](https://cloudinary.com/console)

## Support

For issues related to:
- **Cloudinary**: Check [Cloudinary Support](https://support.cloudinary.com/)
- **Application**: Check the application's issue tracker or documentation

