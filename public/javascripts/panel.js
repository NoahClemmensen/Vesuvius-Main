$(document).ready(function() {
    const loginUsernameInput = $('#loginUsernameInput');
    const loginPasswordInput = $('#loginPasswordInput');
    const loginSubmitBtn = $('#loginSubmitBtn');
    const errorBox = $('#errorBox');
    const loginModal = $('#loginModal');

    // On load, check if logged in
    // If not logged in, show login modal

    // Also hide login modal after login, and make sure to check in the backend if they are already logged in

    function showError(message) {
        errorBox.text(message);
        errorBox.show();
    }

    function hideError() {
        errorBox.hide();
    }

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

                loginModal.modal('hide');
            })
            .catch(function(err) {
                console.log(err.responseJSON.error);
                showError(err.responseJSON.error);
            });
    });
});
