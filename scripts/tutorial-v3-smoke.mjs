import assert from 'node:assert/strict';

// m-tutorial-v3 (owner point 74) in its own page, at 1920×1080 and 1366×768: in step 2 (Builder) the arrow stands beside
// the Population tab and points at it – it never lies over the tab – and the tab stays clickable. A screenshot of step 2
// goes to /tmp/shots/tutorial-v3-<w>x<h>.png (or SMOKE_SHOTS).
export async function tutorialV3Smoke(context,url,instrument){
  for(const [width,height] of [[1920,1080],[1366,768]]){
    const page=await context.newPage();await instrument?.(page);
    try{
      await page.setViewportSize({width,height});
      await page.goto(url);await page.evaluate(()=>localStorage.setItem('newgame.tutorial','on'));await page.reload();
      await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.tutorial?.active);
      await page.locator('#tutorial-bubble .tutorial-next').click();
      await page.waitForFunction(()=>window.__game.registry.get('application').scene.tutorial.progress().current?.id==='builder');
      const clear=()=>page.waitForFunction(()=>{const a=document.querySelector('#tutorial-arrow'),t=document.querySelector('#population-tab'),b=document.querySelector('#tutorial-bubble');if(!a||a.hidden)return false;
        const r=a.getBoundingClientRect(),q=t.getBoundingClientRect(),w=b.getBoundingClientRect(),ov=(x,y)=>x.left<y.right-1&&x.right>y.left+1&&x.top<y.bottom-1&&x.bottom>y.top+1;
        const tip=r.right,near=Math.abs(tip-q.left)<=24&&r.top<q.bottom&&r.bottom>q.top;return !ov(r,q)&&!ov(w,q)&&near&&getComputedStyle(a).pointerEvents==='none';},null,{timeout:8000});
      await clear();
      const dir=process.env.SMOKE_SHOTS??'/tmp/shots';await page.screenshot({path:`${dir}/tutorial-v3-${width}x${height}.png`});
      // Resizing re-places the arrow at once; it is still beside the tab.
      await page.setViewportSize({width:width-200,height:height-100});await clear();await page.setViewportSize({width,height});await clear();
      // The tab is clickable with the arrow beside it (the click reaches the tab itself).
      const hit=await page.evaluate(()=>{const q=document.querySelector('#population-tab').getBoundingClientRect();return document.elementFromPoint(q.left+q.width/2,q.top+q.height/2)?.closest('#population-tab')!=null;});assert.equal(hit,true);
      await page.locator('#population-tab').click();await page.locator('#population-panel.open').waitFor();
      console.log(`PASS m-tutorial-v3 ${width}×${height}: step 2 arrow beside the Population tab (not over it), bubble clear, re-placed on resize, tab clickable`);
    }finally{await page.close();}
  }
}
