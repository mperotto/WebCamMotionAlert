document.addEventListener('DOMContentLoaded', (event) => {
    
    document.getElementById('login-form').addEventListener('submit', function (event) {
        console.log("Form submitted");
        event.preventDefault();

        var clientid = document.getElementById('clientid').value;
        var secret = document.getElementById('secret').value;

        fetch('/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                clientid: clientid,
                secret: secret
            })
        })
        .then(function (response) {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Login failed');
            }
        })
        .then(function (data) {
            if (data.token) {
                fetch('/redirectlogin', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + data.token
                    },
                })
                .then(response => {
                    // HTTP 301 response
                    // HOW CAN I FOLLOW THE HTTP REDIRECT RESPONSE?
                    if (response.redirected) {
                        window.location.href = response.url;
                    }
                })
                .catch((error) => {
                    displayError(error.message);
                });
            }
        })
        
    });  

    var errorElement = document.getElementById('error-message');
    if (errorElement.textContent.trim() !== '') {
        displayError(errorElement.textContent.trim());
    }

    function displayError(message) {
        var errorElement = document.getElementById('error-message');
        errorElement.textContent = message;
        errorElement.classList.remove('d-none');
    }
      
});
