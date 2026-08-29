package dev.goraebap.refarch.module.notification.infrastructure;

import static dev.goraebap.refarch.jooq.Tables.PUSH_DELIVERY_FAILURES;

import dev.goraebap.refarch.module.notification.domain.failure.PushDeliveryFailure;
import dev.goraebap.refarch.module.notification.domain.failure.PushFailureQuery;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
class JooqPushFailureQuery implements PushFailureQuery {

    private final DSLContext dslContext;

    @Override
    public List<PushDeliveryFailure> search(boolean includeResolved, int limit, int offset) {
        return dslContext
                .selectFrom(PUSH_DELIVERY_FAILURES)
                .where(filter(includeResolved))
                .orderBy(PUSH_DELIVERY_FAILURES.OCCURRED_AT.desc())
                .limit(limit)
                .offset(offset)
                .fetch(JooqPushDeliveryFailureRepository::toDomain);
    }

    @Override
    public long count(boolean includeResolved) {
        return dslContext.fetchCount(PUSH_DELIVERY_FAILURES, filter(includeResolved));
    }

    private static Condition filter(boolean includeResolved) {
        return includeResolved ? DSL.noCondition() : PUSH_DELIVERY_FAILURES.RESOLVED_AT.isNull();
    }
}
