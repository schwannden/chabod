# Welcome to Chabod - Church Management System SaaS Platform

> English | [繁體中文](README.md)

![chabod-banner](/public/static/images/twitter-card.png)

## Project Information

**Project URL**: https://chabod.fruitful-tools.com

**Join Discussion**: https://discord.gg/hnQrfUvFk3

Demo Account：

- admin@fruitful-tools.com
- strongAndFruitfulPassword

## About Chabod

**Chabod** is an open-source, multi-tenant Church Management System. Each church can register their own instance with independent member and data management.

Our goal is not to build all features at once, but rather:

> 🌱 **To first provide a stable, scalable platform where interested people can come together to build practical tools for churches.**

### Core Features

- Multi-tenant architecture with isolated church data
- Member and group management
- Event scheduling and management
- Resource sharing and organization
- Role-based access control
- Internationalization support (Chinese/English)

## Chabod's Philosophy and Vision

Chabod was born from these considerations:

### 🤔 Challenges We Face

**1. Ever-changing Church Needs**

- Calendars, event registration, service schedules, hymn management, asset inventory, financial reporting...
- How can new features be built upon existing foundations?
- How can we extend and expand the product lifecycle?

**2. Lack of Sustainable Open Contribution Model**

- Many churches actually have developers - frontend, backend, and full-stack talent
- Churches have diverse talents, how can we reduce the cost of contribution for everyone?
- How much knowledge is needed to make a meaningful contribution?

**3. Inefficient New Feature Development**

- Each small tool having its own site and architecture eventually becomes difficult to maintain, has high usage barriers, and is hard to integrate data
- How can we avoid starting everything from scratch (traffic, users, permissions, operations deployment...)

### 🔧 Core Principles of Our Solution

To address the above challenges, we adopt the following core principles:

- **Cloud-based SaaS Architecture**: Cloud architecture for quick deployment, rapid updates, and fast user feedback
- **Multi-tenant CMS**: Each church has independent management space, first attracting traffic and completing all common infrastructure. New features only need to focus on functionality itself, no need to reinvent the wheel
- **Self-service**: No manual approval needed, ready to use after registration, reducing church adoption costs
- **Open Source Architecture**: Open source architecture, automated deployment, CI/CD, welcoming all contributions of features and modules

### 🎯 Why Start with CMS?

Because almost all church-related applications ultimately need CMS capabilities:

- **Permission and Member Management**: Basic authentication and authorization system
- **Content Modularization**: Public/internal content management
- **Extension Configuration Capabilities**: Modular feature expansion and customization settings

We hope Chabod can become the "common foundation" for future feature development, allowing developers to focus only on feature implementation while quickly validating ideas and benefiting more churches.

## 🔄 Reducing Development Barriers and Shortening Software Lifecycle

With a common platform, we can:

- **Reduce Duplicate Development**: No need to "start from scratch" every time
- **Accelerate Iteration Cycles**: Rapid experimentation, deployment, and feedback loops
- **Build Community Ecosystem**: Accumulate community knowledge and shared tool libraries

## Technical Architecture

### Frontend Technologies

- React 19 + TypeScript
- Vite build tooling
- Tailwind CSS styling framework
- shadcn/ui UI component library
- React Hook Form + Zod form validation
- React i18next internationalization (Chinese/English)
- React Query data fetching

### Backend Technologies

- Supabase (PostgreSQL + Auth + Storage)
- Row Level Security (RLS) policies
- Real-time subscriptions

### Testing and Development

- Jest unit/integration testing
- Comprehensive RLS policy testing
- ESLint + Prettier code quality
- Husky Git hooks
- Conventional commits
- Volta Node.js version management

## How to Contribute?

Please check our [Contributing Guide](https://github.com/schwannden/chabod/blob/main/.github/CONTRIBUTING.md)

## 🎯 Join Our Vision

**This is a platform-type experiment, but also an invitation.**

Welcome to use, test, suggest features, write code, and together build truly needed digital tools for churches.

### Related Links

- 📎 [Demo Website](https://chabod.fruitful-tools.com/)
- 📂 [GitHub Project](https://github.com/schwannden/chabod)
- 🧰 [Contribution Guide](https://github.com/schwannden/chabod/blob/main/.github/CONTRIBUTING.md)

---

_Let's contribute together to church digitalization and build a better service platform!_ 🙏
