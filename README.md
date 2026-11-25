# Parque del Pueblo - Guía no oficial

Sitio web informativo e independiente del Parque del Pueblo. Incluye un mapa interactivo de recintos y servicios, un catálogo de especies y un visor 3D de los animales más representativos con su pelaje y colores.

Proyecto de portafolio. No está afiliado al parque ni a su administración.

## Funciones

- **Mapa interactivo** en SVG trazado a partir del plano "Mapa de Áreas" del parque (río, lago, jardines y recintos en la misma posición y con los mismos números), con servicios seleccionables, zoom con rueda o pellizco, arrastre, filtros por grupo de animales, buscador y ficha de cada recinto. Se puede compartir un recinto con la URL (`/mapa?recinto=18`).
- **Catálogo de animales** con nombre científico, dieta, origen, tamaño, longevidad, estado de conservación (UICN) y un dato curioso.
- **Animales en 3D** con Three.js: león, tigre, jaguar, leopardo, puma y jirafa, con modelos texturizados de Sketchfab (licencia CC BY 4.0). Incluye animaciones de reposo y de caminar cuando el modelo las trae, tres tipos de iluminación, modo sin color, giro automático, captura en PNG y pantalla completa.
- Si falta algún archivo `.glb`, el visor genera un modelo de respaldo por código con su pelaje (rayas, rosetas, manchas y melena).
- Diseño adaptable a móvil, tablet y escritorio.

## Tecnologías

- PHP 8 sin framework (router y plantillas propios, sin mezclar PHP con HTML)
- HTML, CSS y JavaScript sin dependencias de compilación
- Three.js 0.187 incluido en `public/vendor/three` (licencia MIT)

## Estructura

```
index.php                 Punto de entrada y rutas
.htaccess                 URLs limpias en Apache
app/
  config.php              Constantes y URL base
  core/                   Router, View (plantillas) y Repositorio (datos)
  controllers/            Páginas y API JSON
  data/                   Especies, recintos y servicios
views/                    Plantillas HTML
public/
  css/                    Estilos por página
  js/                     Menú, mapa, catálogo y fichas
  js/visor3d/             Escena, constructor de animales, texturas y especies 3D
  modelos/                Modelos .glb opcionales
  vendor/three/           Three.js y complementos
```

## Rutas

| Ruta | Descripción |
| --- | --- |
| `/` | Inicio |
| `/mapa` | Mapa interactivo |
| `/animales` | Catálogo |
| `/animales-3d` | Visor 3D |
| `/api/especies` | Especies en JSON |
| `/api/recintos` | Recintos del mapa |
| `/api/servicios` | Servicios del mapa |
| `/api/modelos` | Animales con vista 3D |

## Ejecutar en local

Requiere PHP 8.0 o superior.

```
php -S localhost:8000 index.php
```

Abrir `http://localhost:8000`.

## Publicar en InfinityFree u otro hosting con Apache

Subir todo el contenido de la carpeta a `htdocs`. El archivo `.htaccess` se encarga de las URLs limpias y bloquea el acceso directo a `app/` y `views/`. Si el hosting no permite `mod_rewrite`, las páginas también funcionan con `index.php?ruta=mapa`.

## Editar datos

- Animales: `app/data/especies.php`
- Posición y número de recintos en el mapa: `app/data/recintos.php`
- Servicios del mapa: `app/data/servicios.php`
- Proporciones y pelaje de los modelos 3D: `public/js/visor3d/especies3d.js`

Los datos de cada especie son de divulgación general; la ubicación de los recintos sigue la distribución del plano del parque y puede ajustarse en `recintos.php`.

## Créditos de los modelos 3D

Todos con licencia [Creative Commons Atribución 4.0](https://creativecommons.org/licenses/by/4.0/), descargados de Sketchfab:

- León: [Low Poly Golden Lion 3d model free](https://sketchfab.com/3d-models/87b571159ce441458644ecfb67705073) de rt699448
- Tigre: [Tiger](https://sketchfab.com/3d-models/67bbedd727a047869ef7c7b608445484) de moizmuhammad373
- Jaguar: [Jaguarsf](https://sketchfab.com/3d-models/194775ef066e41cf8f4e6f69608f3310) de kenchoo
- Leopardo: [Leopard Animation Run](https://sketchfab.com/3d-models/5a36868106f843d4a24d87334f1550fe) de GremorySaiyan
- Puma: [Puma Gray](https://sketchfab.com/3d-models/90f0fd2c4ce24d05acce011256953ca5) de Novaky
- Jirafa: [Giraffe](https://sketchfab.com/3d-models/522c042aad9f4348a74c2985ec3f99f9) de BlueMesh

Al visor solo se le quitó la base que traía el modelo de la jirafa; los modelos no se modificaron.

## Autor

Víctor Hugo Estrada Macías
