<?php declare(strict_types=1);

namespace App\GraphQL\Federation;

use GraphQL\Type\Definition\Directive;
use GraphQL\Type\Definition\FieldDefinition;
use GraphQL\Type\Definition\ObjectType;
use GraphQL\Type\Schema;
use GraphQL\Type\SchemaConfig;
use Illuminate\Support\Arr;
use Nuwave\Lighthouse\Federation\FederationHelper;
use Nuwave\Lighthouse\Federation\FederationPrinter;
use Nuwave\Lighthouse\Schema\RootType;

/**
 * Remplace Nuwave\Lighthouse\Federation\FederationPrinter::print().
 *
 * Même logique que l'original (on retire les types et champs techniques
 * de federation, on garde les directives de federation) mais l'impression
 * passe par FederationV2SchemaPrinter, qui couvre tous les emplacements
 * de directives prévus par la spec.
 */
class FederationV2Printer
{
    public static function print(Schema $schema): string
    {
        $config = SchemaConfig::create();

        $types = $schema->getTypeMap();
        foreach (FederationPrinter::FEDERATION_TYPES as $type) {
            unset($types[$type]);
        }

        $originalQueryType = Arr::pull($types, RootType::QUERY);
        assert($originalQueryType instanceof ObjectType);

        $queryFieldsWithoutFederation = array_filter(
            $originalQueryType->getFields(),
            static fn (FieldDefinition $field): bool => ! in_array($field->name, FederationPrinter::FEDERATION_FIELDS, true),
        );
        $config->setQuery(
            $queryFieldsWithoutFederation !== []
                ? new ObjectType([
                    'name' => RootType::QUERY,
                    'fields' => $queryFieldsWithoutFederation,
                    'interfaces' => $originalQueryType->getInterfaces(),
                    'astNode' => $originalQueryType->astNode,
                ])
                : null,
        );
        $config->setMutation(Arr::pull($types, RootType::MUTATION));
        $config->setSubscription(Arr::pull($types, RootType::SUBSCRIPTION));
        $config->setTypes($types);

        $federationDirectives = array_merge(
            FederationPrinter::FEDERATION_DIRECTIVES,
            FederationHelper::directivesToCompose($schema),
        );

        $config->setDirectives(array_filter(
            $schema->getDirectives(),
            static fn (Directive $directive): bool => ! in_array($directive->name, $federationDirectives, true),
        ));
        $config->setExtensionASTNodes($schema->extensionASTNodes);

        FederationV2SchemaPrinter::$federationDirectives = $federationDirectives;

        return FederationV2SchemaPrinter::doPrint(
            new Schema($config),
            // Types objet, interfaces et champs passent par cette option.
            ['printDirectives' => static fn ($definition): string => FederationV2SchemaPrinter::federationDirectivesOf($definition->astNode ?? null)],
        );
    }
}
