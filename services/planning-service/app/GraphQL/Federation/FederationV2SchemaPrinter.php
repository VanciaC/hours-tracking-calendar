<?php declare(strict_types=1);

namespace App\GraphQL\Federation;

use GraphQL\Language\AST\Node;
use GraphQL\Type\Definition\EnumType;
use GraphQL\Type\Definition\InputObjectType;
use GraphQL\Type\Definition\ScalarType;
use GraphQL\Type\Definition\UnionType;
use Nuwave\Lighthouse\Federation\SchemaPrinter as LighthouseFederationSchemaPrinter;

/**
 * Printer utilisé pour générer le SDL renvoyé par `_service { sdl }`.
 *
 * Le printer d'origine de Lighthouse n'imprime les directives de federation
 * que sur les types objet et sur leurs champs. Les autres emplacements
 * autorisés par la spec Federation 2 sont ignorés en silence, notamment
 * - les arguments (ARGUMENT_DEFINITION)
 * - les interfaces (INTERFACE)
 * - les enums et leurs valeurs (ENUM, ENUM_VALUE)
 * - les unions (UNION)
 * - les scalaires (SCALAR)
 * - les inputs et leurs champs (INPUT_OBJECT, INPUT_FIELD_DEFINITION)
 *
 * Conséquence sans cet override, un `@inaccessible` ou un `@tag` posé sur
 * une valeur d'enum ou un argument n'arrive jamais jusqu'au router.
 */
class FederationV2SchemaPrinter extends LighthouseFederationSchemaPrinter
{
    /**
     * Noms des directives à conserver dans le SDL, renseignés par FederationV2Printer.
     *
     * @var array<int, string>
     */
    public static array $federationDirectives = [];

    /** Imprime uniquement les directives de federation présentes sur un nœud AST. */
    public static function federationDirectivesOf(?Node $astNode): string
    {
        if ($astNode === null || ! property_exists($astNode, 'directives')) {
            return '';
        }

        $directivesToPrint = [];
        foreach ($astNode->directives as $directive) {
            if (in_array($directive->name->value, static::$federationDirectives, true)) {
                $directivesToPrint[] = $directive;
            }
        }

        return static::printDirectives($directivesToPrint);
    }

    /** Arguments de champ et champs d'input. */
    protected static function printInputValue($arg): string
    {
        return parent::printInputValue($arg)
            . static::federationDirectivesOf($arg->astNode);
    }

    protected static function printScalar(ScalarType $type, array $options): string
    {
        return parent::printScalar($type, $options)
            . static::federationDirectivesOf($type->astNode);
    }

    protected static function printUnion(UnionType $type, array $options): string
    {
        $types = $type->getTypes();
        $types = $types === []
            ? ''
            : ' = ' . implode(' | ', array_map(static fn ($t): string => $t->name, $types));

        return static::printDescription($options, $type)
            . 'union ' . $type->name
            . static::federationDirectivesOf($type->astNode)
            . $types;
    }

    protected static function printEnum(EnumType $type, array $options): string
    {
        $values = [];
        $firstInBlock = true;

        foreach ($type->getValues() as $value) {
            $values[] = static::printDescription($options, $value, '  ', $firstInBlock)
                . '  '
                . $value->name
                . static::printDeprecated($value)
                . static::federationDirectivesOf($value->astNode);
            $firstInBlock = false;
        }

        return static::printDescription($options, $type)
            . "enum {$type->name}"
            . static::federationDirectivesOf($type->astNode)
            . static::printBlock($values);
    }

    protected static function printInputObject(InputObjectType $type, array $options): string
    {
        $fields = [];
        $firstInBlock = true;

        foreach ($type->getFields() as $field) {
            $fields[] = static::printDescription($options, $field, '  ', $firstInBlock)
                . '  '
                . static::printInputValue($field);
            $firstInBlock = false;
        }

        return static::printDescription($options, $type)
            . "input {$type->name}"
            . static::federationDirectivesOf($type->astNode)
            . static::printBlock($fields);
    }
}
