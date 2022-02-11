import {BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, WebGLRenderer} from "three";
import {useEffect, useRef} from "react";
import Measure from "react-measure";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";

export function start(renderer, scene, camera) {

    const frameId = {frameId: null};

    frameId.frameId = requestAnimationFrame(() => animate(renderer, scene, camera, frameId));

    return frameId;
}

export function stop({frameId}) {
    return cancelAnimationFrame(frameId);
}

function animate(renderer, scene, camera, frameId) {
    // console.log(renderer);
    renderer.render(scene, camera);

    frameId.frameId = requestAnimationFrame(() => animate(renderer, scene, camera, frameId));
}

export function cleanUp(mount, renderer, frameId) {
    stop(frameId.frameId);

    if (mount.current) {
        mount.current.removeChild(renderer.domElement);
    }
}

export function resize(mount, renderer, camera, scene) {
    if (!mount || !renderer || !camera || !scene)
        return

    const {clientWidth, clientHeight} = mount.current

    matchSceneBackgroundAspectRatio(scene.background, mount);

    if (camera) {
        camera.aspect = clientWidth / clientHeight;
        camera.updateProjectionMatrix();
    }

    renderer.setSize(clientWidth, clientHeight)
}

export function matchSceneBackgroundAspectRatio(backgroundTexture, renderer) {
    let canvasHeight;
    let canvasWidth;

    // for some reason on update, the states name are changed ...
    if (renderer.current) {
        canvasHeight = renderer.current.offsetHeight;
        canvasWidth = renderer.current.offsetWidth;
    } else if (renderer.domElement){
        canvasHeight = renderer.domElement.height;
        canvasWidth = renderer.domElement.width;
    } else {
        console.warn("don't know how to deal with this renderer ...");
    }

    if (canvasHeight && canvasWidth) {
        if (backgroundTexture) {
            if (backgroundTexture.image) {
                const {width, height} = backgroundTexture.image;
                setOffsets(backgroundTexture, canvasWidth, canvasHeight, width, height);
            } else {
                console.warn("background texture has no image");
            }
        } else {
            console.warn("no background texture");
        }
    } else {
        console.warn("no renderer was found, can't rescale background");
    }
}

function setOffsets(background, targetWidth, targetHeight, imageWidth, imageHeight) {
    const targetAspect = targetWidth / targetHeight;
    const imageAspect = imageWidth / imageHeight;
    const factor = imageAspect / targetAspect;
    // factor > 1, that means texture 'wider' than target。
    // we should scale texture height to target height and then 'map' the center  of texture to target， and vice versa.
    background.offset.x = factor > 1 ? (1 - 1 / factor) / 2 : 0;
    background.repeat.x = factor > 1 ? 1 / factor : 1;
    background.offset.y = factor > 1 ? 0 : (1 - factor) / 2;
    background.repeat.y = factor > 1 ? 1 : factor;
}

export const Scene3D = () => {
    const mount = useRef(null);
    const rendererRef = useRef(null);
    const cameraRef = useRef(null);
    const sceneRef = useRef(null);

    useEffect(() => {

        // const renderer = new WebGLRenderer({antialias: true, alpha: true})
        const renderer = new WebGLRenderer(); //{background: "0x00ff00"});
        renderer.setPixelRatio(window.devicePixelRatio);
        mount.current.appendChild(renderer.domElement);

        console.log(mount);
        console.log(mount.current.clientWidth, mount.current.clientHeight);

        const aspectRatio = (mount.current && mount.current.clientWidth && mount.current.clientHeight) ? (mount.current.clientWidth / mount.current.clientHeight): 1.0;

        console.log(aspectRatio);

        const camera = new PerspectiveCamera(
            45.,
            aspectRatio,

        );

        const orbitControls = new OrbitControls(camera, renderer.domElement);
        console.log(orbitControls);

        const scene = new Scene();
        scene.background = "yellow";

        scene.add(camera);

        camera.position.z = 20;

        const cubeMesh = new Mesh(
            new BoxGeometry(1, 1, 1),
            new MeshBasicMaterial({color: "#00ff00"})
        );

        scene.add(cubeMesh);

        rendererRef.current = renderer;
        cameraRef.current = camera;
        sceneRef.current = scene;

        const frameId = start(
            renderer,
            scene,
            camera
        );

        return () => {
            cleanUp(mount, renderer, frameId);
        }
        // eslint-disable-next-line
    }, [rendererRef, cameraRef]);

    return (
        <Measure
            bounds
            onResize={() => {
                resize(mount, rendererRef.current, cameraRef.current, sceneRef.current)
            }}>
            {({measureRef}) => (
                <div className={'simple-3d'} ref={measureRef} style={{height: '100vh'}}>
                    <div className={'canvas-container'} ref={mount} style={{height: '100vh'}}/>
                </div>
            )}
        </Measure>
    )
}
