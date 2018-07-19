/*
  AUTHOR David Freer
  Date: 7/15/2018
  Notes: 

    This should be called after your body/main tag and relies. 

    This is not a plug-in-play solution. This relies heavily on CSS classes and styling.

    Regardless, any element with the class name .accordion-header will add an
    .active class (which is styled in profile/main.css)
*/

//target only headers for event (and anything in the header)
let sections = [...document.getElementsByClassName("accordion-header")];
sections.map(m => m.addEventListener("click", toggleAccordion));

function toggleAccordion(e) {
  sections.map(m => m.parentNode.classList.remove("active"));
  this.parentNode.classList.toggle("active");
}