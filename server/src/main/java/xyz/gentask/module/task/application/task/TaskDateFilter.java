package xyz.gentask.module.task.application.task;

import java.time.LocalDate;

public record TaskDateFilter(LocalDate date, boolean undated, boolean includeOverdue) {
    public TaskDateFilter {
        if (date != null && undated) throw new IllegalArgumentException("날짜와 날짜 미지정 조건은 함께 사용할 수 없습니다.");
        if (includeOverdue && date == null) throw new IllegalArgumentException("기한 초과 조회에는 기준 날짜가 필요합니다.");
    }

    public static TaskDateFilter all() {
        return new TaskDateFilter(null, false, false);
    }
}
