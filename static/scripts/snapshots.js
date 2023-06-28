window.onload = function () {
    var modal = document.getElementById("myModal");
    var modalImg = document.getElementById("img01");
    var captionText = document.getElementById("caption");
    var images = document.getElementsByClassName("img-modal");
    var currentIndex = 0;

    for (var i = 0; i < images.length; i++) {
        var img = images[i];
        img.onclick = function (evt) {
            currentIndex = Array.from(images).indexOf(evt.target);
            openModal(images[currentIndex]);
        }
    }

    document.getElementById('logout-button').addEventListener('click', function () {
        window.location.href = '/logout';
    });

    function openModal(img) {
        modal.style.display = "block";
        modalImg.src = img.src;
        captionText.innerHTML = img.alt;
        for (var i = 0; i < images.length; i++) {
            images[i].classList.remove("selected");
        }
        img.classList.add("selected");

        // Adicione isso dentro do evento span.onclick:
        for (var i = 0; i < images.length; i++) {
            images[i].classList.remove("selected");
        }        
    }

    var span = document.getElementsByClassName("close")[0];

    span.onclick = function () {
        modal.style.display = "none";
    }

    document.onkeydown = function (evt) {
        evt = evt || window.event;
        switch (evt.keyCode) {
            case 37:
                // Para a esquerda
                currentIndex = (currentIndex > 0) ? currentIndex - 1 : images.length - 1;
                if (images[currentIndex]) {
                    openModal(images[currentIndex]);
                }
                break;
            case 39:
                // Para a direita
                currentIndex = (currentIndex < images.length - 1) ? currentIndex + 1 : 0;
                if (images[currentIndex]) {
                    openModal(images[currentIndex]);
                }
                break;

        }
    };
}
