package dev.goraebap.refarch.module.task.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class TaskTest {

    private static final Instant CREATED = Instant.parse("2026-08-01T00:00:00Z");
    private static final Instant LATER = Instant.parse("2026-08-02T00:00:00Z");
    private static final Instant LATEST = Instant.parse("2026-08-03T00:00:00Z");

    private static Task 새_작업() {
        return Task.create(UUID.randomUUID(), TaskTitle.of("장 보기"), CREATED);
    }

    @Test
    void 제목_외에는_정해지지_않은_상태로_태어난다() {
        Task task = 새_작업();

        assertThat(task.title().value()).isEqualTo("장 보기");
        assertThat(task.note().value()).isEmpty();
        assertThat(task.dueDate()).isNull();
        assertThat(task.remindAt()).isNull();
        assertThat(task.important()).isFalse();
        assertThat(task.myDayOn()).isNull();
        assertThat(task.isCompleted()).isFalse();
        assertThat(task.createdAt()).isEqualTo(task.updatedAt());
    }

    @Test
    void 완료하면_완료_시각이_남는다() {
        Task task = 새_작업();

        task.complete(LATER);

        assertThat(task.isCompleted()).isTrue();
        assertThat(task.completedAt()).isEqualTo(LATER);
        assertThat(task.updatedAt()).isEqualTo(LATER);
    }

    @Test
    void 이미_완료된_것을_다시_완료해도_처음_시각이_밀리지_않는다() {
        Task task = 새_작업();
        task.complete(LATER);

        task.complete(LATEST);

        assertThat(task.completedAt()).isEqualTo(LATER);
        assertThat(task.updatedAt()).isEqualTo(LATER);
    }

    @Test
    void 완료를_취소하면_완료_시각이_사라진다() {
        Task task = 새_작업();
        task.complete(LATER);

        task.cancelCompletion(LATEST);

        assertThat(task.isCompleted()).isFalse();
        assertThat(task.completedAt()).isNull();
        assertThat(task.updatedAt()).isEqualTo(LATEST);
    }

    @Test
    void 완료가_아닌_것을_취소해도_아무_일도_없다() {
        Task task = 새_작업();

        task.cancelCompletion(LATER);

        assertThat(task.isCompleted()).isFalse();
        assertThat(task.updatedAt()).isEqualTo(CREATED);
    }

    @Test
    void 제목을_바꾸면_고친_시각이_따라간다() {
        Task task = 새_작업();

        task.changeTitle(TaskTitle.of("장 보기와 세탁"), LATER);

        assertThat(task.title().value()).isEqualTo("장 보기와 세탁");
        assertThat(task.updatedAt()).isEqualTo(LATER);
    }

    @Test
    void 제목을_널로_바꾸지_못한다() {
        Task task = 새_작업();

        assertThatThrownBy(() -> task.changeTitle(null, LATER)).isInstanceOf(NullPointerException.class);
    }

    @Test
    void 메모를_바꾼다() {
        Task task = 새_작업();

        task.changeNote(TaskNote.of("우유와 달걀"), LATER);

        assertThat(task.note().value()).isEqualTo("우유와 달걀");
    }

    @Test
    void 기한은_널로_떼어진다() {
        Task task = 새_작업();
        task.changeDueDate(LocalDate.of(2026, 8, 10), LATER);

        task.changeDueDate(null, LATEST);

        assertThat(task.dueDate()).isNull();
        assertThat(task.updatedAt()).isEqualTo(LATEST);
    }

    @Test
    void 미리_알림은_널로_떼어진다() {
        Task task = 새_작업();
        task.changeRemindAt(LocalDateTime.of(2026, 8, 10, 9, 0), LATER);

        task.changeRemindAt(null, LATEST);

        assertThat(task.remindAt()).isNull();
    }

    @Test
    void 기한과_미리_알림은_서로를_정하지_않는다() {
        Task withDueDate = 새_작업();
        Task withRemindAt = 새_작업();

        withDueDate.changeDueDate(LocalDate.of(2026, 8, 10), LATER);
        withRemindAt.changeRemindAt(LocalDateTime.of(2026, 8, 10, 9, 0), LATER);

        assertThat(withDueDate.remindAt()).isNull();
        assertThat(withRemindAt.dueDate()).isNull();
    }

    @Test
    void 중요_표시를_켜고_끈다() {
        Task task = 새_작업();

        task.markImportant(LATER);
        assertThat(task.important()).isTrue();

        task.clearImportant(LATEST);
        assertThat(task.important()).isFalse();
        assertThat(task.updatedAt()).isEqualTo(LATEST);
    }

    @Test
    void 나의_하루에_담고_뺀다() {
        Task task = 새_작업();
        LocalDate today = LocalDate.of(2026, 8, 2);

        task.addToMyDay(today, LATER);
        assertThat(task.myDayOn()).isEqualTo(today);

        task.removeFromMyDay(LATEST);
        assertThat(task.myDayOn()).isNull();
    }

    @Test
    void 나의_하루에_담는_날짜는_반드시_주어진다() {
        Task task = 새_작업();

        assertThatThrownBy(() -> task.addToMyDay(null, LATER)).isInstanceOf(NullPointerException.class);
    }

    @Test
    void 완료된_작업도_편집할_수_있다() {
        Task task = 새_작업();
        task.complete(LATER);

        task.changeTitle(TaskTitle.of("이미 끝낸 일"), LATEST);

        assertThat(task.title().value()).isEqualTo("이미 끝낸 일");
        assertThat(task.isCompleted()).isTrue();
    }
}
