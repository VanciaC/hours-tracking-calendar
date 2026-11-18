<?php

declare(strict_types=1);

namespace Tests\Feature\GraphQL;

use App\Auth\AuthenticatedUser;
use App\Enums\Role;
use App\Exceptions\AccessDeniedException;
use App\GraphQL\Entities\User;
use Nuwave\Lighthouse\Exceptions\AuthenticationException;
use Tests\TestCase;

final class UserEntityTest extends TestCase
{
    public function test_a_user_resolves_themself(): void
    {
        $this->actingAs(new AuthenticatedUser(1));

        $this->assertSame(['__typename' => 'User', 'id' => '1'], $this->resolve('1'));
    }

    public function test_a_user_cannot_resolve_someone_else(): void
    {
        $this->actingAs(new AuthenticatedUser(1));

        $this->expectException(AccessDeniedException::class);

        $this->resolve('2');
    }

    public function test_an_admin_resolves_another_user(): void
    {
        $this->actingAs(new AuthenticatedUser(1, Role::Admin));

        $this->assertSame(['__typename' => 'User', 'id' => '2'], $this->resolve('2'));
    }

    public function test_an_anonymous_visitor_is_refused(): void
    {
        $this->expectException(AuthenticationException::class);

        $this->resolve('1');
    }

    /**
     * @return array{__typename: string, id: string}
     */
    private function resolve(string $id): array
    {
        return $this->app->make(User::class)(['__typename' => 'User', 'id' => $id]);
    }
}
