function sanitizeInput(input) {
    // Remove script tags
    input = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

    // Remove URIs
    input = input.replace(/((http|https|ftp):\/\/[^\s]+)/gi, "");

    // Remove event handlers
    input = input.replace(/ on\w+="[^"]*"/gi, "");

    return input;
}