document.addEventListener("DOMContentLoaded", function() {

    var pageWrap = document.getElementsByClassName('page-wrap docs')[0];
    if (pageWrap) {
        document.getElementById('nav-wrapper').addEventListener('click', toggleDocsNav);
    }

});

function toggleDocsNav(e) {
    document.getElementsByClassName('page-wrap')[0].classList.toggle('open');
}
