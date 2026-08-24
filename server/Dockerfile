# 실행 전용 이미지다. 빌드(테스트 · jOOQ 생성 포함)는 배포 전에 로컬에서 끝내고
# bootJar 산출물만 담는다 — 서버에서 다시 빌드하면 검증을 지난 것과 다른 산출물이 뜬다.
#
# 빌드 컨텍스트는 레포가 아니라 배포 스테이징(deploy/README.md)이다. jar 가 이 파일
# 옆에 놓인다.
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app
COPY app.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
