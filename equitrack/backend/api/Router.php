<?php
/**
 * api/Router.php
 * A tiny router: matches "METHOD + path" to a controller method and runs the
 * middleware list for that route first.
 *
 *   $router->add('GET', '/reports/{id}', [ReportController::class, 'show'], ['auth']);
 *
 * {id} matches digits; {resource} matches a lowercase name like "campuses".
 * Middleware names:  'auth'  |  'role:admin'  |  'role:super_admin'
 */
class Router
{
    private array $routes = [];

    public function add(string $method, string $pattern, array $handler, array $middleware = []): void
    {
        // turn "/reports/{id}/status" into a regular expression with named groups
        $regex = preg_replace(
            ['#\{id\}#', '#\{resource\}#'],
            ['(?P<id>\d+)', '(?P<resource>[a-z_]+)'],
            $pattern
        );
        $this->routes[] = [strtoupper($method), '#^' . $regex . '$#', $handler, $middleware];
    }

    public function dispatch(string $method, string $path): never
    {
        $pathMatched = false;
        foreach ($this->routes as [$m, $regex, $handler, $middleware]) {
            if (!preg_match($regex, $path, $matches)) {
                continue;
            }
            $pathMatched = true;
            if ($m !== $method) {
                continue;
            }
            // keep only the named captures (id, resource)
            $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);

            foreach ($middleware as $name) {
                if ($name === 'auth') {
                    AuthMiddleware::handle();
                } elseif (str_starts_with($name, 'role:')) {
                    RoleMiddleware::handle(substr($name, 5));
                }
            }
            [$class, $action] = $handler;
            $class::$action($params);
            Response::error('Handler did not send a response.', 500);
        }
        if ($pathMatched) {
            Response::error('Method not allowed.', 405);
        }
        Response::error('Endpoint not found.', 404);
    }
}
