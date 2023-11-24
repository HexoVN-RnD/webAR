document.querySelector('#avatarModel').addEventListener('model-loaded', function(evt){
    let model = evt.detail.model;
    let animations = model.animations;
    console.log(animations);
});
