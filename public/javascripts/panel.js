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

    const role = getCookie('role');
    console.log(role);
    if (role === '1') {
        console.log('admin only')
        $('#adminNav').show();
    } else if (role !== undefined || role !== null || role !== '') {
        console.log('staff only')
        $('#adminNav').hide();
        $('#staffPanelNav').show();
    } else {
        console.log('clients')
        $('#adminNav').hide();
        $('#staffPanelNav').hide();
    }
});
