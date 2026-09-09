package xyz.gentask.shared.domain;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public record ResourceFilter(String projectId, boolean personal) {
    public static ResourceFilter of(String projectId, String scope) {
        if (scope != null && !scope.equals("personal") && !scope.equals("all"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "scope must be personal or all");
        if (projectId != null && (projectId.isBlank() || scope != null))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "projectId and scope cannot be combined");
        return new ResourceFilter(projectId, "personal".equals(scope));
    }
}
