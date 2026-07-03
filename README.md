
# Home Service Provider (HSP) — React Client Application

This repository contains the decoupled, highly interactive frontend single-page application (SPA) for the Home Service Provider marketplace platform. The UI is built to guide users through discovery, real-time messaging, dynamic scheduling, and transactional lifecycles.

## 🛠️ Technology Stack & Ecosystem
* **Core Engine:** React.js (Vite Build Pipeline)
* **Global State Management:** Redux Toolkit (Modular, slice-based state management)
* **Styling Layer:** Tailwind CSS
* **Network Client:** Axios (Centralized instances with interceptors for JWT injection)
* **Iconography:** Lucide React

## 📦 Key UI Module Implementations
* **Polymorphic Polling Chat Engine:** A single reusable view (`MessagesPage.jsx`) that supports both Customer and Provider layouts, utilizing a custom hook (`usePolling.js`) to sync inbox lists and active threads without memory leaks or stale-state traps.
* **Interactive AI Matching Discovery Canvas:** Captures natural language complaints and geolocates search fields, sending payload descriptors to the API before rendering dynamic provider response profiles.
* **Geospatial Weekly Availability Grid:** A visual checkbox and time-range calendar component allowing providers to configure working blocks with inline validation guards preventing temporal sequence inversions (`endTime <= startTime`).
* **Profile & Document Compliance Dashboard:** Dynamic profile editing views for both customers and providers, featuring an administrative compliance engine supporting image URL uploads for credential tracking (CNIC, Trade License).

## 🚀 Local Installation & Setup

1. **Clone the repository and install dependencies:**
   ```bash
   cd hsp-frontend
   npm install

```

2. **Configure Environment Variables:**
Create a file named `.env.local` directly in the root directory:
```env
VITE_API_BASE_URL=https://localhost:7055/api
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com

```


3. **Fire up the hot-reloading development server:**
```bash
npm run dev

```


*The application will boot locally on `http://localhost:5173`.*

```

---

### ⚙️ 2. Copy-Paste this into your Backend Repository (`README.md`)

```markdown
# Home Service Provider (HSP) — ASP.NET Core Web API Core

This repository hosts the core operational business engine, data layers, and API endpoint routing structures for the Home Service Provider platform. It acts as a secure, fast data processor handling authentication, relational persistence execution, and programmatic intelligence features.

## 🛠️ Technology Stack & Architecture
* **Framework:** C# ASP.NET Core Web API (Minimal APIs & Controller Layouts)
* **Data Access Engine:** Entity Framework Core (Code-First migration workflow)
* **Database Target:** Microsoft SQL Server
* **Authentication Framework:** JWT Bearer tokens + Google OAuth 2.0 Identity tokens validation
* **Document Engine:** QuestPDF for programmatic PDF invoice rendering

## 🧠 Architectural Highlights
* **Hybrid Semantic Matching Engine:** Avoids slow, expensive coordinate math inside external LLM prompt contexts. Uses an isolated service wrapper (`IAiMatchingService`) to classify text user search intent down to a single category label, then uses database LINQ optimizations via EF Core to filter records spatially within targeted city limits.
* **Secure Data Transfer Patterns:** Decouples core database tracking entities from open network vectors by mapping all outbound payloads through strongly typed Data Transfer Objects (DTOs).
* **Robust Exception Interception:** Wrapped in global filter scopes to gracefully handle network dropouts or database sequence issues, preventing unexpected pipeline system failures.

## 🚀 Local Deployment Setup

1. **Prerequisites:**
   Ensure you have the .NET SDK (v8.0+), SQL Server, and Visual Studio installed locally.

2. **Database Connection Configuration:**
   Open the `appsettings.json` file in the root API project folder and update your local connection string parameters and external AI secret configurations:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=YOUR_LOCAL_SQL_SERVER;Database=HomeServiceProviderDb;Trusted_Connection=True;TrustServerCertificate=True;"
     },
     "AI": {
       "ApiKey": "your-llm-api-token-key-here"
     }
   }

```

3. **Initialize the Database Schema Layout:**
Open the Package Manager Console inside Visual Studio and run the following command to apply database structural code migrations:
```powershell
Update-Database

```


4. **Launch the Core Server:**
Press `F5` or click **Run** inside Visual Studio. The API will initialize its security middlewares, apply CORS rules whitelisting your frontend execution endpoints, and launch your operational Swagger documentation explorer.

```

---

### 🏁 Next Step for Your Workflow
1. Save the first block as `README.md` inside your React codebase folder and push it to your frontend GitHub repository.
2. Save the second block as `README.md` inside your C# backend directory and push it to your backend GitHub repository. 

This gives your entire platform an incredibly polished, professional, enterprise-grade architecture look online!

```
