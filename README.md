# Nubian Dashboard

A modern e-commerce dashboard and storefront built with Next.js 15, React 19, TypeScript, and Tailwind CSS.

## Features

- 🛍️ Complete e-commerce functionality
- 👤 User authentication with Clerk
- 📊 Admin dashboard for managing products, orders, and customers
- 🎨 Modern UI with shadcn/ui components
- 🌙 Dark mode support
- 📱 Responsive design
- 🖼️ Image management with ImageKit
- 📧 Email notifications with Resend

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, shadcn/ui
- **Authentication**: Clerk
- **Image Management**: ImageKit
- **Email**: Resend
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Database**: MongoDB (via API)

## Prerequisites

- Node.js 18+ and npm
- MongoDB database
- Clerk account (for authentication)
- ImageKit account (for image management)
- Resend account (for email)

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd nubian-dashboard
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here

# ImageKit
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=your_public_key_here
IMAGEKIT_PRIVATE_KEY=your_private_key_here

# Email (Resend)
RESEND_API_KEY=re_your_key_here

# Environment
NODE_ENV=development
```

**Important**: The `IMAGEKIT_PRIVATE_KEY` should NOT have the `NEXT_PUBLIC_` prefix as it's server-side only.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for production

```bash
npm run build
npm start
```

## Project Structure

```
nubian-dashboard/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── api/          # API routes
│   │   ├── buseniss/     # Business/dashboard pages
│   │   └── ...
│   ├── components/       # React components
│   │   ├── ui/           # UI components (shadcn/ui)
│   │   └── ...
│   ├── lib/              # Utilities and configurations
│   ├── hooks/            # Custom React hooks
│   └── store/            # Zustand state management
├── public/               # Static assets
└── ...
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Security Features

- Content Security Policy (CSP) headers
- HTTPS enforcement in production
- Secure authentication with Clerk
- Input validation with Zod
- Rate limiting (via API)
- Request size limits
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)

## Deployment

The application can be deployed to:

- **Vercel** (recommended for Next.js)
- **Netlify**
- **AWS Amplify**
- Any Node.js hosting platform

Make sure to set all environment variables in your hosting platform.

## API Integration

This frontend connects to the Nubian API backend. Make sure the API server is running and accessible at the URL specified in `NEXT_PUBLIC_API_URL`.

## License

ISC

## Dashboard Access

### Admin Dashboard
- **URL**: `/buseniss/dashboard`
- **Requirements**: Clerk user with `publicMetadata.role = "admin"`
- **Setup**: See [ADMIN_DASHBOARD_ACCESS.md](./ADMIN_DASHBOARD_ACCESS.md) for detailed instructions

### Merchant Dashboard
- **URL**: `/merchant/dashboard`
- **Requirements**: 
  - Clerk user with `publicMetadata.role = "merchant"`
  - Merchant application approved in the system
- **Application**: `/merchant/apply`

## Support

For issues and questions, please contact the development team.
