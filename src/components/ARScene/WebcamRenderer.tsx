import * as THREE from 'three';
import {
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PlaneBufferGeometry,
  Scene,
  VideoTexture,
  WebGLRenderer,
} from 'three';
import { isPlatform } from '@ionic/react';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions'
import debounce from '../../misc/debounce'

export default class WebcamRenderer {
  private readonly sceneWebcam: Scene;

  private readonly geom: PlaneBufferGeometry | undefined;

  private readonly mesh: Mesh;

  private readonly texture: VideoTexture;

  private readonly material: MeshBasicMaterial;

  private readonly cameraWebcam: OrthographicCamera;

  private currentStream: MediaStream | null = null;

  private trackDimensions = {
    width: 0,
    height: 0,
  };

  constructor(private readonly renderer: WebGLRenderer, private readonly videoElement: HTMLVideoElement) {
    this.renderer = renderer;
    this.renderer.autoClear = false;
    this.sceneWebcam = new THREE.Scene();
    this.texture = new THREE.VideoTexture(videoElement);
    this.material = new THREE.MeshBasicMaterial({ map: this.texture, color: 0xaaaaaa });
    // this.material = new THREE.MeshBasicMaterial({ color: '#ff0000' });
    this.geom = new THREE.PlaneBufferGeometry();
    this.mesh = new THREE.Mesh(this.geom, this.material);
    this.sceneWebcam.add(this.mesh);
    this.cameraWebcam = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 10);
  }

  private scaleGeometry(w: number, h: number, streamW: number, streamH: number): void {
    let gX;
    let gY;
    let cX;
    let cY;

    console.log(`scaleGeometry: ${w}; ${h}; ${streamW}; ${streamH}`)

    const ratio = streamW / streamH;
    if (w < h) {
      cX = w / h;
      cY = 1;
      gX = 1;
      gY = ratio;
    } else {
      gY = 1;
      gX = ratio;
      cX = 1;
      cY = h / w;
    }
    this.mesh.scale.set(gX, gY, 1);
    this.cameraWebcam.left = -cX / 2;
    this.cameraWebcam.right = cX / 2;
    this.cameraWebcam.top = cY / 2;
    this.cameraWebcam.bottom = -cY / 2;
    this.cameraWebcam.updateProjectionMatrix();
  }

  private getBoundaries(): DOMRect {
    return this.renderer.domElement.getBoundingClientRect();
  }

  private scale = debounce((): void => {
    const { width, height } = this.getBoundaries();

    this.scaleGeometry(width, height, this.trackDimensions.width, this.trackDimensions.height);
  }, 200);

  public play = async (): Promise<void> => {
    this.currentStream?.getVideoTracks()[0].stop();

    if (isPlatform('android')) {
      const permissionResponse = await AndroidPermissions.requestPermission(AndroidPermissions.PERMISSION.CAMERA)
      if (!permissionResponse.hasPermission) throw new Error(`${AndroidPermissions.PERMISSION.CAMERA} permission hasn't granted`)
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Webcam is not supported');
    }

    try {
      const { width, height } = this.getBoundaries();

      this.currentStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { min: width },
          height: { min: height },
          facingMode: process.env.NODE_ENV === 'production' ? { exact: 'environment' } : 'environment',
        },
      });
      // await attempt(async () => this.currentStream, {
      //   interAttemptsSleepTime: 1000,
      //   isResultSatisfies: (stream) => !!stream?.active,
      // });
    } catch (e: any) {
      if (e.name === 'OverconstrainedError') {
        throw new Error('Device does not support AR');
      }
      if (e.name === 'AbortError') {
        throw new Error('You have aborted AR scene');
      }
      if (e.name === 'NotAllowedError') {
        throw new Error('Access to the camera is required');
      }

      throw new Error(e.message);
    }

    // await sleep(300);
    const track = this.currentStream?.getVideoTracks()[0];
    const { width = 0, height = 0 } = track?.getSettings() ?? {};
    this.trackDimensions = { width, height };

    this.scale();
    window.addEventListener('resize', this.scale);
    window.addEventListener('orientationchange', this.scale);
    // eslint-disable-next-line no-console
    console.log(`using the webcam successfully...`);
    this.videoElement.srcObject = this.currentStream;

    await this.videoElement.play();
  };

  public update(): void {
    this.renderer.clear();
    this.renderer.render(this.sceneWebcam, this.cameraWebcam);
    this.renderer.clearDepth();
  }

  public dispose(): void {
    this.material.dispose();
    this.texture.dispose();
    this.geom?.dispose();
    window.removeEventListener('resize', this.scale);
    window.removeEventListener('orientationchange', this.scale);
  }
}
