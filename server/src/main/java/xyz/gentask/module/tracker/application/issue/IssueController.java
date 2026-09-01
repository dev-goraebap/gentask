package xyz.gentask.module.tracker.application.issue;

import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import xyz.gentask.module.tracker.application.issue.IssueRequests.ChangeState;
import xyz.gentask.module.tracker.application.issue.IssueRequests.CreateIssue;
import xyz.gentask.module.tracker.application.issue.IssueViews.IssueSummary;
import xyz.gentask.module.tracker.application.issue.IssueViews.IssueView;
import xyz.gentask.shared.web.CurrentUser;

/**
 * 작업 아이템은 프로젝트 아래에 선다.
 *
 * <p>번호가 프로젝트 안에서만 유일하므로 주소도 그 아래에 둔다. 번호만으로 여는 자리를 두면 어느
 * 프로젝트의 것인지 주소가 말하지 않는다.
 */
@RestController
@RequestMapping("/api/v1/projects/{projectId}/issues")
@RequiredArgsConstructor
public class IssueController {

    private final IssueService issueService;

    @PostMapping
    @ApiResponse(responseCode = "201", description = "Created")
    public ResponseEntity<Void> add(
            @CurrentUser UUID userId, @PathVariable UUID projectId, @Valid @RequestBody CreateIssue request) {
        int number = issueService.add(userId, projectId, request.title(), request.kind(), request.body());
        return ResponseEntity.created(URI.create("/api/v1/projects/" + projectId + "/issues/" + number))
                .build();
    }

    @GetMapping
    public List<IssueSummary> list(@CurrentUser UUID userId, @PathVariable UUID projectId) {
        return issueService.list(userId, projectId);
    }

    @GetMapping("/{number}")
    public IssueView detail(@CurrentUser UUID userId, @PathVariable UUID projectId, @PathVariable int number) {
        return issueService.detail(userId, projectId, number);
    }

    @PatchMapping("/{number}/state")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changeState(
            @CurrentUser UUID userId,
            @PathVariable UUID projectId,
            @PathVariable int number,
            @Valid @RequestBody ChangeState request) {
        issueService.changeState(userId, projectId, number, request.state());
    }
}
