let scene, camera, renderer, model, controls, mixer;
let modelLoaded = false
let subtitleLoaded = false

let clock = new THREE.Clock();

const mixers = [];

const DRACO_PATH = 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/';

const MODEL_PATH =
  [ { fileName: 'cicadaNew4-v1.glb' }]; 

const AUDIO_PATH = 'audio/audio-';

let loadedModels = [];


init();

function init() {
        
  const container = document.getElementById("mainScene");
        
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.001, 500);
  camera.position.set(0, 0, 120);
  camera.lookAt(0,0,0);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
	renderer.shadowMap.bias = -0.002;
  renderer.PCFSoftShadowMap = true;
  container.appendChild(renderer.domElement);
        
  window.addEventListener( 'resize', onWindowResize );

  const pmremGenerator = new THREE.PMREMGenerator( renderer );
  pmremGenerator.compileEquirectangularShader();
        
  const nightTexture = new THREE.RGBELoader()
	.setPath('skyBox/') 
	.load('bedroom-2.hdr', function(texture){
    nightTexture.mapping = THREE.EquirectangularReflectionMapping;
    envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = envMap;
  });

  const directionalLight = new THREE.DirectionalLight( 0xffffff, 2.5 ); 
  scene.add(directionalLight);
	      
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;
  controls.minDistance = 50;
  controls.maxDistance = 250;
  controls.maxPolarAngle = Math.PI / 2;
        
  loadModelFile = (fileName, path) => {
    return new Promise((resolve) => {
      let loader = new THREE.GLTFLoader();
      let dracoLoader = new THREE.DRACOLoader();

      dracoLoader.setDecoderPath(DRACO_PATH);
      dracoLoader.setDecoderConfig({ type: "js" });

      loader.setDRACOLoader(dracoLoader);

      loader.load(`${path}${fileName}`, (gltf) => {
        console.info("GLTF file load complete");
        modelLoaded = true
        
        const colors = [ 0xB87333, 0xC0C0C0, 0xFFD700, 0x43464B, 0x6699CC ]
        const models = [];

        model = gltf.scene;   
        let meshToRay = new THREE.Mesh(new THREE.BoxGeometry(10,18,20),new THREE.MeshBasicMaterial({transparent : true,opacity: 0})) 


        for (let i = 0; i < 5; i++) {

        const cloneMeshToRay = meshToRay.clone()

        const clone = THREE.SkeletonUtils.clone(model);
        const x = Math.random() * (window.innerWidth - 100) - (window.innerWidth / 2 - 50);
        const y = Math.random() * (window.innerHeight - 100) - (window.innerHeight / 2 - 50);
        const z = Math.random() * 125 - 50;

        const max_x = window.innerWidth / 2 - 50;
        const min_x = -max_x;
        const max_y = window.innerHeight / 2 - 50;
        const min_y = -max_y;

        if (x > max_x) {
          x = max_x;
        } else if (x < min_x) {
          x = min_x;
        }
        if (y > max_y) {
          y = max_y;
        } else if (y < min_y) {
          y = min_y;
        }

        const position = new THREE.Vector3(x, y, z);
        
        const cameraZ = camera.position.z;
        const near = camera.near;
        const far = camera.far;

        if (z < cameraZ - far) {
          z = cameraZ - far + 10;
        } else if (z > cameraZ - near) {
          z = cameraZ - near - 10;
        }

        clone.position.set(x, y, z);
        const scale = Math.random() * 0.025 + 0.025;
        clone.scale.set(scale, scale, scale);
        clone.rotation.y = Math.random() * Math.PI * 2;
        const randomRotationX = THREE.MathUtils.degToRad(Math.random() * 30 - 15);
        clone.rotation.x = randomRotationX;
        
      // Check if the clone overlaps with any existing models
        let overlap = true;
        while (overlap) {
        overlap = false;
        const overlapX = Math.random() * 150 - 50;
        const overlapY = Math.random() * 150 - 75;
        const overlapZ = Math.random() * 30 - 10;
        clone.position.set(overlapX, overlapY, overlapZ);
        for (let j = 0; j < models.length; j++) {
          const distance = clone.position.distanceTo(models[j].position);
          if (distance < (clone.scale.x + models[j].scale.x) * 0.25) {
            overlap = true;
            break;
          }
        }
      }
          
        clone.traverse((o) => {
          if (o.isMesh) {
            o.castShadow = true;
            o.receiveShadow = true;
            o.material = new THREE.MeshPhysicalMaterial({
              color: colors[i],
        metalness: 0.8,
        roughness: 0.08,
        transparent: true,
        opacity: 0.7,
        transmission: 0.1,
        thickness: 5,
        side: THREE.DoubleSide,
        envMap: envMap,
        envMapIntensity: 5,
        clearcoat: 1.0,
        clearcoatRoughness: 0.2,
        depthTest: true,
        depthWrite: true,
        shininess: 300,
        emissive: 1,
        reflectivity: 1,
      });
            o.addEventListener('mouseover', function () {
                const audio = new Audio(`${AUDIO_PATH}${i + 1}.wav`);
                audio.play();
              });
          }
        });
        models.push(clone);
        scene.add(clone);


        cloneMeshToRay.position.set( clone.position.x, clone.position.y, clone.position.z)   
        cloneMeshToRay.rotation.set( clone.rotation.x, clone.rotation.y, clone.rotation.z)   
        cloneMeshToRay.scale.set( clone.scale.x * 30, clone.scale.y * 30, clone.scale.z * 30)   
        cloneMeshToRay.translateZ(-200 * scale)
        cloneMeshToRay.translateY(200 * scale)
        cloneMeshToRay.name = i
        scene.add(cloneMeshToRay)   
        objectsToTest.push(cloneMeshToRay)    
        }

        for (let i = 0; i < models.length; i++) {
          const mixer = new THREE.AnimationMixer(models[i]);
          const clip = mixer.clipAction(gltf.animations[0]);
          

          if (i === 0) {
            clip.play();
          } else {
            clip.clampWhenFinished = true;
            clip.time = getClipStartTime(i);
            clip.play();
          }

          mixers.push(mixer);
        }

        function getClipStartTime(index) {
          switch(index) {
            case 1:
              return 0.3;
            case 2:
              return 0.5;
            case 3:
              return 0.15;
            case 4:
              return 0.75;
            default:
              return 0;
          }
        }
        
        resolve({ fileName: fileName, gltf: gltf, models: models, mixers: mixers });
      });
    });
  };

  load3DModels = (list, destination, path = "models/") => { /*  <<<--- Change this file path to your models current path */
    let promises = [];

    for (let j in list) {
      let mt = list[j];

      promises.push(this.loadModelFile(mt.fileName, path));
    }

    return Promise.all(promises).then((result) => {		
      return new Promise((resolve) => {
        resolve(destination);
      });
    });
  };

  load3DModels(MODEL_PATH, loadedModels).then((gltf) => {
    animate();
  });
}

//Resize Event
function onWindowResize() {
	const width = window.innerWidth;
	const height = window.innerHeight;

	camera.aspect = width / height;
	camera.updateProjectionMatrix();

	renderer.setSize( width, height );
}

//SUBTITLES -----------------------------------------------
let subtitleAndAudioActived = false
const buttonsNavBar = document.querySelectorAll('.navbar span')
const subtitleButton = document.querySelector('.subtitleButton')

// Hover Effect
buttonsNavBar.forEach(element=>{
  element.addEventListener('mouseenter',()=>{
    gsap.to(element,{backgroundColor : '#ddd'})
  })
  element.addEventListener('mouseleave',()=>{
    if(element.classList[0] === 'subtitleButton'){
      menuClosed ? gsap.to(element,{backgroundColor : '#ffffff00'}) : 0   
    }
    else{
      gsap.to(element,{backgroundColor : '#ffffff00'})
    }     
  })
})

//Toggle Menu Subtitle
let menuClosed = true
subtitleButton.addEventListener('click',()=>{
  let position, opacity
  if(menuClosed){
    position = '90%'
    opacity = 1
    color = '#ddd'
  }
  else{
    position = '20%'
    opacity = 0
    color = '#00000000'
  }
  menuClosed = !menuClosed
  gsap.to('.subtitleMenu',{ top : position, opacity : opacity, duration : .6 })
})

//Toggle Subtitles
const subtitleContainer = document.querySelector('#subtitles')
let subtitlesActived = true
document.querySelector('#toggleSubtitle').addEventListener('click',()=>{
  subtitlesActived ? subtitleContainer.style.display = 'none' : subtitleContainer.style.display = 'block'
  subtitlesActived ? subtitlesActived = false : subtitlesActived = true
})

// Texts
const FRTexts = [],
      ENTexts = [],
      tlFR = [],
      tlEN = []

fetch('text/texts.json')
  .then(response => response.json())
  .then(data => {
      
      for (let prop in data.fr) FRTexts.push(data.fr[prop])     
      for (let prop in data.en) ENTexts.push(data.en[prop])

      for(let i = 0; i < ENTexts.length; i++) {
        tlFR[i] = new gsap.timeline({paused : true})
        tlEN[i] = new gsap.timeline({paused : true})

        initTimeline(tlFR[i], subtitlesContainer[i], FRTexts[i])
        initTimeline(tlEN[i], subtitlesContainer[i], ENTexts[i])
      }      

      subtitleLoaded = true
    }  
  )
  .catch(error => console.log(error))

  //Selectors
const subtitlesContainer = [
  document.querySelector('.subtitle1'),
  document.querySelector('.subtitle2'),
  document.querySelector('.subtitle3'),
  document.querySelector('.subtitle4'),
  document.querySelector('.subtitle5')
] 

const subtitlesPosition = [
  {taked : false, bottom : '7vh', left : '30vw'},
  {taked : false, bottom : '28vh', left : '58vw'},
  {taked : false, bottom : '50vh', left : '45vw'},
  {taked : false, bottom : '70vh', left : '20vw'},
  {taked : false, bottom : '87vh', left : '2vw'}
]

  //Timelines
const initTimeline = (tl,subtitleContainer,textArray)=>{

  let time = 0

  for(let i = 0; i < textArray.length; i++){
    tl.to(subtitleContainer,{
      opacity : 1,
      duration : .5,
      onStart : ()=>{
        subtitleContainer.textContent = textArray[i]         
      }
    },time)
    tl.to(subtitleContainer,{
      opacity : 0,
      duration : .5
    },time + 3.5)

    time += 4
  } 
}

  //Toggle Subtitles Language
let currentLanguage = 'EN'
const languageButton = document.querySelector('.subLang')

const switchActiveTimeline = (tlArray,currentLanguage)=>{
  for(let i = 0; i < tlArray.length ; i++){
    if(currentLanguage === 'EN' && tlFR[i].isActive()){      
      tlFR[i].pause()
      tlEN[i].play(tlFR[i].time())
    }
    else if(currentLanguage === 'FR' && tlEN[i].isActive()){      
      tlEN[i].pause()
      tlFR[i].play(tlEN[i].time())  
    }   
  }
}

const goToFR = ()=>{
  currentLanguage = 'FR'
  document.querySelector('#en').style.fontWeight = 100
  document.querySelector('#fr').style.fontWeight = 800
  switchActiveTimeline(tlFR,currentLanguage)
} 
const goToEN = ()=>{
  currentLanguage = 'EN'
  document.querySelector('#fr').style.fontWeight = 100
  document.querySelector('#en').style.fontWeight = 800
  switchActiveTimeline(tlEN,currentLanguage)
} 

languageButton.addEventListener('click',()=>{
  currentLanguage === 'EN' ? goToFR() : goToEN()
})
//---------------------------------------------------------

//Mouse
const mouse = new THREE.Vector2(0,0)

window.addEventListener('mousemove',(e)=>{
  mouse.x = e.clientX / window.innerWidth * 2 - 1
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
})

//Raycaster
const raycaster = new THREE.Raycaster()
const objectsToTest = []
let currentIntersect = null

//Play audio
const audio = [
  new Audio('/audio/audio-1.wav'),
  new Audio('/audio/audio-2.wav'),
  new Audio('/audio/audio-3.wav'),
  new Audio('/audio/audio-4.wav'),
  new Audio('/audio/audio-5.wav'),
]
/*
const muteButton = document.querySelector('.mute')

const muteAll = ()=>{
  for(let i =0; i < audio.length; i++){
    !audio[i].paused ? audio[i].pause() : null    
  }
}

muteButton.addEventListener('click',()=> muteAll())
*/

const playAudio = (objectName)=>{

  if(audio[objectName].paused) audio[objectName].play()

  if(!tlEN[objectName].isActive() && !tlFR[objectName].isActive())
    testSubtitlePosition(objectName)   
}

const testSubtitlePosition = (objectName)=>{
  for(let i = 0; i < subtitlesPosition.length; i++){
    if(subtitlesPosition[i].taked === false){
      subtitlesPosition[i].taked = true
      subtitlesContainer[objectName].style.left = subtitlesPosition[i].left
      subtitlesContainer[objectName].style.bottom = subtitlesPosition[i].bottom 
      currentLanguage === 'EN' ? playSubtitle(tlEN[objectName],i) : playSubtitle(tlFR[objectName],i)
      break
    }
  }
}

const playSubtitle = (tl,i)=>{
  tl.eventCallback('onComplete', ()=>{
    subtitlesPosition[i].taked = false
    tl.eventCallback('onComplete', null)
  })
  tl.play(0)
}

//playAudioOnClick
window.addEventListener('click',()=>{
  subtitleAndAudioActived = true
  if(currentIntersect){
    playAudio(currentIntersect.object.name)
  }
})

function animate(){        
  //RayCaster
  if(modelLoaded && subtitleLoaded && subtitleAndAudioActived){
    raycaster.setFromCamera(mouse,camera)    
    const intersects = raycaster.intersectObjects(objectsToTest)
          
    if(intersects.length){
      if(!currentIntersect){
        //Mouse Enter
        playAudio(intersects[0].object.name)
      }
      else if(currentIntersect.object.name !== intersects[0].object.name){
        //Mouse changes object without leaving
        playAudio(intersects[0].object.name)
      }

      currentIntersect = intersects[0]    
    }
    else{
      if(currentIntersect){
        //Mouse Leave
      }     

      currentIntersect = null
    }    
  }
    
  delta = clock.getDelta() * 0.2;

  for ( const mixer of mixers ) mixer.update( delta ); 
  renderer.render(scene, camera);
  controls.update();
        
  requestAnimationFrame(animate);
}

