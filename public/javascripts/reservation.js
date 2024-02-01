$(document).ready(function() {
    const nameInput = $("#nameInput");
    const phoneInput = $("#phoneInput");
    const guestsInput = $("#guestsInput");
    const timeInput = $("#timeInput");
    const submitBtn = $("#submitBtn");


    /* On submit */
    submitBtn.on('click', function(event) {
        event.preventDefault();
        const newReservation = {
            name: nameInput.val().trim(),
            phone: phoneInput.val().trim(),
            guests: guestsInput.val().trim(),
            time: timeInput.val().trim()
        };

        console.log(newReservation);

        $.post("/api/makeReservation", newReservation)
        .then(function(data) {
            console.log(data);
            alert("Adding reservation...");
        });
    });


});