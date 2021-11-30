"use strict";
// function afficherPhoto(files) {
//     let vignette = document.querySelector('.listVignette');
//     vignette.src = '';
//     if (!files || !files.length)
//         return;
//     let file = files[0];
//     if (!(file instanceof File))
//         return;
//     let reader = new FileReader();
//     reader.onload = function () {
//         vignette.src = `${this.result}`;
//     };
//     reader.readAsDataURL(file);
// }
function afficherPhoto() {
    let fileInput = document.getElementById('photo');
    let filePath = fileInput.value;
    let allowedExtensions = /(\.jpg)$/i;
    if (!allowedExtensions.exec(filePath)) {
        alert('SVP photo avec extension .jpeg seulement.');
        fileInput.value = '';
        return false;
    } else {
        //Image preview
        if (fileInput.files && fileInput.files[0]) {
            let vignette = document.querySelector('.listVignette');
            vignette.src = '';
            let reader = new FileReader();
            reader.onload = function () {
                vignette.src = `${this.result}`;
            };
            reader.readAsDataURL(fileInput.files[0]);
        }
    }
}
