# 🕐 ChronoWise Agent

**Intelligent Time Management & Scheduling Assistant**

A modern web application that helps users manage their tasks, schedules, and productivity with AI-powered insights and Google Calendar integration.

## ✨ Features

### 🛡️ Secure Authentication
- Supabase-powered user authentication
- Protected routes and secure sessions
- Environment variable security

### 📊 Smart Dashboard
- Real-time task overview
- Calendar sync status monitoring
- Quick action buttons for common tasks
- Analytics integration

### 📤 Document Upload & Processing  
- PDF document upload
- OCR and NLP processing with Google Gemini AI
- Intelligent content extraction

### 📈 Analytics & Insights
- Task completion tracking
- Productivity metrics
- Visual analytics dashboard

### 🔄 Google Calendar Integration (Architecture Ready)
- OAuth 2.0 secure authentication
- Calendar event creation and management  
- Real-time synchronization
- Browser-based implementation

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for responsive styling
- **shadcn/ui** for modern UI components
- **Lucide React** for beautiful icons

### Backend & Services
- **Supabase** for authentication and database
- **Google Cloud APIs** for calendar integration
- **Google Gemini AI** for document processing
- **Vercel** for deployment

### Security & Build
- Environment variable protection
- OAuth-only authentication (no API keys in client)
- Production-optimized builds
- Git security measures

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Google Cloud Project with Calendar API enabled
- Supabase account and project

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd chrono-wise-agent

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

### Environment Setup

Create `.env.local` with:

```bash
# Google Calendar Integration
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GOOGLE_CALENDAR_ID=primary
VITE_GOOGLE_REDIRECT_URI=http://localhost:8083/auth/callback

# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google Gemini AI
VITE_GEMINI_API_KEY=your-gemini-api-key
```

## 📋 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Type checking
npm run type-check   # TypeScript type checking
```

## 🔐 Security Features

- **OAuth 2.0 Authentication**: Secure Google Calendar integration without API key exposure
- **Environment Protection**: Only VITE_ prefixed variables included in client bundle
- **Git Security**: Comprehensive .gitignore preventing credential leaks
- **Client-side Architecture**: Browser-based API calls for enhanced security

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Dashboard/      # Dashboard-specific components
│   ├── Upload/         # File upload components
│   ├── Analytics/      # Analytics components
│   └── ui/             # shadcn/ui components
├── hooks/              # Custom React hooks
├── contexts/           # React contexts
├── integrations/       # External service integrations
│   ├── calendar/       # Google Calendar integration
│   ├── gemini/         # AI processing
│   └── supabase/       # Database and auth
├── ai/                 # AI agents and controllers
└── lib/                # Utility functions
```

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Build Verification**
   ```bash
   npm run build
   npm run preview
   ```

2. **Environment Setup**
   - Copy variables from `.env.production` template
   - Set in Vercel dashboard under Environment Variables

3. **Google Cloud Console**
   - Add production redirect URI to OAuth settings
   - Update authorized JavaScript origins

4. **Deploy**
   - Connect GitHub repository to Vercel
   - Configure environment variables
   - Deploy!

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for detailed deployment guide.

## 🔍 Current Status

### ✅ Production Ready
- Secure authentication system
- Modern responsive UI
- Document upload and processing
- Analytics dashboard
- Environment security
- Production builds

### 🔄 Google Calendar Integration
- **Architecture**: Complete OAuth implementation ready
- **Status**: Currently using mocks for build compatibility
- **Next Steps**: Resolve build system compatibility for full integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with [Vite](https://vitejs.dev/) and [React](https://reactjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons by [Lucide](https://lucide.dev/)
- Authentication by [Supabase](https://supabase.com/)
- AI processing by [Google Gemini](https://ai.google.dev/)

---

**Ready for production deployment!** 🚀
