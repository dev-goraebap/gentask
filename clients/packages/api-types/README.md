# api-types

`server/openapi.json` 에서 만드는 계약 타입입니다. `web` 과 `mcp` 가 이것 하나를 봅니다.

`src/schema.d.ts` 는 생성물이며 **손으로 고치지 않습니다.** 서버가 계약을 바꾸면 다시 만들고,
그 결과와 그것을 쓰는 코드를 같은 커밋에 담습니다.

```bash
npm run api:generate -w api-types
```

산출물을 추적하는 근거는 [프론트엔드 03. 데이터 흐름](../../../docs/architecture/concepts/frontend-03-data-flow.md) §8 이 갖습니다.
