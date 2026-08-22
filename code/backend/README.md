<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## API endpoints

All pet endpoints are under `/pets`. Endpoints marked "Auth" require an `Authorization: Bearer <accessToken>` header, where `accessToken` is the token returned when the pet was created.

### `POST /pets`

Create a new pet.

- **Input** (JSON body, [CreatePetDto](src/pet/dto/create-pet.dto.ts)):
  ```json
  { "name": "string" }
  ```
- **Output** (200, [ReturnCreatedPetDto](src/pet/dto/return-created-pet.dto.ts)):
  ```json
  {
    "name": "string",
    "accessToken": "string",
    "xp": 0,
    "level": 1,
    "attack": 0,
    "defense": 0,
    "health": 0
  }
  ```
  The `accessToken` is only ever returned here — store it, it's needed to authenticate every other endpoint below.

### `POST /pets/training` — Auth

Train the caller's pet, granting XP (subject to a cooldown and diminishing returns based on daily activity).

- **Input** (JSON body, [TrainPetDto](src/pet/dto/train-pet.dto.ts)):
  ```json
  { "intensity": 1 }
  ```
  `intensity` must be a positive number, max 500.
- **Output** (200, [ReturnPetTrainingDto](src/pet/dto/return-pet-training.dto.ts)):
  ```json
  {
    "xp": 0,
    "level": 1,
    "attack": 0,
    "defense": 0,
    "health": 0
  }
  ```
- **Errors**:
  - `401 Unauthorized` — missing or malformed access token
  - `404 Not Found` — no pet exists for the given access token
  - `429 Too Many Requests` — training is still on cooldown

### `GET /pets/me` — Auth

Get the current state of the caller's pet.

- **Input**: none (access token only)
- **Output** (200, [ReturnPetDto](src/pet/dto/return-pet.dto.ts)):
  ```json
  {
    "name": "string",
    "xp": 0,
    "level": 1,
    "attack": 0,
    "defense": 0,
    "health": 0
  }
  ```
- **Errors**:
  - `401 Unauthorized` — missing or malformed access token
  - `404 Not Found` — no pet exists for the given access token

### `GET /pets/me/status` — Auth

Get the caller's pet's status. This is computed live from active battles, active/pending pet-sitting invitations, and tiredness — nothing is stored on the pet itself as a "busy" flag.

- **Input**: none (access token only)
- **Output** (200, [ReturnPetStatusDto](src/pet/dto/return-pet-status.dto.ts)):
  ```json
  { "state": "available", "availableAt": null }
  ```
  `state` is one of `available`, `raiding`, `pet_sitting`, `tired`. `availableAt` is only set (to the timestamp the pet stops being tired) when `state` is `tired`.
- **Errors**:
  - `401 Unauthorized` — missing or malformed access token
  - `404 Not Found` — no pet exists for the given access token

### `GET /pets` — Auth

List every other pet (the caller is excluded) along with its computed status — used both for picking a raid target and for picking a pet-sitting host.

- **Input**: none (access token only)
- **Output** (200, array of [ReturnPetSummaryDto](src/pet/dto/return-pet-summary.dto.ts)):
  ```json
  [
    {
      "id": "uuid",
      "name": "string",
      "level": 1,
      "status": { "state": "available", "availableAt": null }
    }
  ]
  ```
- **Errors**:
  - `401 Unauthorized` — missing or malformed access token

All battle endpoints are under `/battles`. Endpoints marked "Auth" require an `Authorization: Bearer <accessToken>` header, same as above, except the SSE stream, which takes the token as a `?token=` query parameter instead (the browser `EventSource` API can't set custom headers).

A challenge stays `pending` for 15 seconds (`reactionWindowMs`, [base-battle.template.ts](src/battle/config/base-battle.template.ts)). If the defender accepts in time via `POST /battles/:id/accept`, their defense gets a +20% boost for the fight; if the window elapses unanswered, it's auto-resolved instead with a -20% defense malus. Either way the winner gains XP and the loser loses XP (floored at 0), scaled by the level gap between them — see `computeBattleOutcome` in [battle-combat.ts](src/battle/battle-combat.ts) for the exact formula.

Both pets are also left `tired` for 5 minutes afterward (`raidTiredMs`), which reduces their attack and defense by 30% (`tiredDebuff`, [base-pet.template.ts](src/pet/templates/base-pet.template.ts)) for the *next* fight — computed live off `tiredUntil`, not a stored battle outcome. A tired pet cannot issue a new challenge itself, but it remains a valid (and weaker) target for others. Use `GET /pets` (above) to see who's currently tired before picking a target.

### `POST /battles` — Auth

Challenge another pet to a battle. Fails if either pet is already in a pending battle.

- **Input** (JSON body, [ChallengeBattleDto](src/battle/dto/challenge-battle.dto.ts)):
  ```json
  { "defenderPetId": "uuid" }
  ```
- **Output** (201, [ReturnBattleDto](src/battle/dto/return-battle.dto.ts)):
  ```json
  {
    "id": "uuid",
    "challengerPetId": "uuid",
    "defenderPetId": "uuid",
    "status": "pending",
    "defended": false,
    "winnerPetId": null,
    "levelDifference": 0,
    "challengerXpChange": null,
    "defenderXpChange": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "resolvedAt": null
  }
  ```
  Also pushes a `battle.challenged` event to the defender's SSE stream (see below).
- **Errors**:
  - `401 Unauthorized` — missing or malformed access token
  - `400 Bad Request` — challenging your own pet
  - `404 Not Found` — no pet exists for `defenderPetId`
  - `409 Conflict` — the caller or the defender is already in a pending battle, either pet is currently pet sitting (sending or hosting), or the caller is tired

### `POST /battles/:id/accept` — Auth

React to an incoming challenge before the 15-second window closes, applying the defense boost and resolving the battle immediately.

- **Input**: none (access token only, must belong to the battle's defender)
- **Output** (201, [ReturnBattleDto](src/battle/dto/return-battle.dto.ts)) — same shape as above, now `status: "resolved"` with `defended: true`.
- **Errors**:
  - `401 Unauthorized` — missing or malformed access token
  - `403 Forbidden` — caller is not the defender of this battle
  - `404 Not Found` — no battle exists for the given id
  - `409 Conflict` — the battle is no longer pending (already resolved, or the window already elapsed)

### `GET /battles/:id` — Auth

Fetch a battle's current state (auto-resolves it first if the reaction window has since elapsed).

- **Input**: none (access token only)
- **Output** (200, [ReturnBattleDto](src/battle/dto/return-battle.dto.ts))
- **Errors**:
  - `401 Unauthorized` — missing or malformed access token
  - `404 Not Found` — no battle exists for the given id

### `GET /battles/me` — Auth

List the caller's battles (as challenger or defender), newest first.

- **Input**: none (access token only)
- **Output** (200, array of [ReturnBattleDto](src/battle/dto/return-battle.dto.ts))
- **Errors**:
  - `401 Unauthorized` — missing or malformed access token

### `GET /battles/events?token=<accessToken>`

Server-Sent Events stream of battle notifications for the caller's pet. Keep the connection open to receive:

- `battle.challenged` — sent only to the defender when someone challenges them:
  ```json
  {
    "battleId": "uuid",
    "defenderPetId": "uuid",
    "challengerPetId": "uuid",
    "challengerName": "string",
    "challengerLevel": 1,
    "expiresAt": "2024-01-01T00:00:15.000Z"
  }
  ```
- `battle.resolved` — sent to both the challenger and the defender once the battle is decided, whether by accepting or by the window timing out:
  ```json
  {
    "battleId": "uuid",
    "challengerPetId": "uuid",
    "defenderPetId": "uuid",
    "winnerPetId": "uuid",
    "defended": false,
    "challengerXpChange": 40,
    "defenderXpChange": -40,
    "resolvedAt": "2024-01-01T00:00:15.000Z"
  }
  ```
- **Errors**:
  - `401 Unauthorized` — missing or invalid token query param

All pet-sitting endpoints are under `/pet-sitting`. Endpoints marked "Auth" require an `Authorization: Bearer <accessToken>` header, same as above, except the SSE stream, which takes the token as a `?token=` query parameter instead.

Sending a pet requires both the sender and the host pet to currently be `available` (not tired, raiding, or already involved in another pet-sitting invite/session) — a pending invite counts as busy for the sender immediately, blocking them from raiding or sending again until it's accepted or expires. An invite stays `pending` for 5 minutes (`inviteExpiryMs`, [base-pet-sitting.template.ts](src/pet-sitting/config/base-pet-sitting.template.ts)); if the host doesn't accept in time, it auto-expires. Once accepted, the session runs for 1 hour (`sessionDurationMs`) and then auto-ends — there's no manual recall. While hosting, every time the host's pet is trained (`POST /pets/training`), the sent pet earns the same XP.

### `POST /pet-sitting` — Auth

Send the caller's pet to another pet's owner for pet sitting, with a letter.

- **Input** (JSON body, [CreatePetSittingDto](src/pet-sitting/dto/create-pet-sitting.dto.ts)):
  ```json
  { "hostPetId": "uuid", "letter": "string" }
  ```
  `letter` must be 1–1000 characters.
- **Output** (201, [ReturnPetSittingDto](src/pet-sitting/dto/return-pet-sitting.dto.ts)):
  ```json
  {
    "id": "uuid",
    "senderPetId": "uuid",
    "hostPetId": "uuid",
    "letter": "string",
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "acceptedAt": null,
    "endedAt": null
  }
  ```
  Also pushes a `pet-sitting.invited` event to the host's SSE stream (see below).
- **Errors**:
  - `401 Unauthorized` — missing or malformed access token
  - `400 Bad Request` — sending your pet to itself
  - `404 Not Found` — no pet exists for `hostPetId`
  - `409 Conflict` — the sender or the host pet is not currently available

### `POST /pet-sitting/:id/accept` — Auth

Accept a pending invitation, starting the session immediately.

- **Input**: none (access token only, must belong to the invitation's host)
- **Output** (201, [ReturnPetSittingDto](src/pet-sitting/dto/return-pet-sitting.dto.ts)) — same shape as above, now `status: "active"` with `acceptedAt` set. Also pushes a `pet-sitting.started` event to both the sender and the host's SSE streams.
- **Errors**:
  - `401 Unauthorized` — missing or malformed access token
  - `403 Forbidden` — caller is not the host of this invitation
  - `404 Not Found` — no invitation exists for the given id
  - `409 Conflict` — the invitation is no longer pending (already active, ended, or expired)

### `GET /pet-sitting/:id` — Auth

Fetch an invitation/session's current state (auto-expires or auto-ends it first if its window has since elapsed).

- **Input**: none (access token only)
- **Output** (200, [ReturnPetSittingDto](src/pet-sitting/dto/return-pet-sitting.dto.ts))
- **Errors**:
  - `401 Unauthorized` — missing or malformed access token
  - `404 Not Found` — no invitation exists for the given id

### `GET /pet-sitting/me` — Auth

List the caller's pet-sitting invitations/sessions (as sender or host), newest first.

- **Input**: none (access token only)
- **Output** (200, array of [ReturnPetSittingDto](src/pet-sitting/dto/return-pet-sitting.dto.ts))
- **Errors**:
  - `401 Unauthorized` — missing or malformed access token

### `GET /pet-sitting/events?token=<accessToken>`

Server-Sent Events stream of pet-sitting notifications for the caller's pet. Keep the connection open to receive:

- `pet-sitting.invited` — sent only to the host when someone sends them a pet:
  ```json
  {
    "petSittingId": "uuid",
    "senderPetId": "uuid",
    "senderName": "string",
    "hostPetId": "uuid",
    "letter": "string",
    "expiresAt": "2024-01-01T00:05:00.000Z"
  }
  ```
- `pet-sitting.started` — sent to both the sender and the host once the invitation is accepted:
  ```json
  {
    "petSittingId": "uuid",
    "senderPetId": "uuid",
    "hostPetId": "uuid",
    "startedAt": "2024-01-01T00:00:00.000Z",
    "endsAt": "2024-01-01T01:00:00.000Z"
  }
  ```
- `pet-sitting.ended` — sent to both the sender and the host once the session auto-ends after an hour:
  ```json
  {
    "petSittingId": "uuid",
    "senderPetId": "uuid",
    "hostPetId": "uuid",
    "endedAt": "2024-01-01T01:00:00.000Z"
  }
  ```
- **Errors**:
  - `401 Unauthorized` — missing or invalid token query param

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
