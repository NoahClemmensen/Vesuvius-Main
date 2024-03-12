function removeStaff(id) {
    console.log(id);
    $.post("/api/admin/removeStaff", {id: id})
        .then(function (data) {
            location.reload();
        })
        .catch(function (error) {
            alert(error);
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
        console.log('role id -> ' + roleId);
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

    $.ajax({
        type: "POST",
        url: url,
        data: form.serialize(), // Serialize the form data for the POST request
        success: function(data)
        {
            location.reload(); // Reload the page after the server responds
        }
    });
});