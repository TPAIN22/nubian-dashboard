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
│   │   ├── business/     # Business/dashboard pages
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
- **URL**: `/business/dashboard`
- **Requirements**: Clerk user with `publicMetadata.role = "admin"`
- **Setup**: See [ADMIN_DASHBOARD_ACCESS.md](./ADMIN_DASHBOARD_ACCESS.md) for detailed instructions

### Merchant Dashboard
- **URL**: `/merchant/dashboard`
- **Requirements**: 
  - Clerk user with `publicMetadata.role = "merchant"`
  - Merchant application approved in the system
- **Application**: `/merchant/apply`

## Bulk Product Import

The dashboard includes a bulk product import feature that allows admins and merchants to import multiple products at once via CSV or Excel files.

### Access
- **URL**: `/business/products/import`
- **Permissions**:
  - **Admin**: Can import for any merchant
  - **Merchant**: Can only import for their own store

### File Formats

#### CSV Format
Download the template: `/api/admin/products/import/template.csv`

#### XLSX (Excel) Format
Download the template: `/api/admin/products/import/template.xlsx`

### Column Definitions

| Column | Required | Description |
|--------|----------|-------------|
| `sku` | Yes | Unique product identifier per merchant (max 64 chars, no spaces) |
| `name` | Yes | Product name |
| `description` | No | Product description |
| `price` | Yes | Product price (non-negative number) |
| `currency` | No | Currency code (default: USD) |
| `category` | No | Category name (must match existing category) |
| `stock` | No | Stock quantity (non-negative integer, default: 0) |
| `image_urls` | No | Pipe-separated image URLs (URL mode) |
| `image_files` | No | Pipe-separated filenames from ZIP (ZIP mode) |
| `variants_json` | No | JSON array of variants (optional) |

### Image Modes

#### URL Mode
Provide direct image URLs in the `image_urls` column, separated by pipes (`|`):
```
https://example.com/img1.jpg|https://example.com/img2.jpg
```

Alternative: Use separate columns `image_1`, `image_2`, etc.

#### ZIP Mode
1. Upload a ZIP file containing product images
2. Reference images by filename in the `image_files` column:
```
product1-front.jpg|product1-back.jpg
```
3. Images are automatically uploaded to ImageKit during import

**Note**: If both modes are used in the same file, ZIP mode takes priority.

### Example Rows

#### URL Mode Example
```csv
sku,name,description,price,currency,category,stock,image_urls,image_files,variants_json
PROD-001,Example Product,A sample product,99.99,USD,Electronics,100,https://example.com/img1.jpg|https://example.com/img2.jpg,,
```

#### ZIP Mode Example
```csv
sku,name,description,price,currency,category,stock,image_urls,image_files,variants_json
PROD-002,Product with ZIP,Uses ZIP images,149.99,USD,Clothing,50,,product2-front.jpg|product2-back.jpg,
```

#### With Variants Example
```csv
sku,name,description,price,currency,category,stock,image_urls,image_files,variants_json
PROD-003,Product with Variants,Has size variants,199.99,USD,Clothing,0,https://example.com/prod3.jpg,,"[{""sku"":""PROD-003-S"",""attributes"":{""size"":""S""},""merchantPrice"":199.99,""stock"":10},{""sku"":""PROD-003-M"",""attributes"":{""size"":""M""},""merchantPrice"":199.99,""stock"":15}]"
```

### ImageKit Environment Variables (Required for ZIP Mode)

Add these to your `.env.local` or production environment:

```env
# ImageKit Configuration
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=your_public_key
IMAGEKIT_PRIVATE_KEY=your_private_key_here
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

**Security Note**: Never use `NEXT_PUBLIC_` prefix for `IMAGEKIT_PRIVATE_KEY` in production.

### Import Process

1. **Upload**: Select CSV/XLSX file and optional ZIP with images
2. **Preview**: Review parsed data, validation errors, and warnings
3. **Import**: Confirm and execute the import
4. **Report**: View results and download failure report if needed

### Limits and Constraints

| Constraint | Limit |
|------------|-------|
| ZIP file size | 50 MB |
| Individual image size | 5 MB |
| SKU length | 64 characters |
| Session expiry | 15 minutes |
| Preview rows | 20 rows |
| Allowed image types | PNG, JPG, JPEG, WEBP |

### Upsert Behavior

Products are matched by `(merchantId, sku)` compound key:
- If SKU exists: Product is updated
- If SKU is new: Product is inserted

### Error Handling

- Validation errors are shown in the preview step
- Failed rows are reported with detailed error messages
- Download failure reports as CSV or JSON
- Partial imports are allowed (valid rows are processed)

## Support

For issues and questions, please contact the development team.
