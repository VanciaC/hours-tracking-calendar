<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\DataTransferObjects\Session;
use App\Exceptions\InvalidRefreshTokenException;
use App\Services\AuthService;
use App\Services\RegistrationService;
use App\Services\SessionService;
use Carbon\CarbonImmutable;
use Illuminate\Container\Attributes\Config;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\Cookie;

/**
 * Session endpoints under /auth. Outside GraphQL because they set the refresh cookie,
 * which the router would not pass on to the browser.
 */
final class SessionController
{
    /** The cookie is only sent to these endpoints, never with GraphQL requests. */
    private const COOKIE_PATH = '/auth';

    public function __construct(
        private readonly AuthService $authService,
        private readonly RegistrationService $registrationService,
        private readonly SessionService $sessionService,
        #[Config('jwt.refresh_cookie_name')]
        private readonly string $cookieName,
        #[Config('jwt.refresh_cookie_secure')]
        private readonly bool $secureCookie,
    ) {}

    /**
     * POST /auth/login (US-01)
     */
    public function login(Request $request): JsonResponse
    {
        /** @var array{email: string, password: string} $credentials */
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = $this->authService->authenticate($credentials['email'], $credentials['password'], (string) $request->ip());

        return $this->sessionResponse($this->sessionService->start($user));
    }

    /**
     * POST /auth/verify-email (US-22): verifies the address, then signs the user in.
     */
    public function verifyEmail(Request $request): JsonResponse
    {
        /** @var array{token: string} $data */
        $data = $request->validate([
            'token' => ['required', 'string', 'size:64'],
        ]);

        $user = $this->registrationService->verifyEmail($data['token']);

        return $this->sessionResponse($this->sessionService->start($user));
    }

    /**
     * POST /auth/refresh (US-25): exchanges the cookie for a new access token and a new cookie.
     */
    public function refresh(Request $request): JsonResponse
    {
        $plainToken = $request->cookie($this->cookieName);

        try {
            if (! is_string($plainToken)) {
                throw new InvalidRefreshTokenException;
            }

            return $this->sessionResponse($this->sessionService->refresh($plainToken));
        } catch (InvalidRefreshTokenException $exception) {
            // A dead cookie is removed, so the front end stops sending it.
            return $exception->render()->withCookie($this->expiredCookie());
        }
    }

    /**
     * POST /auth/logout (US-02): revokes the session and removes the cookie.
     */
    public function logout(Request $request): Response
    {
        $plainToken = $request->cookie($this->cookieName);
        $this->sessionService->end(is_string($plainToken) ? $plainToken : null);

        return response()->noContent()->withCookie($this->expiredCookie());
    }

    private function sessionResponse(Session $session): JsonResponse
    {
        return (new JsonResponse([
            'accessToken' => $session->accessToken->accessToken,
            'tokenType' => 'Bearer',
            'expiresIn' => $session->accessToken->expiresIn,
        ]))->withCookie($this->refreshCookie($session->refreshToken, $session->refreshExpiresAt));
    }

    private function refreshCookie(string $value, CarbonImmutable $expiresAt): Cookie
    {
        return Cookie::create($this->cookieName)
            ->withValue($value)
            ->withExpires($expiresAt)
            ->withPath(self::COOKIE_PATH)
            ->withSecure($this->secureCookie)
            // Unreadable from JavaScript: a malicious script cannot steal it.
            ->withHttpOnly(true)
            // Never sent along with a request coming from another site.
            ->withSameSite(Cookie::SAMESITE_STRICT);
    }

    private function expiredCookie(): Cookie
    {
        return $this->refreshCookie('', CarbonImmutable::createFromTimestamp(1));
    }
}
