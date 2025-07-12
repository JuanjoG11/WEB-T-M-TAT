
document.addEventListener('DOMContentLoaded',()=>{
  const links=document.querySelectorAll('.navbar a');
  function onScroll(){
    links.forEach(l=>{
      const sec=document.querySelector(l.getAttribute('href'));
      if(sec && sec.getBoundingClientRect().top<=100 && sec.getBoundingClientRect().bottom>=100){
        l.classList.add('active');
      }else{l.classList.remove('active');}
    });
  }
  window.addEventListener('scroll',onScroll);
});
