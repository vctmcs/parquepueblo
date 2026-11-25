/* ==========================================================
   Escena 3D: renderizador, cámara, luces, plataforma y bucle.
   ========================================================== */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { suelo, aTextura } from './texturas.js';

const ILUMINACION = {
    dia: {
        cielo: '#fff4e0', tierra: '#5a4a30', hemi: .55,
        sol: '#fff1d8', solI: 2.4, solPos: [3.5, 6, 2.5],
        contra: '#bcd8ff', contraI: .7, exposicion: .95, entorno: .2
    },
    atardecer: {
        cielo: '#ffc58f', tierra: '#4a3324', hemi: .75,
        sol: '#ffab5c', solI: 3.2, solPos: [-5, 2.2, 3],
        contra: '#7f8cff', contraI: 1.1, exposicion: 1.05, entorno: .25
    },
    estudio: {
        cielo: '#ffffff', tierra: '#888888', hemi: .7,
        sol: '#ffffff', solI: 2.2, solPos: [2, 5, 4],
        contra: '#ffffff', contraI: 1.4, exposicion: 1.0, entorno: .8
    }
};

export class Escena {
    constructor(contenedor) {
        this.contenedor = contenedor;
        this.reloj = new THREE.Timer();
        this.modo = 'reposo';
        this.arcilla = false;
        this.actual = null;

        const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
        r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        r.outputColorSpace = THREE.SRGBColorSpace;
        r.toneMapping = THREE.ACESFilmicToneMapping;
        r.shadowMap.enabled = true;
        r.shadowMap.type = THREE.PCFShadowMap;
        contenedor.appendChild(r.domElement);

        this.escena = new THREE.Scene();
        const pmrem = new THREE.PMREMGenerator(r);
        this.escena.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;

        this.camara = new THREE.PerspectiveCamera(35, 1, .05, 100);
        this.camara.position.set(3.2, 1.6, 3.6);

        const c = this.controles = new OrbitControls(this.camara, r.domElement);
        c.enableDamping = true;
        c.dampingFactor = .07;
        c.maxPolarAngle = Math.PI * .495;
        c.minDistance = 1.2;
        c.maxDistance = 12;
        c.autoRotate = true;
        c.autoRotateSpeed = .8;

        // Luces
        this.hemi = new THREE.HemisphereLight();
        this.sol = new THREE.DirectionalLight();
        this.sol.castShadow = true;
        this.sol.shadow.mapSize.set(2048, 2048);
        this.sol.shadow.bias = -.0004;
        this.sol.shadow.normalBias = .02;
        this.sol.shadow.radius = 4;
        const s = this.sol.shadow.camera;
        s.left = -4; s.right = 4; s.top = 5; s.bottom = -2; s.near = .5; s.far = 25;
        this.contra = new THREE.DirectionalLight();
        this.contra.position.set(-3, 3, -4);
        this.escena.add(this.hemi, this.sol, this.contra);

        // Plataforma circular
        const tSuelo = aTextura(suelo(), { repetir: [1, 1] });
        tSuelo.wrapS = tSuelo.wrapT = THREE.ClampToEdgeWrapping;
        const piso = new THREE.Mesh(
            new THREE.CylinderGeometry(3.2, 3.3, .12, 96),
            [
                new THREE.MeshStandardMaterial({ color: '#7a5c3a', roughness: 1 }),
                new THREE.MeshStandardMaterial({ map: tSuelo, roughness: .95 }),
                new THREE.MeshStandardMaterial({ color: '#5d462c', roughness: 1 })
            ]
        );
        piso.position.y = -.06;
        piso.receiveShadow = true;
        this.piso = piso;
        this.escena.add(piso);

        this.aplicarIluminacion('dia');
        this.redimensionar();
        new ResizeObserver(() => this.redimensionar()).observe(contenedor);

        r.setAnimationLoop(() => this.cuadro());

        this.arcillaMat = new THREE.MeshStandardMaterial({ color: '#b9b4ab', roughness: .75, metalness: 0 });
    }

    redimensionar() {
        const { clientWidth: w, clientHeight: h } = this.contenedor;
        if (!w || !h) return;
        this.renderer.setSize(w, h, false);
        this.camara.aspect = w / h;
        this.camara.updateProjectionMatrix();
    }

    aplicarIluminacion(nombre) {
        const p = ILUMINACION[nombre] || ILUMINACION.dia;
        this.hemi.color.set(p.cielo);
        this.hemi.groundColor.set(p.tierra);
        this.hemi.intensity = p.hemi;
        this.sol.color.set(p.sol);
        this.sol.intensity = p.solI;
        this.sol.position.set(...p.solPos);
        this.contra.color.set(p.contra);
        this.contra.intensity = p.contraI;
        this.renderer.toneMappingExposure = p.exposicion;
        this.escena.environmentIntensity = p.entorno;
        this.iluminacion = nombre;
    }

    /** Coloca un animal (procedural o GLB) y encuadra la cámara. */
    mostrar(modelo) {
        if (this.actual) {
            this.escena.remove(this.actual.objeto);
            liberar(this.actual.objeto);
        }
        this.actual = modelo;
        this.escena.add(modelo.objeto);
        this.guardarMateriales(modelo.objeto);
        if (this.arcilla) this.ponerArcilla(true);
        this.encuadrar();
    }

    encuadrar() {
        if (!this.actual) return;
        const caja = new THREE.Box3().setFromObject(this.actual.objeto);
        const tam = caja.getSize(new THREE.Vector3());
        const centro = caja.getCenter(new THREE.Vector3());
        const radio = Math.max(tam.x, tam.y, tam.z) * .5;
        const medioFov = THREE.MathUtils.degToRad(this.camara.fov / 2);
        // que quepa a lo ancho y a lo alto (la jirafa es más alta que larga)
        const porAncho = (tam.length() * .55) / Math.sin(medioFov) / Math.min(this.camara.aspect, 1.15);
        const porAlto = (tam.y / 2) / Math.tan(medioFov) * 1.25;
        const dist = Math.max(porAncho, porAlto);
        this.controles.target.copy(centro);
        const dir = new THREE.Vector3(.75, .32, .95).normalize();
        this.camara.position.copy(centro).addScaledVector(dir, dist);
        this.controles.maxDistance = dist * 2.5;
        this.controles.minDistance = radio * .9;
        this.controles.update();

        // Ajusta la sombra al tamaño del animal
        const s = this.sol.shadow.camera;
        const m = Math.max(tam.x, tam.z, tam.y) * .9;
        s.left = -m; s.right = m; s.top = m * 1.3; s.bottom = -m * .6;
        s.updateProjectionMatrix();
        this.sol.target.position.copy(centro);
        this.sol.target.updateMatrixWorld();
    }

    guardarMateriales(obj) {
        obj.traverse(m => { if (m.isMesh && !m.userData.original) m.userData.original = m.material; });
    }

    ponerArcilla(activo) {
        this.arcilla = activo;
        if (!this.actual) return;
        this.actual.objeto.traverse(m => {
            if (!m.isMesh) return;
            m.material = activo ? this.arcillaMat : m.userData.original;
        });
    }

    capturar() {
        this.renderer.render(this.escena, this.camara);
        return this.renderer.domElement.toDataURL('image/png');
    }

    cuadro() {
        this.reloj.update();
        const dt = this.reloj.getDelta();
        const t = this.reloj.getElapsed();
        if (this.actual?.actualizar) this.actual.actualizar(t, this.modo, dt);
        this.controles.update();
        this.renderer.render(this.escena, this.camara);
    }
}

/* ---------- Modelos GLB descargados ---------- */

export function cargarGLB(url, alturaDeseada = 1.4) {
    return new Promise((resolver, rechazar) => {
        new GLTFLoader().load(url, gltf => {
            const objeto = new THREE.Group();
            const escena = gltf.scene;
            objeto.add(escena);

            // Algunos modelos traen su propia base o piso: se quita para usar la plataforma del visor
            const sobrantes = [];
            escena.traverse(m => { if (m.isMesh && /circle|plane|ground|floor|base|pedestal|suelo|piso/i.test(m.name)) sobrantes.push(m); });
            sobrantes.forEach(m => m.parent.remove(m));

            // Normaliza tamaño y lo apoya en el piso
            const caja = new THREE.Box3().setFromObject(escena);
            const tam = caja.getSize(new THREE.Vector3());
            const escala = alturaDeseada / Math.max(tam.y, tam.x * .55, .001);
            escena.scale.setScalar(escala);
            const caja2 = new THREE.Box3().setFromObject(escena);
            escena.position.y -= caja2.min.y;
            escena.position.x -= (caja2.min.x + caja2.max.x) / 2;
            escena.position.z -= (caja2.min.z + caja2.max.z) / 2;

            escena.traverse(m => {
                if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; }
            });

            const mezclador = gltf.animations.length ? new THREE.AnimationMixer(escena) : null;
            const clips = gltf.animations;
            // intenta usar "walk"/"idle" si el archivo los trae
            const buscar = re => clips.find(c => re.test(c.name)) || null;
            // Si el archivo no trae animación de reposo, en "Reposo" se queda quieto
            const acciones = mezclador ? {
                caminar: buscar(/walk|camin/i) || buscar(/run|corr/i) || clips[0],
                reposo: buscar(/idle|repos|breath|stand/i)
            } : null;
            let activa = null, modoPrevio = null;

            resolver({
                objeto,
                glb: true,
                animaciones: clips.map(c => c.name),
                actualizar(t, modo, dt) {
                    if (!mezclador) return;
                    if (modo !== modoPrevio) {
                        // sin clip de reposo: se usa el primer cuadro del de caminar, en pausa
                        const clip = acciones[modo] || acciones.caminar;
                        const nueva = mezclador.clipAction(clip);
                        if (activa && activa !== nueva) activa.stop();
                        nueva.reset().play();
                        nueva.paused = !acciones[modo];
                        activa = nueva;
                        modoPrevio = modo;
                    }
                    mezclador.update(dt);
                }
            });
        }, undefined, rechazar);
    });
}

function liberar(obj) {
    obj.traverse(m => {
        if (!m.isMesh) return;
        m.geometry?.dispose();
        const mats = [].concat(m.userData.original || m.material);
        for (const mat of mats) {
            for (const k of ['map', 'bumpMap', 'normalMap', 'roughnessMap']) mat[k]?.dispose?.();
            mat.dispose?.();
        }
    });
}
