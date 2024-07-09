export function socket_logic() {
    const socket = new WebSocket(
        'wss://' + window.location.host + '/ws/online_status/'
    );

    socket.onopen = function open() {
        sessionStorage.setItem('webSocketOpen', 'true');
        console.log('WebSocket connection created.');
    };

    socket.onmessage = function message(event) {
        var data = JSON.parse(event.data);
        // NOTE: We escape JavaScript to prevent XSS attacks.
        var username = encodeURI(data['username']);
        var user = $('li').filter(function () {
            return $(this).data('username') == username;
        });

        if (data['is_logged_in']) {
            user.html(username + ': Online');
        }
        else {
            user.html(username + ': Offline');
        }
    };

    if (socket.readyState == WebSocket.OPEN) {
        socket.onopen();
    }

    socket.onclose = function (e) {
        sessionStorage.removeItem('webSocketOpen');
    };
}


