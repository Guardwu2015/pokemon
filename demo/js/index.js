var mainContainerElem = document.querySelector('.mainContainer');
var listContainerElem = document.querySelector('#listContainer');
var stageContainerElem = document.querySelector('#stageContainer');
var modelViewerContainerElem = document.querySelector('#modelViewerContainer');
var closeBtnElem = document.querySelector('#closeBtn');

var camera, stage, ticker, orbitControls, glTFLoader;

function initList(){
    models.forEach(function(modelInfo){
        var name = modelInfo.name;
        var id = modelInfo.id;
        var elem = document.createElement('div');
        var modelPath = `../models/${id}/`;
        elem.className = 'modelContainer';
        elem.setAttribute('data-id', id);
        elem.innerHTML = `
            <div data-id='${id}' class='modelIcon' style='background-size:74px 63px;background-image:url(./${modelPath}icon.png);width:74px;height:63px;'></div>
            <div data-id='${id}' class='modelInfo'>${id} ${name}</div>
        `;
        listContainerElem.appendChild(elem);
    });

    listContainerElem.onclick = function(e){
        var id = e.target.getAttribute('data-id');
        if (id) {
            showModel(id);
        }
    };
}

function initStage(){
    camera = new Hilo3d.PerspectiveCamera({
        aspect: innerWidth / innerHeight,
        far: 100,
        near: 0.1,
        z: 3
    });

    stage = new Hilo3d.Stage({
        container: stageContainer,
        camera: camera,
        clearColor: new Hilo3d.Color(0.4, 0.4, 0.4),
        width: innerWidth,
        height: innerHeight
    });

    ticker = new Hilo3d.Ticker(60);
    ticker.addTick(stage);
    ticker.addTick(Hilo3d.Tween);
    ticker.addTick(Hilo3d.Animation);
    ticker.start();

    orbitControls = new OrbitControls(stage, {
        isLockMove:true,
        isLockZ:true
    });

    glTFLoader = new Hilo3d.GLTFLoader();

    closeBtnElem.onclick = function(){
        hideStage();
    }
}

function hideStage(){
    modelViewerContainerElem.style.display = 'none';
    mainContainerElem.appendChild(listContainerElem);

    // reset resource
    Hilo3d.BasicLoader.cache.clear();
    stage.destroy();
    stage.matrix.identity();
}

function showStage(){
    modelViewerContainerElem.style.display = 'block';
    mainContainerElem.removeChild(listContainer);
}

function showModel(id){
    showStage();
    var glTFUrl = `../models/${id}/glTF/model.gltf`;
    glTFLoader.load({
        src: glTFUrl,
        isUnQuantizeInShader:false
    }).then(function(model) {
        try{
            initModel(model);
        } catch(e){

        }
    });
    location.hash = id;
}

function initModel(model){
    window.model = model;
    stage.addChild(model.node);

    model.materials.forEach(function(material){
        material.depthMask = true;
        material.transparent = false;
        material.isDirty = true;
    });

    var bounds = model.node.getBounds();

    var modelHasLight = !!(model.lights && model.lights.length);
    var modelHasCamera = !!(model.cameras && model.cameras.length);

    const scale = 1.5/Math.max(bounds.width, bounds.height, bounds.depth);
    model.node.setPosition(-bounds.x * scale, -bounds.y * scale, -bounds.z * scale);
    model.node.setScale(scale);

    utils.loadEnvMap(function(data) {
        model.materials.forEach(function(material) {
            material.brdfLUT = data.brdfLUT;
            material.diffuseEnvMap = data.diffuseEnvMap;
            material.specularEnvMap = data.specularEnvMap;
            material.isDirty = true;
        });

        var skyBox = new Hilo3d.Mesh({
            geometry: new Hilo3d.BoxGeometry(),
            material: new Hilo3d.BasicMaterial({
                lightType: 'NONE',
                side: Hilo3d.constants.BACK,
                diffuse: data.specularEnvMap
            })
        }).addTo(stage);
        skyBox.setScale(20);

        var directionLight = new Hilo3d.DirectionalLight({
            color:new Hilo3d.Color(1, 1, 1),
            direction:new Hilo3d.Vector3(0, -1, 0)
        }).addTo(stage);
    });
}


if (location.hash.split('#')[1]){
    initStage();
    showModel(location.hash.split('#')[1]);
    initList();
} else {
    initList();
    initStage();
}