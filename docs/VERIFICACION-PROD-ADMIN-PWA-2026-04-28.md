# Verificación producción Admin/PWA - 2026-04-28

## Alcance

Verificación final sobre `https://tesis-spel-plaut.vercel.app` después de corregir estabilidad de reservas, gestión de usuarios, bloqueo/eliminación y PWA.

## Deploy

- Deploy Vercel producción: `dpl_CGovCtH8R65xzzpFivjZC4j6PTWb`
- Alias verificado: `https://tesis-spel-plaut.vercel.app`
- Estado: `READY`

## Gates locales

- `bun run lint`: OK
- `bun run type-check`: OK
- `bun run pwa:check`: OK
- `bun run build`: OK

## Pruebas producción

Smoke autenticado con usuario admin real, sin exponer credenciales:

| Área                          | Resultado                                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------------ |
| `/api/auth/me`                | `200`, rol `admin`, sin fuga de `contrasena_hash`, reset tokens, 2FA codes ni push subscriptions |
| `/api/admin/reservas`         | `200`, `success=true`, 19 reservas                                                               |
| `/admin/reservas`             | `200`, muestra `Gestión de Reservas`, sin crash `Invalid time value`                             |
| `/admin/usuarios`             | `200`, muestra `Gestión de Usuarios`, botones `Bloquear` y `Eliminar` visibles                   |
| Crear usuario admin API       | `201`, `success=true` con usuario temporal                                                       |
| Bloquear usuario temporal     | `200`, `bloqueado=true`                                                                          |
| Login de usuario bloqueado    | `403`, `success=false`                                                                           |
| Desbloquear usuario temporal  | `200`, `bloqueado=false`                                                                         |
| Login de usuario desbloqueado | `200`, `success=true`                                                                            |
| Eliminar usuario temporal     | `200`, `success=true`, documento limpiado de MongoDB                                             |
| Autoprotección admin          | bloquear/eliminar el admin actual devuelve `400`                                                 |
| Browser smoke                 | sin `pageerror`, sin request failed, sin respuestas 4xx/5xx relevantes                           |

## PWA

- Service Worker actualizado a `spelplaut-pwa-2026-04-28-1`.
- `/_next/static/*` ya no usa fallback de imagen/offline, evitando errores MIME con chunks.
- `pwa:check`: OK.

## Reglas funcionales agregadas

- Un usuario bloqueado no puede iniciar sesión.
- Un admin activo no puede bloquearse ni eliminarse a sí mismo.
- No se permite demover, bloquear o eliminar administradores si eso deja el sistema sin al menos un administrador activo.
- La lista de reservas tolera datos legacy incompletos: fecha/precio/usuario/cancha faltante no crashea la página.
