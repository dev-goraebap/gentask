package dev.goraebap.refarch.module.notification.infrastructure;

import static dev.goraebap.refarch.jooq.Tables.PUSH_SUBSCRIPTIONS;

import dev.goraebap.refarch.jooq.tables.records.PushSubscriptionsRecord;
import dev.goraebap.refarch.module.notification.domain.subscription.PushSubscription;
import dev.goraebap.refarch.module.notification.domain.subscription.PushSubscriptionRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
class JooqPushSubscriptionRepository implements PushSubscriptionRepository {

    private final DSLContext dslContext;

    @Override
    public void save(PushSubscription subscription) {
        dslContext
                .insertInto(PUSH_SUBSCRIPTIONS)
                .set(PUSH_SUBSCRIPTIONS.ID, subscription.id())
                .set(PUSH_SUBSCRIPTIONS.USER_ID, subscription.userId())
                .set(PUSH_SUBSCRIPTIONS.ENDPOINT, subscription.endpoint())
                .set(PUSH_SUBSCRIPTIONS.P256DH, subscription.p256dh())
                .set(PUSH_SUBSCRIPTIONS.AUTH, subscription.auth())
                .set(PUSH_SUBSCRIPTIONS.CREATED_AT, subscription.createdAt())
                .execute();
    }

    @Override
    public List<PushSubscription> findByUserId(UUID userId) {
        return dslContext
                .selectFrom(PUSH_SUBSCRIPTIONS)
                .where(PUSH_SUBSCRIPTIONS.USER_ID.eq(userId))
                .orderBy(PUSH_SUBSCRIPTIONS.CREATED_AT.asc())
                .fetch(JooqPushSubscriptionRepository::toDomain);
    }

    @Override
    public Optional<PushSubscription> findByEndpoint(String endpoint) {
        return dslContext
                .selectFrom(PUSH_SUBSCRIPTIONS)
                .where(PUSH_SUBSCRIPTIONS.ENDPOINT.eq(endpoint))
                .fetchOptional()
                .map(JooqPushSubscriptionRepository::toDomain);
    }

    @Override
    public int countByUserId(UUID userId) {
        return dslContext.fetchCount(PUSH_SUBSCRIPTIONS, PUSH_SUBSCRIPTIONS.USER_ID.eq(userId));
    }

    @Override
    public void deleteByEndpoint(String endpoint) {
        dslContext
                .deleteFrom(PUSH_SUBSCRIPTIONS)
                .where(PUSH_SUBSCRIPTIONS.ENDPOINT.eq(endpoint))
                .execute();
    }

    @Override
    public void deleteById(UUID subscriptionId) {
        dslContext
                .deleteFrom(PUSH_SUBSCRIPTIONS)
                .where(PUSH_SUBSCRIPTIONS.ID.eq(subscriptionId))
                .execute();
    }

    private static PushSubscription toDomain(PushSubscriptionsRecord pushSubscriptionsRecord) {
        return PushSubscription.restore(
                pushSubscriptionsRecord.getId(),
                pushSubscriptionsRecord.getUserId(),
                pushSubscriptionsRecord.getEndpoint(),
                pushSubscriptionsRecord.getP256dh(),
                pushSubscriptionsRecord.getAuth(),
                pushSubscriptionsRecord.getCreatedAt());
    }
}
