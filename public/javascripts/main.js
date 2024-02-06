function sanitizeInput(input) {
    // Remove script tags
    input = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

    // Remove URIs
    input = input.replace(/((http|https|ftp):\/\/[^\s]+)/gi, "");

    // Remove event handlers
    input = input.replace(/ on\w+="[^"]*"/gi, "");

    return input;
}

function getCookie(name) {
    const value = "; " + document.cookie;
    const parts = value.split("; " + name + "=");
    if (parts.length === 2) return parts.pop().split(";").shift();
}

$(document).ready(function() {
    const role = getCookie('role');
    if (role === '1') { // Admin
        $('#adminNav').show();
    } else if (role == true) { // Staff
        $('#adminNav').hide();
        $('#staffPanelNav').show();
    } else { // Clients
        $('#adminNav').hide();
        $('#staffPanelNav').hide();
    }
});