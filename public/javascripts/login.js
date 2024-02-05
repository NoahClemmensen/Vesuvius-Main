$(document).ready(function () {
    const loginUsernameInput = $('#loginUsernameInput');
    const loginPasswordInput = $('#loginPasswordInput');
    const loginSubmitBtn = $('#loginSubmitBtn');
    const errorBox = $('#loginErrorBox');

    function showError(message) {
        errorBox.text(message);
        errorBox.show();
    }

    function hideError() {
        errorBox.hide();
    }

    /* On login button submit */
    loginSubmitBtn.click(function() {
        const username = sanitizeInput(loginUsernameInput.val());
        const password = sanitizeInput(loginPasswordInput.val());

        if (username === '' || password === '') {
            alert('Please enter a username and password');
            return;
        }

        const loginData = {
            username: username,
            password: password
        };

        $.post("/api/login", loginData)
            .then(function(data) {
                console.log(data);
                hideError();
                loginUsernameInput.val('');
                loginPasswordInput.val('');

                location.reload();
            })
            .catch(function(err) {
                console.log(err.responseJSON.error);
                showError(err.responseJSON.error);
            });
    });
});