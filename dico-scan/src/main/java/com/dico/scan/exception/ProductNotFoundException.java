package com.dico.scan.exception;

public class ProductNotFoundException extends RuntimeException {
    private final String barcode;

    public ProductNotFoundException(String barcode) {
        super("Product not found for barcode: " + barcode);
        this.barcode = barcode;
    }

    public String getBarcode() {
        return barcode;
    }
}
