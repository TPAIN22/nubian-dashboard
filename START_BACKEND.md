# How to Start the Backend Server

The network error occurs because the backend API server is not running.

## Quick Start

1. **Open a new terminal/command prompt**

2. **Navigate to the backend directory:**
   ```bash
   cd C:\Users\HUAWEI\Desktop\nubian-auth
   ```

3. **Install dependencies (if not already done):**
   ```bash
   npm install
   ```

4. **Make sure you have a `.env` file** in the `nubian-auth` directory with:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   CLERK_SECRET_KEY=your_clerk_secret_key
   RESEND_API_KEY=your_resend_api_key
   CORS_ORIGINS=http://localhost:3000,http://localhost:3001
   ```

5. **Start the backend server:**
   ```bash
   npm run dev
   ```
   
   Or for production:
   ```bash
   npm start
   ```

6. **Verify the server is running:**
   - You should see: `Server started on port 5000`
   - Test it by visiting: `http://localhost:5000/health` in your browser

## Troubleshooting

- **Port 5000 already in use?** Change the PORT in `.env` file
- **Database connection error?** Check your MongoDB connection string
- **Missing environment variables?** The server will show an error message listing what's missing

Once the backend is running, try submitting the merchant application again.

