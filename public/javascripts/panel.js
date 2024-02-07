$(document).ready(function() {
    /* On cookie checker btn press */
    $('#cookieCheckerBtn').click(function() {
        $.get("/api/checkCookie")
            .then(function() {
                console.log("Cookie good :) nomnomnomnom")
            })
            .catch(function() {
                console.log("Cookie bad :(")
            });
    });
});
