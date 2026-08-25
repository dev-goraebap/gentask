package dev.goraebap.refarch.shared.error;

public class DomainRuleViolation extends RuntimeException {

    public DomainRuleViolation(String message) {
        super(message);
    }
}
