# Welcome to Chabod - A SaaS for Church CMS

![chabod-banner](/public/static/images/twitter-card.png)

## Project info

**URL**: https://chabod.fruitful-tools.com

## About Chabod

**Chabod** 是一個開源、多租戶（multi-tenant）的教會 CMS。
每間教會都可以註冊自己的子站、管理自己的會員與資料。
我們的目標不是一次就做完所有功能，而是：

> 🌱 **先提供一個穩定、可擴展的平台，讓有興趣的人可以聚在一起，一起為教會打造實用工具。**

Chabod is an open-source, multi-tenant Church Management System (CMS) designed to provide churches with a comprehensive platform for managing their digital needs. Each church can register their own instance with independent data management, member administration, and customizable features.

**Key Features:**

- Multi-tenant architecture with isolated church data
- Member and group management
- Event scheduling and management
- Resource sharing and organization
- Role-based access control
- Internationalization support

## Tech Stack

**Frontend:**

- React 19 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- shadcn/ui for UI components
- React Hook Form + Zod for form validation
- React i18next for internationalization (English/Chinese)
- React Query for data fetching

**Backend:**

- Supabase (PostgreSQL + Auth + Storage)
- Row Level Security (RLS) policies
- Real-time subscriptions

**Testing:**

- Jest for unit/integration testing
- Comprehensive RLS policy testing

**Development:**

- ESLint + Prettier for code quality
- Husky for git hooks
- Conventional commits
- Volta for Node.js version management

## How can I contribute this code?

See [Contributing Guide](https://github.com/schwannden/chabod/blob/main/.github/CONTRIBUTING.md)

## Chabod 的精神

Chabod 的誕生，從這樣的思考開始

- ❓教會的需求會變，需要的應用也會一直改變
  - 行事曆、活動報名、服事表、詩歌管理、資產清冊、財務報帳……
  - 如何讓新的功能可以建構在既有的基礎之上，如何讓產品生命週期可以延續，擴大
- ❓如何建立永續的開放的貢獻模式
  - 很多教會內其實都有開發者，前端、後端、全端人才都有。
  - 教會有不同的人才，如何降低大家的貢獻成本？為了做出一點貢獻，到底要懂多深？
- ❓如何幫助新功能快速迭代
  - 每個小工具自己一個站、自己一個架構，最終變成維護困難、使用門檻高、也難以串聯資料。
  - 如何避免所有事情從頭到尾重來一遍（流量，使用者，權限，維運部署...）

為了回應上面的問題

## 🔧 我們解法的核心精神：

- **Cloud-based SaaS**：雲端架構，方便快速部署，快速更版，快速取得使用者回饋。
- **Multi-tenant CMS**：每間教會有獨立的管理空間，先吸引流量，並且完成所有的共同架構。新功能的建立只需要專注在功能本身，不需要重新造輪子。
- **Self-service**：不用人工審核，註冊後即可開始使用，降低教會導入成本。
- **Open source**：開源架構，自動部署，CICD，歡迎所有人貢獻功能與模組。

## 🎯 為什麼從 CMS 開始？

因為幾乎所有教會相關的應用，最終都需要用到 CMS 能力：

- 權限與會員管理
- 可公開／內部使用的內容模組
- 模組化的擴充與設定能力

我們希望 Chabod 能成為未來功能開發的「共用地基」，讓開發者只要專注在功能實作，就能快速驗證想法，也讓更多教會受惠。

---

## 🔄 一起降低開發門檻，縮短軟體生命週期的 lead time

有了共通的平台，就能：

- 減少每次功能開發都要「從零開始」的痛苦
- 加快實驗、部署與回饋迴路（feedback loop）
- 建立社群知識與共享工具庫

🎯 **這是一個平台型嘗試，但也是一個邀請。**
歡迎你來用、來測試、來提功能、來寫 code，一起為教會打造真正需要的數位工具。

- 📎 [Demo 網站](https://chabod.fruitful-tools.com/)
- 📂 [GitHub Repo](https://github.com/schwannden/chabod)
- 🧰 [貢獻教學](https://github.com/schwannden/chabod/blob/main/.github/CONTRIBUTING.md)
