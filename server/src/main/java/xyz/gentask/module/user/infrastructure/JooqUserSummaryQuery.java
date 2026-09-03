package xyz.gentask.module.user.infrastructure;

import static xyz.gentask.jooq.Tables.USERS;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;
import xyz.gentask.module.user.domain.user.Role;
import xyz.gentask.module.user.domain.user.UserSummary;
import xyz.gentask.module.user.domain.user.UserSummaryQuery;

@Repository
@RequiredArgsConstructor
class JooqUserSummaryQuery implements UserSummaryQuery {

    private final DSLContext dslContext;

    @Override
    public List<UserSummary> search(String keyword, int limit, int offset) {
        return dslContext
                .select(USERS.ID, USERS.EMAIL, USERS.NICKNAME, USERS.ROLE, USERS.CREATED_AT)
                .from(USERS)
                .where(matches(keyword))
                .orderBy(USERS.CREATED_AT.desc())
                .limit(limit)
                .offset(offset)
                .fetch(JooqUserSummaryQuery::toSummary);
    }

    @Override
    public List<UserSummary> findAllByIds(Collection<UUID> userIds) {
        if (userIds.isEmpty()) {
            return List.of();
        }
        return dslContext
                .select(USERS.ID, USERS.EMAIL, USERS.NICKNAME, USERS.ROLE, USERS.CREATED_AT)
                .from(USERS)
                .where(USERS.ID.in(userIds))
                .fetch(JooqUserSummaryQuery::toSummary);
    }

    @Override
    public long count(String keyword) {
        return dslContext.fetchCount(USERS, matches(keyword));
    }

    private static UserSummary toSummary(org.jooq.Record record) {
        return new UserSummary(
                record.get(USERS.ID),
                record.get(USERS.EMAIL),
                record.get(USERS.NICKNAME),
                Role.valueOf(record.get(USERS.ROLE)),
                record.get(USERS.CREATED_AT));
    }

    /**
     * 관리자 검색을 위해 원본 이메일 및 닉네임에 대한 대소문자 무시 부분 일치 조건을 구성한다.
     */
    private static Condition matches(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return DSL.noCondition();
        }
        String pattern = "%" + keyword.strip().toLowerCase() + "%";
        return DSL.lower(USERS.EMAIL).like(pattern).or(DSL.lower(USERS.NICKNAME).like(pattern));
    }
}
