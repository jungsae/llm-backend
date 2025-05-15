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
[Frontend (Request)] → [Next.js API Route (Auth/Proxy)] → [Main Backend HTTP Server (Fastify Controller/Service)] → [Main Backend Infra (RabbitMQ Publisher)] → [RabbitMQ Queue (Prioritized)] → [RabbitMQ (Delivers message)] → [Worker Process (Consumes message)] → [Worker Logic (Calls LLM)] ↔ [LLM Server (Flask)] → [Worker Logic (Processes LLM response)] → [Main Backend Infra (DB/Prisma Repository)] ↔ [PostgreSQL DB] → [Worker Logic (Notifies Status)] → [Main Backend Infra (WebSocket/SSE Server)] → [Frontend (Real-time Updates)]

```

+------------------+
|    Internet      |
+--------+---------+
         | HTTP/S
+--------+---------+
|     Vercel       | (Next.js Frontend & API Routes 호스팅)
+--------+---------+
         |
+--------+-----------------------------------------------------------------------------------+
|                                  전체 아키텍처 흐름                                          |
|                                                                                            |
| +-------------------+   3. Supabase Token 포함 요청 전송        +-------------------+    |
| | Frontend          |---------------------------------------> | Next.js API Route |    |
| | (Browser/JS)      | (인증 필요 시)                          | (Auth Gateway)    |    |
| +---------+---------+                                       | (Vercase)         |    |
|           |                                                 +---------+---------+    |
|           | 1. Supabase 인증 시작 (Email/PW 또는 OAuth)                 |                |
| +---------+---------+                                                 | 4. Supabase Token 검증
| | Frontend          |-------------------------------------------------+ (Supabase Public Key 사용)
| | (Supabase SDK)    |                                                 |
| +---------+---------+                                                 | 5. 자체 HttpOnly Cookie 발행 및 응답
|           |                                                           |
|           | 2. 인증 완료 및 Supabase Token 수신                       |
| +---------+---------+                                       +---------+---------+    |
| |                   |<--------------------------------------| Next.js API Route |    |
| | Supabase Auth     |   (Supabase SDK가 토큰 처리)          | (인증 완료)       |    |
| | (외부 인증 공급자) |                                       +---------+---------+    |
| +-------------------+                                                 |                |
|                                                                         | 6. 인증된 HTTP 요청 전달
|                                                                         |
|                                                                         v                |
| +------------------------------------------------------------------------------------+ |
| |                        Main Backend (원격 PC / WSL2 Linux)                         | |
| | +-------------------+                                                              | |
| | | Nginx (리버스프록시)|-->+---------------------+                                  | | 표현(Presentation) 계층
| | | (DDNS/VPN)        |   | Main Backend HTTP |                                  | |
| | +-------+-----------+   | 서버 (Fastify)    | 7. 요청 처리 (Controller -> Service 호출)| | 응용(Application) 계층
| |         | (HTTP/WS)     +---------+---------+                                  | |
| |         | Incoming                | 8. DB 접근 (예: 사용자 정보 조회, 작업 레코드 생성)    | 인프라(Infrastructure) 계층
| | +-------+-----------+             +---------------------+                      | |
| | | Frontend          |<------------| WebSocket/SSE     | 15. 실시간 업데이트 푸시     | |
| | | (Real-time Client)|             | 서버              | (인프라)                 | |
| | +-------------------+             +---------+---------+                      | |
| |                                             | 14. 상태 변경 알림                 | |
| |                                             v                                  | |
| |                                     +-------------------+                      | | 응용(Application) 계층 (워커)
| |                                     |   Queue System    | 9. Job 등록 (우선 순위 반영)| | 인프라(Infrastructure) 계층
| |                                     | (RabbitMQ/Redis)  |                          | |
| |                                     +---------+---------+                      | |
| |                                               | 10. Job 소비                       | |
| |                                               v                                  | |
| |                                       +-------------------+                      | | 응용(Application) 계층 (워커)
| |                                       | Worker Process(es)| 11. Job 실행        | | 인프라(Infrastructure) 계층 (워커 환경)
| |                                       +---------+---------+                      | |
| |                                                 | 12. LLM 서버 호출 (장시간 작업)      | 인프라(Infrastructure) 계층
| |                                         +-------+-------+                      | |
| |                                         | LLM 서버 (Flask)|                      | |
| |                                         +---------------+                      | |
| |                                                 | 13. DB 접근 (상태 업데이트, 결과 저장) | 인프라(Infrastructure) 계층
| |                                         +-------+-------+                      | |
| |                                         | PostgreSQL DB |                      | |
| |                                         | (via Prisma)  |                      | |
| |                                         +---------------+                      | |
| +------------------------------------------------------------------------------------+ |
|                                                                                      |
+--------------------------------------------------------------------------------------+