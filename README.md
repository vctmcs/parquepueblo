# Parque del Pueblo - Guía no oficial

Sitio web informativo e independiente del Parque del Pueblo. Incluye un mapa interactivo de recintos y servicios, un catálogo de especies y un visor 3D de los animales más representativos con su pelaje y colores.

Proyecto de portafolio. No está afiliado al parque ni a su administración.

## Funciones

- **Mapa interactivo** en SVG basado en el plano del parque: 30 recintos y 15 servicios seleccionables, zoom con rueda o pellizco, arrastre, filtros por grupo de animales, buscador y ficha de cada recinto. Se puede compartir un recinto con la URL (`/mapa?recinto=18`).
- **Catálogo de animales** con nombre científico, dieta, origen, tamaño, longevidad, estado de conservación (UICN) y un dato curioso.
- **Animales en 3D** con Three.js: león, tigre, jaguar, leopardo, puma y jirafa. Los modelos y sus texturas (rayas, rosetas, manchas y melena) se generan por código. Incluye animación de reposo y de caminar, tres tipos de iluminación, modo sin color, giro automático, captura en PNG y pantalla completa.
- Soporte para reemplazar cualquier modelo por un archivo `.glb` (ver `public/modelos/LEEME.md`).
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

## Autor

Víctor Hugo Estrada Macías
