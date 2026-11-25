<?php
declare(strict_types=1);

final class ApiController
{
    private Repositorio $repo;

    public function __construct()
    {
        $this->repo = new Repositorio();
    }

    public function especies(): void
    {
        View::json($this->repo->especies());
    }

    public function recintos(): void
    {
        View::json($this->repo->recintos());
    }

    public function servicios(): void
    {
        View::json($this->repo->servicios());
    }

    public function modelos(): void
    {
        View::json($this->repo->modelos3d());
    }
}
