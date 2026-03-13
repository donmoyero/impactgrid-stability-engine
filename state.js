// GLOBAL EDITOR STATE

const Editor = {

video: null,

canvas: null,
ctx: null,

duration: 0,
currentTime: 0,

playing: false,

width: 1080,
height: 1920,

captions: [],
overlays: [],
music: null,

effects: {
brightness: 100,
contrast: 100,
saturation: 100
},

crop: {
scale: 1,
x: 0,
y: 0
}

};
