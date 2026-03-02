// src/api/contribute.ts

import { apiClient } from "./client";

/**
 * POST /v1/contribute (multipart/form-data)
 * Submits a product image for OCR processing.
 * Returns 202 Accepted — async processing.
 */
export const submitContribution = async (
    barcode: string,
    imageUri: string
): Promise<void> => {
    const formData = new FormData();
    formData.append("barcode", barcode);
    formData.append("image", {
        uri: imageUri,
        name: "product.jpg",
        type: "image/jpeg",
    } as unknown as Blob);

    await apiClient.post("/v1/contribute", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
};
