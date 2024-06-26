function removeStaff(id) {
    $.ajax({
        url: "/api/admin/removeStaff",
        type: 'POST',
        data: {id: id},
        headers: { 'x-api-key': getCookie('api-key') },
        success: function(data) {
            location.reload();
        },
        error: function(err) {
            alert(err);
        }
    });
}
function openEditModal(staffId, staffName) {
    $("#changeStaffRoleBtn").data('staffId', staffId);
    $("#staffRoleModalTitle").text("修改" + staffName + "权限");
    $("#changeStaffRole").modal('show');
}

$(document).ready(function () {
    const $changeStaffRoleBtn = $("#changeStaffRoleBtn");

    $changeStaffRoleBtn.on('click', function () {
        const staffId = $(this).data('staffId');
        const roleId = $('#staffRoleSelect').val();

        $.ajax({
            url: "/api/admin/changeStaffRole",
            type: 'POST',
            data: {staffId: staffId, roleId: roleId},
            headers: { 'x-api-key': getCookie('api-key') },
            success: function(data) {
                location.reload();
            },
            error: function(err) {
                alert(err);
            }
        });
    });
});

$(document).on('submit', 'form', function(e) {
    e.preventDefault(); // Prevent the form from submitting normally

    var form = $(this);
    var url = form.attr('action');

    console.log("Api Key: " + getCookie('api-key'));

    $.ajax({
        type: "POST",
        url: url,
        headers: { 'x-api-key': getCookie('api-key') },
        data: form.serialize(), // Serialize the form data for the POST request
        success: function(data)
        {
            location.reload(); // Reload the page after the server responds
        }
    });
});