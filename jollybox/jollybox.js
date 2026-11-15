/* JollyBOX welcome: animated round O, then a numbered advent flap. */
let jollyWelcome=location.hash!=='#secret',jollyOpeningController=null;
function renderJollyWelcome(){
 if(jollyOpeningController)jollyOpeningController.destroy();
 document.body.classList.remove('jolly-boot','is-hideout','is-interior');document.body.classList.add('is-jolly-welcome','jolly-ready');
 main.innerHTML='<div id="jolly-production-opening"></div>';
 jollyOpeningController=createJollyOpening(main.querySelector('#jolly-production-opening'),{production:true,autoIntro:true,onOpen(){tone([440,554,659],.12)},onComplete(){jollyWelcome=false;render();main.querySelector('.hideout-shell')?.focus({preventScroll:true})}});
 globalThis.__jollyOpening=jollyOpeningController;
}
const jollyRenderBefore=render;render=function(){if(jollyWelcome)return renderJollyWelcome();if(jollyOpeningController){jollyOpeningController.destroy();jollyOpeningController=null}document.body.classList.remove('jolly-boot','is-jolly-welcome');document.body.classList.add('jolly-ready');jollyRenderBefore()};
addEventListener('hashchange',()=>{if(location.hash==='#secret'){jollyWelcome=false;render()}});
document.title='JollyBOX — Naughty Elf Village | Christmas Advent Calendar';
