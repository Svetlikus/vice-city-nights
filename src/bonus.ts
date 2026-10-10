/** VIP is an instant-prize presentation, never a separate game-math round. */
export class BonusFeatureController {
  private animations:Animation[]=[];
  private doors:HTMLElement|null=null;
  constructor(private overlay:HTMLElement){}
  async enter(reducedMotion:boolean):Promise<void>{
    if(reducedMotion)return;
    this.exit();
    const doors=document.createElement('div');doors.className='vip-doors';
    doors.innerHTML='<div class="vip-door left-door"><span>V</span></div><div class="vip-door right-door"><span>IP</span></div><div class="vip-door-light"></div>';
    this.overlay.append(doors);this.doors=doors;
    const content=this.overlay.querySelector<HTMLElement>('.celebration-content')!;
    const reveal=content.animate([{opacity:0,transform:'scale(.94)'},{opacity:1,transform:'scale(1)'}],{delay:650,duration:750,fill:'both',easing:'ease-out'});
    const left=doors.querySelector<HTMLElement>('.left-door')!.animate([{transform:'translateX(0)'},{transform:'translateX(-102%)'}],{delay:150,duration:950,easing:'cubic-bezier(.5,0,.15,1)',fill:'forwards'});
    const right=doors.querySelector<HTMLElement>('.right-door')!.animate([{transform:'translateX(0)'},{transform:'translateX(102%)'}],{delay:150,duration:950,easing:'cubic-bezier(.5,0,.15,1)',fill:'forwards'});
    const light=doors.querySelector<HTMLElement>('.vip-door-light')!.animate([{opacity:0,transform:'scaleX(.05)'},{opacity:.75,transform:'scaleX(1)',offset:.45},{opacity:0,transform:'scaleX(2)'}],{duration:1200,fill:'forwards'});
    this.animations=[reveal,left,right,light];
    await Promise.all(this.animations.map(a=>a.finished.catch(()=>{})));
    this.exit();
  }
  exit():void{this.animations.forEach(a=>a.cancel());this.animations=[];this.doors?.remove();this.doors=null;}
  destroy():void{this.exit();}
}
