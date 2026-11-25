<?php
declare(strict_types=1);

/**
 * Conexión SQLite. El archivo se crea solo en storage/parque.sqlite
 * la primera vez, junto con las tablas y las campañas iniciales.
 */
final class BaseDatos
{
    private static ?PDO $pdo = null;

    public static function conexion(): PDO
    {
        if (self::$pdo !== null) {
            return self::$pdo;
        }
        if (!is_dir(RUTA_STORAGE)) {
            mkdir(RUTA_STORAGE, 0775, true);
        }
        $pdo = new PDO('sqlite:' . RUTA_STORAGE . '/parque.sqlite', null, null, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $pdo->exec('PRAGMA foreign_keys = ON');
        self::migrar($pdo);
        return self::$pdo = $pdo;
    }

    private static function migrar(PDO $pdo): void
    {
        $pdo->exec(<<<SQL
            CREATE TABLE IF NOT EXISTS campanas (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                clave       TEXT NOT NULL UNIQUE,
                titulo      TEXT NOT NULL,
                descripcion TEXT NOT NULL,
                meta        INTEGER NOT NULL,
                icono       TEXT NOT NULL,
                orden       INTEGER NOT NULL DEFAULT 0,
                activa      INTEGER NOT NULL DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS donaciones (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                folio       TEXT NOT NULL UNIQUE,
                campana_id  INTEGER NOT NULL REFERENCES campanas(id),
                especie     TEXT,
                nombre      TEXT NOT NULL,
                correo      TEXT NOT NULL,
                monto       INTEGER NOT NULL CHECK (monto > 0),
                mensaje     TEXT,
                anonimo     INTEGER NOT NULL DEFAULT 0,
                creado_en   TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
            );

            CREATE INDEX IF NOT EXISTS idx_donaciones_campana ON donaciones(campana_id);
        SQL);

        $hay = (int) $pdo->query('SELECT COUNT(*) FROM campanas')->fetchColumn();
        if ($hay > 0) {
            return;
        }

        $campanas = [
            ['alimento',      'Alimentación',           'Carne, frutas, verduras y suplementos para la dieta diaria de los animales.', 30000, 'alimento',     1],
            ['enriquecimiento', 'Enriquecimiento ambiental', 'Juguetes, estructuras para trepar y actividades que estimulan su comportamiento natural.', 15000, 'enriquecimiento', 2],
            ['veterinaria',   'Atención veterinaria',   'Medicamentos, vacunas y material para revisiones y curaciones.', 25000, 'veterinaria',  3],
            ['apadrina',      'Apadrina un animal',     'Tu donativo se asigna al cuidado de la especie que elijas.', 20000, 'apadrina',     4],
        ];
        $st = $pdo->prepare('INSERT INTO campanas (clave, titulo, descripcion, meta, icono, orden) VALUES (?, ?, ?, ?, ?, ?)');
        foreach ($campanas as $c) {
            $st->execute($c);
        }
    }
}
