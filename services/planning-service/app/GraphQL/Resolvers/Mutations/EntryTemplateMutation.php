<?php

declare(strict_types=1);

namespace App\GraphQL\Resolvers\Mutations;

use App\DataTransferObjects\EntryTemplateData;
use App\Models\EntryTemplate;
use App\Services\EntryTemplateService;
use Nuwave\Lighthouse\Exceptions\AuthenticationException;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;

/**
 * Entry template mutations, always on the authenticated user's templates.
 */
final class EntryTemplateMutation
{
    public function __construct(
        private readonly EntryTemplateService $entryTemplateService,
    ) {}

    /**
     * @param  array{input: array<string, mixed>}  $args
     */
    public function createEntryTemplate(mixed $root, array $args, GraphQLContext $context): EntryTemplate
    {
        return $this->entryTemplateService->saveTemplate(
            $this->requesterId($context),
            null,
            EntryTemplateData::fromInput($args['input']),
        );
    }

    /**
     * @param  array{id: string, input: array<string, mixed>}  $args
     */
    public function updateEntryTemplate(mixed $root, array $args, GraphQLContext $context): EntryTemplate
    {
        return $this->entryTemplateService->saveTemplate(
            $this->requesterId($context),
            (int) $args['id'],
            EntryTemplateData::fromInput($args['input']),
        );
    }

    /**
     * @param  array{id: string}  $args
     */
    public function deleteEntryTemplate(mixed $root, array $args, GraphQLContext $context): EntryTemplate
    {
        return $this->entryTemplateService->deleteTemplate($this->requesterId($context), (int) $args['id']);
    }

    private function requesterId(GraphQLContext $context): int
    {
        $user = $context->user();

        // @guard already rejects anonymous requests; this keeps the resolver safe on its own.
        if ($user === null) {
            throw new AuthenticationException(AuthenticationException::MESSAGE);
        }

        return (int) $user->getAuthIdentifier();
    }
}
