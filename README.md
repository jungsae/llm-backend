```
llm_backend
├─ prisma
│  ├─ migrations
│  │  ├─ 20250513032221_init
│  │  │  └─ migration.sql
│  │  └─ migration_lock.toml
│  └─ schema.prisma
├─ README.md
└─ src
   ├─ config
   │  └─ index.js
   ├─ controllers
   │  └─ job.controller.js
   ├─ errors
   │  └─ custom.error.js
   ├─ infrastructure
   │  └─ database.js
   ├─ middleware
   │  ├─ auth.middleware.js
   │  └─ error.middleware.js
   ├─ models
   │  └─ job.model.js
   ├─ routes
   │  ├─ index.js
   │  └─ job.routes.js
   ├─ server.js
   ├─ services
   │  ├─ job.processor.js
   │  └─ job.service.js
   ├─ test
   │  └─ rabbitmq.test.js
   └─ utils
      ├─ error-handler.js
      └─ rabbitmq.js

```