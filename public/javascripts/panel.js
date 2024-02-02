$(document).ready(function() {
    const loginModal = $('#loginModal');
    const loginUsernameInput = $('#loginUsernameInput');
    const loginPasswordInput = $('#loginPasswordInput');
    const loginSubmitBtn = $('#loginSubmitBtn');

    // On load, check if logged in
    // If not logged in, show login modal

    /* On login button submit */
    loginSubmitBtn.click(function() {
        const username = loginUsernameInput.val();
        const password = loginPasswordInput.val();

        if (username === '' || password === '') {
            alert('Please enter a username and password');
            return;
        }

        $.ajax({
            url: '/login',
            type: 'POST',
            data: {
                username: username,
                password: password
            },
            success: function(data) {
                if (data === 'success') {
                    loginModal.modal('hide');
                    location.reload();
                } else {
                    alert('Invalid username or password');
                }
            }
        });
    });
});
