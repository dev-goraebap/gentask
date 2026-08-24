# 실행 전용 이미지다. ng build 산출물(dist)만 담는다. SSR 서버 번들은 의존성까지
# 포함되어 있어 node_modules 가 필요 없다.
FROM node:22-alpine

WORKDIR /app
ENV PORT=4000
COPY dist/web ./dist/web

EXPOSE 4000
CMD ["node", "dist/web/server/server.mjs"]
