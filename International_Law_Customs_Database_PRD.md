# Product Requirements Document (PRD)
## International Law & Customs Database

### 1. Project Overview
A professional, high-performance web platform designed to provide rapid access to international customs regulations, trade laws, tariffs, and compliance requirements. This platform serves as a single source of truth, ingesting provided datasets, schemas, and reference documents, and presenting them through an intuitive, enterprise-grade interface.

### 2. Target Audience
* Legal professionals and international trade lawyers
* Customs consultants and compliance officers
* Import/export business operators
* Academic and policy researchers

### 3. Objectives
* Ingest and index all provided datasets and document records into a structured, searchable format.
* Deliver an intuitive, lightning-fast research platform tailored for deep legal and compliance research.
* Maintain an enterprise-grade UI/UX that scales elegantly across both mobile and desktop devices.

### 4. Recommended Tech Stack
* **Frontend:** Next.js (React), Tailwind CSS (for rapid, responsive UI development across phone and laptop screens), Lucide React (icons).
* **Backend:** Node.js / Next.js API Routes.
* **Database & Auth:** PostgreSQL (via Supabase) for structured relationships, foreign keys, and built-in authentication.
* **Search Infrastructure:** Elasticsearch, Typesense, or Algolia for highly relevant full-text search across large legal documents and tariff codes.
* **Hosting/Deployment:** Vercel or Google Cloud Run.

### 5. Core Features

#### 5.1 Global Search
* Omnibox search accessible from any page.
* Full-text search with typo tolerance and relevance ranking.
* Search parameters: country, jurisdiction, regulation type, law, tariff code, document title, keywords, and dates.

#### 5.2 Advanced Filtering Architecture
* **Geographic:** Country, Region, Trade Bloc (e.g., EU, ASEAN, USMCA).
* **Categorical:** Regulation type, Industry category, Customs authority.
* **Temporal & Status:** Effective date, expiration date, document status (active, repealed, amended, draft).

#### 5.3 Record Viewer
* Distraction-free document reading interface.
* Metadata sidebar (Status, Effective Date, Jurisdiction).
* Cross-referencing engine (hyperlinking related laws, amendments, and precedents).
* Highlighted search term mapping within the document body.
* Standardized legal citation generator (APA, Bluebook, etc.).

#### 5.4 Country Profiles
* Dedicated summary dashboards for individual nations.
* High-level overview of current customs regulations and active trade agreements.
* Direct links to all associated legal frameworks and procedural documents.

#### 5.5 Admin Panel
* Role-based access control (RBAC) for administrators and content moderators.
* CRUD operations for database records and document schemas.
* Bulk import/export tools for CSV/JSON datasets.
* User account management and subscription provisioning.

#### 5.6 Analytics Dashboard
* Viewership metrics (most-read regulations, trending tariff codes).
* Search query analytics (identifying what users are looking for and potential content gaps).
* Database volume and growth tracking.

### 6. UI/UX Requirements
* **Framework:** Strictly Tailwind CSS.
* **Responsiveness:** Mobile-first approach, expanding seamlessly to tablet and complex multi-column desktop layouts.
* **Theming:** Integrated Dark and Light mode toggles.
* **Aesthetics:** Clean, minimalist, enterprise-grade (similar to LexisNexis or Westlaw but modernized). Muted color palettes, high contrast typography for readability, and clear data hierarchy.

### 7. Implementation & Architecture Steps (Pre-Generation Phase)
1. **Data Ingestion Analysis:** Parse all local project files (datasets, schemas, `.csv`, `.json`, `.pdf`).
2. **Schema Inference:** Map out relationships (e.g., A `Country` has many `Regulations`; A `Regulation` has many `Tariff Codes`).
3. **Database Normalization:** Design the PostgreSQL schema based on the inferred relationships.
4. **Index Strategy:** Determine which fields (titles, summaries, full text) require indexing in the search engine.
5. **Component Scaffolding:** Generate reusable UI components (Search Bar, Filter Sidebar, Document Card, Data Table).
