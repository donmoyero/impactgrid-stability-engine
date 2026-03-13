function startRenderLoop(){

function loop(){

renderFrame();

requestAnimationFrame(loop);

}

loop();

}

function renderFrame(){

const ctx = Editor.ctx;

ctx.clearRect(0,0,Editor.canvas.width,Editor.canvas.height);

if(Editor.video){

ctx.drawImage(
Editor.video,
0,
0,
Editor.canvas.width,
Editor.canvas.height
);

}

}
