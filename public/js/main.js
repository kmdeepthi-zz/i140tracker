$(function() {
    $("#notifyBtn").click(function() {
        var receipt = $("#receipt").val(),
            email = $("#email").val(),
            phone = $("#phone").val(),
            $currStatus = $('.current-status');

        var reqBody = {
            receipt: receipt
        };

        if(email && email.length > 0) {
            reqBody.email = email;
        }

        if(phone && phone.length > 0) {
            reqBody.phone = phone;
        }

        $.ajax({
            url : "/api/usercase/create",
            type: "POST",
            data: JSON.stringify(reqBody),
            contentType: "application/json; charset=utf-8",
            dataType   : "json",
            success    : function(result){
                if(result.userCase && result.userCase.statusBody) {
                    $currStatus.find('.title').html(result.userCase.statusTitle);
                    $currStatus.find('.desc').html(result.userCase.statusBody);
                    $currStatus.removeClass("hidden");
                }

                var $modalBody = $("#userCaseCreated .modal-body");
                $modalBody.html("<p>If you have provided your phone or email, you will receive notifications when there is a change in your status</p>");
                $("#userCaseCreated").modal();
            },
            error: function() {
                $currStatus.addClass("hidden");
                var $modalBody = $("#userCaseCreated .modal-body");
                $modalBody.html("<p>There was an error creating your case, please try again.</p>");
                $("#userCaseCreated").modal();
            }
        });

    });
});