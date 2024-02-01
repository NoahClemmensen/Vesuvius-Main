$(document).ready(function() {
    const nameInput = $("#nameInput");
    const phoneInput = $("#phoneInput");
    const guestsInput = $("#guestsInput");
    const timeInput = $("#timeInput");
    const submitBtn = $("#submitBtn");
    const errorBox = $("#tableAvailableError");

    function showError(message) {
        submitBtn.addClass("disabled");
        errorBox.show();
        errorBox.text(message);
    }

    function hideError() {
        submitBtn.removeClass("disabled");
        errorBox.hide();
    }

    function validateTimeIsFuture() {
        const time = sanitizeInput(timeInput.val().trim());
        const now = Date.now();
        const selectedTime = new Date(time);

        if (selectedTime < now) {
            showError("Time must be in the future.");
            return false;
        } else {
            hideError();
            return true;
        }
    }

    function validateAvailableTables() {
        const guests = sanitizeInput(guestsInput.val().trim());
        const time = sanitizeInput(timeInput.val().trim());

        // Return if not both has been filled
        if (guests <= 0 || time === "") {
            errorBox.hide();
            submitBtn.addClass("disabled");
            return;
        }

        $.post("/api/getAvailableTables", {selectedTime: timeInput.val().trim()})
            .then(function(data) {
                // check if there is enough available tables
                const availableTables = data.length;
                const tablesNeeded = Math.ceil(guests / 2);

                if (tablesNeeded > availableTables) {
                    showError("Not enough tables available for this time.")
                } else {
                    hideError();
                }
            });
    }

    /* On guest input change */
    guestsInput.on('change', function(event) {
        validateAvailableTables()
    });

    /* On time input change */
    timeInput.on('change', function(event) {
        if (!validateTimeIsFuture()) return;
        validateAvailableTables();
    });

    /* On submit */
    submitBtn.on('click', function(event) {
        event.preventDefault();

        // Check if all fields are filled
        datetim

        const newReservation = {
            name: sanitizeInput(nameInput.val().trim()),
            phone: sanitizeInput(phoneInput.val().trim()),
            guests: sanitizeInput(guestsInput.val().trim()),
            time: sanitizeInput(timeInput.val().trim())
        };

        console.log(newReservation);

        $.post("/api/makeReservation", newReservation);
    });


});