var webrRtcId = localStorage.getItem("webrRtcId");
if (webrRtcId) {

    window.addEventListener("unload", function (event) {
        $.ajax({
            url: "/api/leavingUser/" + webrRtcId + "",
            type: "PUT",
            success: function (response) {
                //       alert(response);
            },
        });
    });
    $.ajax({
        url: "/api/leavingUser/" + webrRtcId + "",
        type: "PUT",
        success: function (response) {
            //     alert(response);
        },
    });
}