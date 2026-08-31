package xyz.gentask.module.notification.infrastructure;

import static xyz.gentask.jooq.Tables.PUSH_DELIVERY_FAILURES;

import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.gentask.jooq.tables.records.PushDeliveryFailuresRecord;
import xyz.gentask.module.notification.domain.failure.PushDeliveryFailure;
import xyz.gentask.module.notification.domain.failure.PushDeliveryFailure.Reason;
import xyz.gentask.module.notification.domain.failure.PushDeliveryFailureRepository;

@Repository
@RequiredArgsConstructor
class JooqPushDeliveryFailureRepository implements PushDeliveryFailureRepository {

    private final DSLContext dslContext;

    @Override
    public void save(PushDeliveryFailure failure) {
        dslContext
                .insertInto(PUSH_DELIVERY_FAILURES)
                .set(PUSH_DELIVERY_FAILURES.ID, failure.id())
                .set(PUSH_DELIVERY_FAILURES.USER_ID, failure.userId())
                .set(PUSH_DELIVERY_FAILURES.ENDPOINT, failure.endpoint())
                .set(PUSH_DELIVERY_FAILURES.TASK_ID, failure.taskId())
                .set(PUSH_DELIVERY_FAILURES.REASON, failure.reason().name())
                .set(PUSH_DELIVERY_FAILURES.DETAIL, failure.detail())
                .set(PUSH_DELIVERY_FAILURES.OCCURRED_AT, failure.occurredAt())
                .set(PUSH_DELIVERY_FAILURES.RESOLVED_AT, failure.resolvedAt())
                .onConflict(PUSH_DELIVERY_FAILURES.ID)
                .doUpdate()
                .set(PUSH_DELIVERY_FAILURES.RESOLVED_AT, failure.resolvedAt())
                .execute();
    }

    @Override
    public Optional<PushDeliveryFailure> findById(UUID failureId) {
        return dslContext
                .selectFrom(PUSH_DELIVERY_FAILURES)
                .where(PUSH_DELIVERY_FAILURES.ID.eq(failureId))
                .fetchOptional()
                .map(JooqPushDeliveryFailureRepository::toDomain);
    }

    static PushDeliveryFailure toDomain(PushDeliveryFailuresRecord record) {
        return PushDeliveryFailure.restore(
                record.getId(),
                record.getUserId(),
                record.getEndpoint(),
                record.getTaskId(),
                Reason.valueOf(record.getReason()),
                record.getDetail(),
                record.getOccurredAt(),
                record.getResolvedAt());
    }
}
