# Tech Stack: Multi-player Desktop Pet Game

## Frontend

- **Desktop Wrapper**: [Tauri](https://tauri.app/)
- **UI Framework**: [React](https://react.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Testing**: [Vitest](https://vitest.dev/)

## Backend

- **Framework**: [NestJS](https://docs.nestjs.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [TypeORM](https://typeorm.io/)
- **Testing**: [Jest](https://jestjs.io/), [Supertest](https://github.com/barrel/supertest)

## Communication & Networking

- **REST API**: For standard CRUD operations and user management.
- **WebSockets**: For real-time interactions (Raids, multiplayer actions).
- **Server-Sent Events (SSE)**: For one-way, low-frequency updates (e.g., combat result broadcasts).

## Infrastructure & Deployment

- **Database Hosting**: [Neon](https://neon.tech/)
- **Deployment**: [Vercel](https://vercel.com/) (Backend hosting via serverless functions where applicable; dedicated instances for WebSocket gateways).
- **Database (Local)**: Local PostgreSQL database.
