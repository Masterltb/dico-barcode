package com.dico.scan.exception;

public class ExternalServiceException extends RuntimeException {
    public ExternalServiceException(String service, String reason) {
        super("External service '" + service + "' failed: " + reason);
    }

    public ExternalServiceException(String service, Throwable cause) {
        super("External service '" + service + "' failed: " + cause.getMessage(), cause);
    }
}
